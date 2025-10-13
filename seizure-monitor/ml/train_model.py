#!/usr/bin/env python3
"""
Combine all batch CSVs, balance data, and train ML model
"""
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from imblearn.over_sampling import SMOTE
import joblib
from pathlib import Path

print("=" * 80)
print("SEIZURE DETECTION MODEL TRAINING")
print("=" * 80)

# Step 1: Combine all batch CSVs
print("\n[1/5] Combining all 25 batch CSVs...")
data_dir = Path("processed_data")
batch_files = sorted(data_dir.glob("batch*_all_features.csv"))

print(f"Found {len(batch_files)} batch files")

all_data = []
for i, batch_file in enumerate(batch_files, 1):
    print(f"  Loading {batch_file.name}...", end=" ")
    df = pd.read_csv(batch_file)
    print(f"{len(df):,} samples")
    all_data.append(df)

combined_df = pd.concat(all_data, ignore_index=True)
print(f"\nTotal samples: {len(combined_df):,}")
print(f"Label distribution: {combined_df['label'].value_counts().to_dict()}")

# Step 2: Remove pre-ictal data (label=1) and NaN labels
print("\n[2/5] Removing pre-ictal data (label=1) and cleaning NaN labels...")
# Remove NaN labels first
df_filtered = combined_df.dropna(subset=['label']).copy()
print(f"Samples after removing NaN labels: {len(df_filtered):,}")
# Remove pre-ictal data
df_filtered = df_filtered[df_filtered['label'] != 1].copy()
print(f"Samples after removing pre-ictal: {len(df_filtered):,}")
print(f"Label distribution: {df_filtered['label'].value_counts().to_dict()}")

# Remap labels: 0 stays 0 (inter-ictal), 2 becomes 1 (ictal)
df_filtered['label'] = df_filtered['label'].map({0: 0, 2: 1})
print(f"\nRemapped labels (0=inter-ictal, 1=ictal)")
print(f"Label distribution: {df_filtered['label'].value_counts().to_dict()}")

# Step 3: Prepare features
print("\n[3/5] Preparing features...")
# Select numeric feature columns (exclude metadata)
feature_cols = [col for col in df_filtered.columns if col not in
                ['event_id', 'userId', 'run', 'dataTime', 'window_start', 'window_end', 'label']]
print(f"Feature columns ({len(feature_cols)}): {feature_cols}")

# Fill NaN values
df_filtered[feature_cols] = df_filtered[feature_cols].fillna(0)

X = df_filtered[feature_cols].values
y = df_filtered['label'].values

print(f"\nFeature matrix shape: {X.shape}")
print(f"Label distribution:")
print(f"  Inter-ictal (0): {np.sum(y == 0):,} ({100 * np.sum(y == 0) / len(y):.2f}%)")
print(f"  Ictal (1): {np.sum(y == 1):,} ({100 * np.sum(y == 1) / len(y):.2f}%)")

# Step 4: Balance dataset using SMOTE
print("\n[4/5] Balancing dataset with SMOTE...")
print("Original class distribution:")
unique, counts = np.unique(y, return_counts=True)
for label, count in zip(unique, counts):
    print(f"  Class {label}: {count:,}")

# Use SMOTE for oversampling minority class
smote = SMOTE(random_state=42)
X_balanced, y_balanced = smote.fit_resample(X, y)

print("\nBalanced class distribution:")
unique, counts = np.unique(y_balanced, return_counts=True)
for label, count in zip(unique, counts):
    print(f"  Class {label}: {count:,}")

# Split into train/validation/test
X_temp, X_test, y_temp, y_test = train_test_split(
    X_balanced, y_balanced, test_size=0.2, random_state=42, stratify=y_balanced
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.2, random_state=42, stratify=y_temp
)

print(f"\nDataset splits:")
print(f"  Training: {len(X_train):,} samples")
print(f"  Validation: {len(X_val):,} samples")
print(f"  Test: {len(X_test):,} samples")

# Step 5: Train Random Forest model
print("\n[5/5] Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=10,
    min_samples_leaf=4,
    random_state=42,
    n_jobs=-1,
    verbose=1
)

print("Training model...")
model.fit(X_train, y_train)

# Evaluate on validation set
print("\n" + "=" * 80)
print("VALIDATION SET RESULTS")
print("=" * 80)
y_val_pred = model.predict(X_val)
y_val_proba = model.predict_proba(X_val)[:, 1]

print("\nClassification Report:")
print(classification_report(y_val, y_val_pred, target_names=['Inter-ictal', 'Ictal'], digits=4))

print("\nConfusion Matrix:")
cm = confusion_matrix(y_val, y_val_pred)
print(f"                Predicted")
print(f"                Inter-ictal  Ictal")
print(f"Actual Inter-ictal  {cm[0][0]:8d}  {cm[0][1]:8d}")
print(f"       Ictal        {cm[1][0]:8d}  {cm[1][1]:8d}")

print("\nDetailed Metrics:")
print(f"  Accuracy:  {accuracy_score(y_val, y_val_pred):.4f}")
print(f"  Precision: {precision_score(y_val, y_val_pred):.4f}")
print(f"  Recall:    {recall_score(y_val, y_val_pred):.4f}")
print(f"  F1-Score:  {f1_score(y_val, y_val_pred):.4f}")
print(f"  ROC-AUC:   {roc_auc_score(y_val, y_val_proba):.4f}")

# Evaluate on test set
print("\n" + "=" * 80)
print("TEST SET RESULTS")
print("=" * 80)
y_test_pred = model.predict(X_test)
y_test_proba = model.predict_proba(X_test)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_test_pred, target_names=['Inter-ictal', 'Ictal'], digits=4))

print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_test_pred)
print(f"                Predicted")
print(f"                Inter-ictal  Ictal")
print(f"Actual Inter-ictal  {cm[0][0]:8d}  {cm[0][1]:8d}")
print(f"       Ictal        {cm[1][0]:8d}  {cm[1][1]:8d}")

print("\nDetailed Metrics:")
print(f"  Accuracy:  {accuracy_score(y_test, y_test_pred):.4f}")
print(f"  Precision: {precision_score(y_test, y_test_pred):.4f}")
print(f"  Recall:    {recall_score(y_test, y_test_pred):.4f}")
print(f"  F1-Score:  {f1_score(y_test, y_test_pred):.4f}")
print(f"  ROC-AUC:   {roc_auc_score(y_test, y_test_proba):.4f}")

# Feature importance
print("\n" + "=" * 80)
print("FEATURE IMPORTANCE")
print("=" * 80)
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Most Important Features:")
for idx, row in feature_importance.head(10).iterrows():
    print(f"  {row['feature']:20s}: {row['importance']:.4f}")

# Save model
model_dir = Path("models")
model_dir.mkdir(exist_ok=True)
model_path = model_dir / "seizure_detector_rf.pkl"
joblib.dump(model, model_path)
print(f"\n✓ Model saved to: {model_path}")

print("\n" + "=" * 80)
print("TRAINING COMPLETE!")
print("=" * 80)
