# Seizure Detection Model - Improvement Guide

## Current Best Performance Summary

### Baseline Model (2:1 Balanced)
- **Accuracy:** 88.83%
- **Recall:** 88.88% (missed 11.1% of seizures)
- **Precision:** 79.87%
- **False Alarm Rate:** 11.2%
- **F1-Score:** 84.13%
- **ROC-AUC:** 95.56%

### Optimized Model (After Hyperparameter Tuning)
- **Accuracy:** 88.24%
- **Recall:** 93.50% ⬆️ (missed only 6.5% of seizures) ✓
- **Precision:** 76.46% ⬇️
- **False Alarm Rate:** 14.4% ⬆️
- **F1-Score:** 84.12%
- **ROC-AUC:** 95.63%

**Key Improvement:** Reduced missed seizures from 11.1% → 6.5% (41% reduction in missed seizures!)

---

## Tested Improvement Strategies

### 1. ✅ Model Architecture
**Status:** TESTED

**Results:**
- Random Forest (baseline): F1 = 0.8395
- Random Forest (deeper): F1 = 0.8408 ⬆️
- Gradient Boosting: F1 = 0.8321 ⬇️

**Winner:** Deeper Random Forest (300 trees, depth=30)

**Next to try:**
- XGBoost
- LightGBM
- Neural Networks (LSTM for temporal patterns)
- Ensemble voting (combine multiple models)

### 2. ✅ Feature Engineering
**Status:** TESTED

**Key Findings:**
- EEG band ratios are highly predictive
- 6 of top 11 features are engineered features
- Total power features add value

**Engineered Features Added:**
- `eeg_delta_theta_ratio`
- `eeg_delta_alpha_ratio`
- `eeg_theta_alpha_ratio`
- `eeg_low_high_ratio`
- `eeg_total_power`
- `eeg_delta_power_pct`
- `eeg_theta_power_pct`
- `emg_mov_interaction`
- `movement_intensity`
- `hr_emg_ratio`

**Results:** Similar performance to baseline, but more interpretable features

**Next to try:**
- Temporal features (rolling windows, derivatives, trends)
- Statistical moments (skewness, kurtosis)
- Cross-channel correlations
- Frequency domain features (spectral entropy, peak frequency)

### 3. ✅ Hyperparameter Tuning
**Status:** TESTED

**Best Parameters Found:**
- `n_estimators`: 400
- `max_depth`: 20
- `min_samples_split`: 10
- `min_samples_leaf`: 4
- `max_features`: sqrt
- `class_weight`: balanced_subsample

**Impact:** **Major improvement in recall (88.88% → 93.50%)**

**Trade-off:** Slightly higher false alarm rate (11.2% → 14.4%)

---

## Additional Improvement Strategies (Not Yet Tested)

### 4. ⏳ Data Balancing Strategies
**Current:** 2:1 (inter-ictal:ictal) downsampling

**To try:**
- **SMOTE** (Synthetic Minority Over-sampling)
- **ADASYN** (Adaptive Synthetic Sampling)
- Different ratios (1:1, 3:1, 4:1)
- Cost-sensitive learning with custom loss weights

### 5. ⏳ Threshold Optimization
**Current:** Using default 0.5 probability threshold

**To try:**
- Optimize threshold based on clinical priorities
- If missing seizures is worse than false alarms, lower threshold
- ROC curve analysis to find optimal threshold
- Precision-Recall curve optimization

**Example:**
```python
# Adjust threshold to prioritize recall
threshold = 0.3  # Lower threshold = more sensitive
y_pred = (y_proba >= threshold).astype(int)
```

### 6. ⏳ Temporal/Sequential Modeling
**Current:** Each 4-second window treated independently

**To try:**
- **LSTM/GRU networks** to capture temporal patterns
- **Sliding window aggregation** (e.g., predict based on last 5 windows)
- **Transition modeling** (model state changes)
- **Time series features** (trends, momentum)

### 7. ⏳ Ensemble Methods
**To try:**
- Stacking multiple models (RF + XGBoost + LogReg)
- Voting classifier (hard/soft voting)
- Blending predictions from different feature sets

### 8. ⏳ Data Augmentation
**To try:**
- Add noise to minority class
- Time warping
- Magnitude scaling
- Interpolation between samples

### 9. ⏳ Cross-Validation Strategy
**Current:** Simple train/test split

**To try:**
- **Stratified K-fold** cross-validation
- **Leave-one-subject-out** CV (test generalization to new patients)
- **Time-series split** (respect temporal ordering)

### 10. ⏳ Feature Selection
**To try:**
- Remove low-importance features (hrv = 0.00)
- Recursive feature elimination (RFE)
- LASSO for feature selection
- Correlation analysis to remove redundant features

---

## Quick Wins (Recommended Next Steps)

### Priority 1: Threshold Optimization 🎯
**Effort:** Low | **Impact:** High

Adjust prediction threshold to balance precision/recall based on clinical needs.

```python
# If missing seizures is 3x worse than false alarms
thresholds = np.arange(0.2, 0.8, 0.05)
best_threshold = optimize_threshold(y_test, y_proba, weights={'fn': 3, 'fp': 1})
```

