/**
 * Seizure Prediction & Detection Service
 * Implements Monte Carlo fusion for multi-signal analysis
 * Core stance: Prediction = menthone-only, Detection = ALL three physio signals required
 */

export interface SensorData {
  menthone: {
    delta_pct: number;
    value: number;
    timestamp: number;
  };
  emg: {
    envelope: number; // 0-1 normalized
    timestamp: number;
  };
  hr: {
    bpm: number;
    baseline_bpm: number;
    timestamp: number;
  };
  spo2: {
    pct: number;
    timestamp: number;
  };
  quality?: {
    menthone: boolean;
    emg: boolean;
    hr: boolean;
    spo2: boolean;
  };
}

export interface PredictionOutput {
  predicted: boolean;
  confidence: number; // 0-1
  horizon_s: number; // ETA in seconds
  reason: string[];
  timestamp: number;
}

export interface DetectionOutput {
  active: boolean;
  confidence: number; // 0-1
  reason: string[];
  timestamp: number;
}

interface UserConfig {
  menthone: {
    thresh_pct: number;
    hold_s: number;
    slope_min: number;
  };
  emg: {
    env_thresh: number;
    hold_s: number;
  };
  hr: {
    factor_above_baseline: number;
    hold_s: number;
  };
  spo2: {
    min_pct: number;
    hold_s: number;
  };
  mc: {
    N: number;
    noise_estimates: {
      menthone: number;
      emg: number;
      hr: number;
      spo2: number;
    };
  };
  cooldown_s: number;
}

export class SeizurePredictor {
  private config: UserConfig;
  private dataBuffer: SensorData[] = [];
  private menthoneBaseline: number[] = [];
  private lastDetectionTime: number = 0;
  private predictionHistory: PredictionOutput[] = [];
  private detectionHistory: DetectionOutput[] = [];

  private readonly BUFFER_SIZE = 600; // 5 minutes at 2Hz
  private readonly BASELINE_WINDOW = 120; // 60 seconds for baseline

  constructor(userConfig?: Partial<UserConfig>) {
    // Default configuration
    this.config = {
      menthone: {
        thresh_pct: 15,
        hold_s: 5,
        slope_min: 0.5
      },
      emg: {
        env_thresh: 0.7,
        hold_s: 3
      },
      hr: {
        factor_above_baseline: 1.2,
        hold_s: 5
      },
      spo2: {
        min_pct: 94,
        hold_s: 5
      },
      mc: {
        N: 1000,
        noise_estimates: {
          menthone: 0.05,
          emg: 0.08,
          hr: 0.03,
          spo2: 0.02
        }
      },
      cooldown_s: 30,
      ...userConfig
    };
  }

  /**
   * Process new sensor data tick (called at 2Hz)
   */
  public processTick(data: SensorData): { prediction: PredictionOutput; detection: DetectionOutput } {
    // Store in circular buffer
    this.dataBuffer.push(data);
    if (this.dataBuffer.length > this.BUFFER_SIZE) {
      this.dataBuffer.shift();
    }

    // Update menthone baseline
    this.updateMenthoneBaseline(data.menthone.value);

    // Run prediction (menthone-only)
    const prediction = this.runPrediction(data);
    this.predictionHistory.push(prediction);

    // Run detection (requires ALL three physio signals)
    const detection = this.runDetection(data, prediction);
    this.detectionHistory.push(detection);

    return { prediction, detection };
  }

