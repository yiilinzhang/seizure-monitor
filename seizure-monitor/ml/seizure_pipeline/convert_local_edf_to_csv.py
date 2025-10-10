#!/usr/bin/env python3
"""
Convert local EDF files to CSV with multi-modal feature extraction
Local version for testing on sub-001 sample
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import pandas as pd
import numpy as np
import pyedflib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LocalEdfProcessor:
    """Process local EDF files and extract features"""

    def __init__(self, input_dir: str, output_dir: str,
                 pre_ictal_minutes: int = 5, window_sec: int = 4):
        """
        Initialize processor

        Args:
            input_dir: Directory with EDF files (e.g., ds005873-download)
            output_dir: Output directory for CSV files
            pre_ictal_minutes: Minutes before seizure for pre-ictal label
            window_sec: Window size for feature extraction
        """
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.pre_ictal_sec = pre_ictal_minutes * 60
        self.window_sec = window_sec

        # Create output subdirectories
        self.subject_dir = self.output_dir / 'subject_csvs'
        self.subject_dir.mkdir(exist_ok=True)
        self.combined_dir = self.output_dir / 'combined'
        self.combined_dir.mkdir(exist_ok=True)

    def find_subjects(self) -> List[str]:
        """Find all subjects in input directory"""
        subjects = []
        for item in self.input_dir.iterdir():
            if item.is_dir() and item.name.startswith('sub-'):
                subjects.append(item.name)
        return sorted(subjects)

    def process_subject(self, subject_id: str) -> Optional[pd.DataFrame]:
        """
        Process all data for a single subject

        Args:
            subject_id: Subject identifier (e.g., 'sub-001')

        Returns:
            DataFrame with extracted features or None if failed
        """
        logger.info(f"Processing {subject_id}...")

        subject_path = self.input_dir / subject_id / 'ses-01'
        if not subject_path.exists():
            logger.warning(f"Subject path not found: {subject_path}")
            return None

        all_features = []

        # Process each modality
        for modality in ['ecg', 'eeg', 'emg', 'mov']:
            modality_path = subject_path / modality
            if not modality_path.exists():
                logger.debug(f"Skipping {modality} (not found)")
                continue

            # Find all EDF files
            edf_files = sorted(modality_path.glob('*.edf'))

            for edf_file in edf_files:
                # Extract run number
                filename = edf_file.name
                if 'run-' not in filename:
                    continue

                run_num = filename.split('run-')[1].split('_')[0]

                # Get events file if in EEG
                events = None
                if modality == 'eeg':
                    events_file = subject_path / 'eeg' / f"{subject_id}_ses-01_task-szMonitoring_run-{run_num}_events.tsv"
                    if events_file.exists():
                        events = self.parse_events(events_file)

                # Extract features
                logger.info(f"  Processing {modality} run-{run_num}")
                features = self.extract_features_from_edf(
                    edf_file, modality, subject_id, run_num, events
                )

                if features:
                    all_features.extend(features)

        if all_features:
            # Create DataFrame
            df = pd.DataFrame(all_features)

            # Sort by time
            if 'window_start' in df.columns:
                df = df.sort_values(['run', 'window_start'])

            # Save subject CSV
            output_file = self.subject_dir / f"{subject_id}_features.csv"
            df.to_csv(output_file, index=False)
            logger.info(f"✓ Saved {len(df)} samples for {subject_id} to {output_file}")

            # Show label distribution
            if 'label' in df.columns:
                label_dist = df['label'].value_counts().to_dict()
                logger.info(f"  Label distribution: {label_dist}")

            return df
        else:
            logger.warning(f"No features extracted for {subject_id}")
            return None

    def extract_features_from_edf(self, edf_path: Path, modality: str,
                                   subject_id: str, run_num: str,
                                   events: Optional[List] = None) -> List[Dict]:
        """Extract windowed features from EDF file"""
        try:
            # Read EDF file
            f = pyedflib.EdfReader(str(edf_path))
            n_signals = f.signals_in_file

            if n_signals == 0:
                f.close()
                return []

            # Get signal info
            signal_labels = f.getSignalLabels()
            sample_freqs = [f.getSampleFrequency(i) for i in range(n_signals)]

            # Read signals
            if modality == 'eeg' and n_signals > 1:
                # Read first few EEG channels
                signals = []
                for i in range(min(n_signals, 8)):
                    signals.append(f.readSignal(i))
                signals = np.array(signals)
                sample_rate = sample_freqs[0]
            else:
                # Single channel
                signal = f.readSignal(0)
                sample_rate = sample_freqs[0]
                signals = signal.reshape(1, -1)

            duration_sec = f.file_duration
            f.close()

            # Extract features in windows
            features = []
            window_samples = int(self.window_sec * sample_rate)

            for start_sec in range(0, int(duration_sec) - self.window_sec, self.window_sec):
                start_sample = int(start_sec * sample_rate)
                end_sample = start_sample + window_samples

                if end_sample > signals.shape[1]:
                    break

                window_signal = signals[:, start_sample:end_sample]

                # Create feature dict
                feature_dict = {
                    'event_id': f"{subject_id}_run{run_num}_{start_sec}",
                    'userId': subject_id,
                    'run': run_num,
                    'dataTime': f"2000-01-01 {start_sec//3600:02d}:{(start_sec%3600)//60:02d}:{start_sec%60:02d}",
                    'window_start': start_sec,
                    'window_end': start_sec + self.window_sec,
                }

                # Extract modality-specific features
                if modality == 'ecg':
                    hr, hrv = self.extract_hr_from_ecg(window_signal[0], sample_rate)
                    feature_dict['hr'] = hr
                    feature_dict['hrv'] = hrv

                elif modality == 'eeg':
                    powers = self.extract_eeg_features(window_signal, sample_rate)
                    feature_dict.update(powers)

                elif modality == 'emg':
                    feature_dict['emg_rms'] = float(np.sqrt(np.mean(window_signal[0]**2)))
                    feature_dict['emg_var'] = float(np.var(window_signal[0]))

                elif modality == 'mov':
                    feature_dict['mov_mag'] = float(np.sqrt(np.mean(window_signal[0]**2)))
                    feature_dict['mov_std'] = float(np.std(window_signal[0]))

                # Add label
                feature_dict['label'] = self.get_temporal_label(start_sec, events)

                features.append(feature_dict)

            return features

        except Exception as e:
            logger.error(f"Error processing {edf_path}: {e}")
            return []

    def extract_hr_from_ecg(self, ecg_signal: np.ndarray,
                             sample_rate: float) -> Tuple[float, float]:
        """Extract heart rate and HRV from ECG"""
        try:
            from scipy.signal import find_peaks

            # Find R-peaks
            min_distance = int(0.6 * sample_rate)
            height = np.percentile(np.abs(ecg_signal), 75)

            peaks, _ = find_peaks(ecg_signal, distance=min_distance, height=height)

            if len(peaks) < 2:
                return 60.0, 0.0

            # Calculate RR intervals
            rr_intervals = np.diff(peaks) / sample_rate

            # Heart rate
            hr = 60 / np.mean(rr_intervals) if len(rr_intervals) > 0 else 60.0

            # HRV (SDNN in ms)
            hrv = np.std(rr_intervals) * 1000 if len(rr_intervals) > 1 else 0.0

            # Clip to reasonable ranges
            hr = np.clip(hr, 30, 200)
            hrv = np.clip(hrv, 0, 200)

            return float(hr), float(hrv)

        except Exception as e:
            logger.debug(f"HR extraction error: {e}")
            return 60.0, 0.0

    def extract_eeg_features(self, eeg_signals: np.ndarray,
                              sample_rate: float) -> Dict[str, float]:
        """Extract EEG band powers"""
        try:
            from scipy.signal import welch

            powers = {
                'eeg_delta': [],
                'eeg_theta': [],
                'eeg_alpha': [],
                'eeg_beta': []
            }

            for channel in eeg_signals:
                freqs, psd = welch(channel, fs=sample_rate, nperseg=min(len(channel), 256))

                delta = np.mean(psd[(freqs >= 0.5) & (freqs < 4)])
                theta = np.mean(psd[(freqs >= 4) & (freqs < 8)])
                alpha = np.mean(psd[(freqs >= 8) & (freqs < 13)])
                beta = np.mean(psd[(freqs >= 13) & (freqs < 30)])

                powers['eeg_delta'].append(delta)
                powers['eeg_theta'].append(theta)
                powers['eeg_alpha'].append(alpha)
                powers['eeg_beta'].append(beta)

            return {k: float(np.mean(v)) for k, v in powers.items()}

        except Exception as e:
            logger.debug(f"EEG extraction error: {e}")
            return {
                'eeg_delta': 0.0,
                'eeg_theta': 0.0,
                'eeg_alpha': 0.0,
                'eeg_beta': 0.0
            }

    def parse_events(self, events_file: Path) -> List[Dict]:
        """Parse seizure events from TSV"""
        try:
            df = pd.read_csv(events_file, sep='\t')
            events = []

            for _, row in df.iterrows():
                if 'sz' in str(row.get('eventType', '')):
                    events.append({
                        'onset': float(row['onset']),
                        'duration': float(row['duration']),
                        'type': row.get('eventType', 'seizure')
                    })

            return events
        except Exception as e:
            logger.debug(f"Error parsing events: {e}")
            return []

    def get_temporal_label(self, timestamp: float,
                           events: Optional[List[Dict]]) -> int:
        """Get temporal label (0=inter, 1=pre, 2=ictal)"""
        if not events:
            return 0

        for event in events:
            onset = event['onset']
            duration = event['duration']

            # During seizure
            if timestamp >= onset and timestamp <= onset + duration:
                return 2

            # Pre-ictal
            if timestamp >= onset - self.pre_ictal_sec and timestamp < onset:
                return 1

        return 0

    def process_all_subjects(self, subjects: Optional[List[str]] = None):
        """Process all subjects"""
        if subjects is None:
            subjects = self.find_subjects()

        logger.info(f"Found {len(subjects)} subjects to process: {subjects}")

        all_dfs = []
        for subject_id in subjects:
            df = self.process_subject(subject_id)
            if df is not None:
                all_dfs.append(df)

        if all_dfs:
            logger.info("Combining all subject data...")
            combined_df = pd.concat(all_dfs, ignore_index=True)

            # Save combined
            output_file = self.combined_dir / 'all_features.csv'
            combined_df.to_csv(output_file, index=False)

            logger.info(f"\n{'='*50}")
            logger.info(f"✓ Processing Complete!")
            logger.info(f"{'='*50}")
            logger.info(f"Total samples: {len(combined_df):,}")
            logger.info(f"Output file: {output_file}")

            if 'label' in combined_df.columns:
                label_counts = combined_df['label'].value_counts().to_dict()
                logger.info(f"\nLabel Distribution:")
                for label in sorted(label_counts.keys()):
                    count = label_counts[label]
                    pct = (count / len(combined_df)) * 100
                    label_name = ['Inter-ictal', 'Pre-ictal', 'Ictal'][label]
                    logger.info(f"  {label_name} ({label}): {count:,} ({pct:.2f}%)")

            return combined_df
        else:
            logger.error("No data processed!")
            return None


def main():
    parser = argparse.ArgumentParser(description='Convert local EDF files to CSV')
    parser.add_argument('--input', required=True, help='Input directory with EDF files')
    parser.add_argument('--output', default='./processed_local', help='Output directory')
    parser.add_argument('--subjects', nargs='+', help='Specific subjects to process')
    parser.add_argument('--pre_ictal', type=int, default=5, help='Pre-ictal window (minutes)')
    parser.add_argument('--window', type=int, default=4, help='Feature window (seconds)')

    args = parser.parse_args()

    # Initialize processor
    processor = LocalEdfProcessor(
        input_dir=args.input,
        output_dir=args.output,
        pre_ictal_minutes=args.pre_ictal,
        window_sec=args.window
    )

    # Process subjects
    processor.process_all_subjects(subjects=args.subjects)


if __name__ == '__main__':
    main()