### Priority 2: Try XGBoost 🎯
**Effort:** Low | **Impact:** Medium-High

XGBoost often outperforms Random Forest on structured data.

```python
from xgboost import XGBClassifier
model = XGBClassifier(n_estimators=300, max_depth=10, learning_rate=0.1)
```

### Priority 3: Add Temporal Features 🎯
**Effort:** Medium | **Impact:** High

Seizures have temporal evolution - capture this with rolling statistics.

```python
# Add rolling mean/std of last N windows
df['eeg_delta_rolling_mean'] = df.groupby('event_id')['eeg_delta'].rolling(5).mean()
df['eeg_delta_rolling_std'] = df.groupby('event_id')['eeg_delta'].rolling(5).std()
```

### Priority 4: SMOTE Oversampling 🎯
**Effort:** Low | **Impact:** Medium

Better balance without losing data.

```python
from imblearn.over_sampling import SMOTE
smote = SMOTE(random_state=42, k_neighbors=5)
X_balanced, y_balanced = smote.fit_resample(X_train, y_train)
```

---

## Performance Targets

### Clinical Benchmarks
- **Minimum Recall:** >90% (miss <10% of seizures)
- **Target Recall:** >95% (miss <5% of seizures)
- **Maximum False Alarm Rate:** <20%
- **Target False Alarm Rate:** <10%

### Current Status vs Targets
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Recall | 93.50% | >95% | 🟡 Close |
| Missed Seizures | 6.5% | <5% | 🟡 Close |
| False Alarm Rate | 14.4% | <10% | 🔴 Needs work |
| ROC-AUC | 95.63% | >95% | ✅ Good |

---

## Model Versions Summary

| Version | Features | Recall | Precision | F1 | False Alarms |
|---------|----------|--------|-----------|----|--------------|
| v1_baseline | 10 orig | 88.88% | 79.87% | 84.13% | 11.2% |
| v2_deeper_rf | 10 orig | 88.83% | 79.82% | 84.08% | 11.2% |
| v3_enhanced_features | 20 engineered | 88.67% | 79.61% | 83.89% | 11.4% |
| v4_tuned_hyperparams | 10 orig | **93.50%** | 76.46% | 84.12% | 14.4% |

**Best for Recall:** v4_tuned_hyperparams (misses only 6.5% of seizures)
**Best for Precision:** v1_baseline (lowest false alarm rate at 11.2%)

---

## Recommendation

**For Production Use:**
Use **v4_tuned_hyperparams** if **clinical priority is not missing seizures** (e.g., safety-critical application).

**Next Development Steps:**
1. Implement threshold optimization to reduce false alarms while maintaining high recall
2. Try XGBoost with same hyperparameter tuning approach
3. Add temporal/rolling features to capture seizure evolution
4. Consider ensemble of v1 + v4 for best of both worlds

---

## Feature Importance Rankings

### Top 10 Most Predictive Features
1. **eeg_delta** (29.86%) - Low frequency brain waves
2. **eeg_theta** (24.17%) - Theta band power
3. **eeg_beta** (23.88%) - Beta band power
4. **eeg_alpha** (19.72%) - Alpha band power
5. **emg_rms** (0.70%) - Muscle activity
6. **mov_mag** (0.53%) - Movement magnitude
7. **emg_var** (0.49%) - Muscle activity variance
8. **mov_std** (0.43%) - Movement variability
9. **hr** (0.21%) - Heart rate
10. **hrv** (0.00%) - Heart rate variability (not predictive)

**Key Insight:** EEG features dominate (97%+ of importance). Consider:
- Removing `hrv` (zero importance)
- Collecting more EEG channels if possible
- Focus feature engineering on EEG features

---

## Code Snippets for Quick Improvements

### 1. Load Optimized Model
```python
import joblib
model = joblib.load('models/seizure_detector_rf_balanced_2to1.pkl')
```

### 2. Adjust Threshold for Higher Recall
```python
# Get probabilities
y_proba = model.predict_proba(X_test)[:, 1]

# Use lower threshold for higher sensitivity
threshold = 0.35  # Lower = catch more seizures
y_pred = (y_proba >= threshold).astype(int)
```

### 3. Try XGBoost
```python
from xgboost import XGBClassifier

model = XGBClassifier(
    n_estimators=400,
    max_depth=10,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=2,  # Account for 2:1 ratio
    random_state=42
)
model.fit(X_train, y_train)
```

### 4. Create Ensemble
```python
from sklearn.ensemble import VotingClassifier

ensemble = VotingClassifier(
    estimators=[
        ('rf_baseline', model_baseline),
        ('rf_tuned', model_tuned),
        ('xgb', xgb_model)
    ],
    voting='soft',  # Use probability averaging
    weights=[1, 2, 1]  # Give more weight to tuned model
)
ensemble.fit(X_train, y_train)
```

---

## Conclusion

The model has achieved strong performance with **93.5% recall** and **95.6% ROC-AUC**. The main area for improvement is reducing false alarms while maintaining high seizure detection. The recommended next steps are threshold optimization and trying XGBoost, which should push performance closer to clinical deployment targets.