  /**
   * Menthone-only prediction model
   */
  private runPrediction(data: SensorData): PredictionOutput {
    const reasons: string[] = [];
    let confidence = 0;
    let predicted = false;
    let horizon_s = 0;

    // Check data quality
    if (data.quality && !data.quality.menthone) {
      return {
        predicted: false,
        confidence: 0,
        horizon_s: 0,
        reason: ['Menthone sensor unavailable'],
        timestamp: Date.now()
      };
    }

    // Calculate baseline
    const baseline = this.calculateRobustMedian(this.menthoneBaseline);
    const delta_pct = data.menthone.delta_pct;

    // Calculate slope (rate of change)
    const slope = this.calculateMenthoneSlope();

    // Check threshold persistence
    const persistence = this.checkPersistence('menthone', delta_pct > this.config.menthone.thresh_pct);

    // Prediction logic
    if (delta_pct > this.config.menthone.thresh_pct * 2) {
      predicted = true;
      confidence = 0.9;
      horizon_s = 300; // 5 minutes
      reasons.push(`Menthone spike: ${delta_pct.toFixed(1)}%`);
    } else if (delta_pct > this.config.menthone.thresh_pct && persistence > this.config.menthone.hold_s) {
      predicted = true;
      confidence = 0.7;
      horizon_s = 1800; // 30 minutes
      reasons.push(`Menthone elevated: ${delta_pct.toFixed(1)}% for ${persistence}s`);
    } else if (slope > this.config.menthone.slope_min) {
      predicted = true;
      confidence = 0.5;
      horizon_s = 3600; // 1 hour
      reasons.push(`Menthone rising: slope ${slope.toFixed(2)}`);
    } else {
      confidence = 0.9; // High confidence in no seizure
      reasons.push('Menthone levels normal');
    }

    return {
      predicted,
      confidence,
      horizon_s,
      reason: reasons,
      timestamp: Date.now()
    };
  }

  /**
   * Multi-signal detection with Monte Carlo confidence
   */
  private runDetection(data: SensorData, prediction: PredictionOutput): DetectionOutput {
    const reasons: string[] = [];

    // Check cooldown
    const now = Date.now();
    if (now - this.lastDetectionTime < this.config.cooldown_s * 1000) {
      return {
        active: false,
        confidence: 0,
        reason: ['Cooldown period active'],
        timestamp: now
      };
    }

    // Check data quality for ALL channels
    if (data.quality) {
      const unavailable = [];
      if (!data.quality.emg) unavailable.push('EMG');
      if (!data.quality.hr) unavailable.push('HR');
      if (!data.quality.spo2) unavailable.push('SpO2');

      if (unavailable.length > 0) {
        return {
          active: false,
          confidence: 0,
          reason: [`Channels unavailable: ${unavailable.join(', ')}`],
          timestamp: now
        };
      }
    }

    // Pre-condition: Menthone must be elevated (prediction YES)
    if (!prediction.predicted) {
      return {
        active: false,
        confidence: 0,
        reason: ['Menthone not elevated'],
        timestamp: now
      };
    }

    // Check individual physio signals
    const emgActive = this.checkEMG(data.emg);
    const hrActive = this.checkHR(data.hr);
    const spo2Active = this.checkSpO2(data.spo2);

    // CRITICAL: ALL three physio signals must be active
    const allPhysioActive = emgActive.active && hrActive.active && spo2Active.active;

    if (!allPhysioActive) {
      const inactive = [];
      if (!emgActive.active) inactive.push('EMG');
      if (!hrActive.active) inactive.push('HR');
      if (!spo2Active.active) inactive.push('SpO2');

      return {
        active: false,
        confidence: 0,
        reason: [`Insufficient physio signals: ${inactive.join(', ')} not active`],
        timestamp: now
      };
    }

    // Run Monte Carlo simulation for confidence
    const mcConfidence = this.runMonteCarlo(data, prediction);

    // Detection confirmed!
    if (mcConfidence > 0.7) {
      this.lastDetectionTime = now;

      reasons.push('Seizure detected');
      reasons.push(...emgActive.reason);
      reasons.push(...hrActive.reason);
      reasons.push(...spo2Active.reason);

      return {
        active: true,
        confidence: mcConfidence,
        reason: reasons,
        timestamp: now
      };
    }

    return {
      active: false,
      confidence: mcConfidence,
      reason: ['Confidence below threshold'],
      timestamp: now
    };
  }

  /**
   * Monte Carlo simulation for detection confidence
   */
  private runMonteCarlo(data: SensorData, prediction: PredictionOutput): number {
    let successCount = 0;

    for (let i = 0; i < this.config.mc.N; i++) {
      // Add Gaussian noise to each signal
      const noisyData: SensorData = {
        menthone: {
          ...data.menthone,
          delta_pct: this.addGaussianNoise(data.menthone.delta_pct, this.config.mc.noise_estimates.menthone)
        },
        emg: {
          ...data.emg,
          envelope: Math.max(0, Math.min(1, this.addGaussianNoise(data.emg.envelope, this.config.mc.noise_estimates.emg)))
        },
        hr: {
          ...data.hr,
          bpm: this.addGaussianNoise(data.hr.bpm, this.config.mc.noise_estimates.hr)
        },
        spo2: {
          ...data.spo2,
          pct: this.addGaussianNoise(data.spo2.pct, this.config.mc.noise_estimates.spo2)
        }
      };

      // Check if this noisy sample meets all criteria
      const emgActive = noisyData.emg.envelope > this.config.emg.env_thresh;
      const hrActive = noisyData.hr.bpm > noisyData.hr.baseline_bpm * this.config.hr.factor_above_baseline;
      const spo2Active = noisyData.spo2.pct < this.config.spo2.min_pct;
      const menthoneActive = noisyData.menthone.delta_pct > this.config.menthone.thresh_pct;

      if (menthoneActive && emgActive && hrActive && spo2Active) {
        successCount++;
      }
    }

    return successCount / this.config.mc.N;
  }

  /**
   * Helper functions
   */
  private updateMenthoneBaseline(value: number): void {
    this.menthoneBaseline.push(value);
    if (this.menthoneBaseline.length > this.BASELINE_WINDOW) {
      this.menthoneBaseline.shift();
    }
  }

  private calculateRobustMedian(values: number[]): number {
    if (values.length === 0) return 100; // Default baseline
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateMenthoneSlope(): number {
    if (this.dataBuffer.length < 10) return 0;

    const recent = this.dataBuffer.slice(-10);
    const x = recent.map((_, i) => i);
    const y = recent.map(d => d.menthone.delta_pct);

    // Linear regression
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private checkPersistence(signal: string, condition: boolean): number {
    let count = 0;
    for (let i = this.dataBuffer.length - 1; i >= 0; i--) {
      if (!condition) break;
      count++;
    }
    return count * 0.5; // Convert to seconds (2Hz sampling)
  }

  private checkEMG(emg: { envelope: number }): { active: boolean; reason: string[] } {
    const active = emg.envelope > this.config.emg.env_thresh;
    const reason = active ? [`EMG elevated: ${(emg.envelope * 100).toFixed(0)}%`] : [];
    return { active, reason };
  }

  private checkHR(hr: { bpm: number; baseline_bpm: number }): { active: boolean; reason: string[] } {
    const threshold = hr.baseline_bpm * this.config.hr.factor_above_baseline;
    const active = hr.bpm > threshold;
    const reason = active ? [`HR elevated: ${hr.bpm} bpm (baseline: ${hr.baseline_bpm})`] : [];
    return { active, reason };
  }

  private checkSpO2(spo2: { pct: number }): { active: boolean; reason: string[] } {
    const active = spo2.pct < this.config.spo2.min_pct;
    const reason = active ? [`SpO2 low: ${spo2.pct}%`] : [];
    return { active, reason };
  }

  private addGaussianNoise(value: number, stdDev: number): number {
    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return value + z0 * stdDev * value; // Proportional noise
  }

  /**
   * Post-event recalibration using OpenAI
   */
  public async recalibrateWithOpenAI(eventData: any): Promise<void> {
    // This would make an API call to OpenAI for analysis
    // For now, we'll implement a placeholder
    console.log('Recalibration triggered with event data:', eventData);
    // TODO: Implement OpenAI integration for threshold optimization
  }

  /**
   * Get current configuration
   */
  public getConfig(): UserConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<UserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const seizurePredictor = new SeizurePredictor();