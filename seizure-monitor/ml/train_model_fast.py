#!/usr/bin/env python3
"""
Fast version: Downsample majority class instead of upsampling minority
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
from pathlib import Path

print("=" * 80)
print("SEIZURE DETECTION MODEL TRAINING (FAST VERSION)")
print("=" * 80)

# Step 1: Combine all batch CSVs
print("\n[1/5] Combining all 25 batch CSVs...")
data_dir = Path("processed_data")
batch_files = sorted(data_dir.glob("batch*_all_features.csv"))
print(f"Found {len(batch_files)} batch files")

all_data = []
for batch_file in batch_files:
    print(f"  Loading {batch_file.name}...", end=" ")
    df = pd.read_csv(batch_file)
    print(f"{len(df):,} samples")
    all_data.append(df)

combined_df = pd.concat(all_data, ignore_index=True)
print(f"\nTotal samples: {len(combined_df):,}")

# Step 2: Remove pre-ictal and NaN
print("\n[2/5] Cleaning data...")
df_filtered = combined_df.dropna(subset=['label']).copy()
df_filtered = df_filtered[df_filtered['label'] != 1].copy()
df_filtered['label'] = df_filtered['label'].map({0: 0, 2: 1})
print(f"Samples: {len(df_filtered):,}")
print(f"Labels: {df_filtered['label'].value_counts().to_dict()}")

# Step 3: Downsample majority class
print("\n[3/5] Balancing with downsampling...")
df_ictal = df_filtered[df_filtered['label'] == 1]
df_interictal = df_filtered[df_filtered['label'] == 0]

print(f"Ictal samples: {len(df_ictal):,}")
print(f"Inter-ictal samples: {len(df_interictal):,}")

# Downsample inter-ictal to 2x ictal samples for better balance
target_interictal = min(len(df_ictal) * 2, len(df_interictal))
df_interictal_sampled = df_interictal.sample(n=target_interictal, random_state=42)

df_balanced = pd.concat([df_ictal, df_interictal_sampled], ignore_index=True)
df_balanced = df_balanced.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"Balanced dataset: {len(df_balanced):,} samples")
print(f"Labels: {df_balanced['label'].value_counts().to_dict()}")

# Step 4: Prepare features
print("\n[4/5] Preparing features...")
feature_cols = [col for col in df_balanced.columns if col not in
                ['event_id', 'userId', 'run', 'dataTime', 'window_start', 'window_end', 'label']]
print(f"Features ({len(feature_cols)}): {feature_cols}")

df_balanced[feature_cols] = df_balanced[feature_cols].fillna(0)
X = df_balanced[feature_cols].values
y = df_balanced['label'].values

# Split
X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.2, random_state=42, stratify=y_temp)

print(f"Train: {len(X_train):,}, Val: {len(X_val):,}, Test: {len(X_test):,}")

# Step 5: Train model
print("\n[5/5] Training Random Forest...")
model = RandomForestClassifier(n_estimators=100, max_depth=20, random_state=42, n_jobs=-1, verbose=1)
model.fit(X_train, y_train)

# Validation results
print("\n" + "=" * 80)
print("VALIDATION RESULTS")
print("=" * 80)
y_val_pred = model.predict(X_val)
y_val_proba = model.predict_proba(X_val)[:, 1]

print("\nClassification Report:")
print(classification_report(y_val, y_val_pred, target_names=['Inter-ictal', 'Ictal'], digits=4))

cm = confusion_matrix(y_val, y_val_pred)
print("Confusion Matrix:")
print(f"                Predicted")
print(f"                Inter-ictal  Ictal")
print(f"Actual Inter-ictal  {cm[0][0]:8d}  {cm[0][1]:8d}")
print(f"       Ictal        {cm[1][0]:8d}  {cm[1][1]:8d}")

print("\nMetrics:")
print(f"  Accuracy:  {accuracy_score(y_val, y_val_pred):.4f}")
print(f"  Precision: {precision_score(y_val, y_val_pred):.4f}")
print(f"  Recall:    {recall_score(y_val, y_val_pred):.4f}")
print(f"  F1-Score:  {f1_score(y_val, y_val_pred):.4f}")
print(f"  ROC-AUC:   {roc_auc_score(y_val, y_val_proba):.4f}")

# Test results
print("\n" + "=" * 80)
print("TEST RESULTS")
print("=" * 80)
y_test_pred = model.predict(X_test)
y_test_proba = model.predict_proba(X_test)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_test_pred, target_names=['Inter-ictal', 'Ictal'], digits=4))

cm = confusion_matrix(y_test, y_test_pred)
print("Confusion Matrix:")
print(f"                Predicted")
print(f"                Inter-ictal  Ictal")
print(f"Actual Inter-ictal  {cm[0][0]:8d}  {cm[0][1]:8d}")
print(f"       Ictal        {cm[1][0]:8d}  {cm[1][1]:8d}")

print("\nMetrics:")
print(f"  Accuracy:  {accuracy_score(y_test, y_test_pred):.4f}")
print(f"  Precision: {precision_score(y_test, y_test_pred):.4f}")
print(f"  Recall:    {recall_score(y_test, y_test_pred):.4f}")
print(f"  F1-Score:  {f1_score(y_test, y_test_pred):.4f}")
print(f"  ROC-AUC:   {roc_auc_score(y_test, y_test_proba):.4f}")

# Feature importance
print("\n" + "=" * 80)
print("FEATURE IMPORTANCE")
print("=" * 80)
importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop Features:")
for _, row in importance_df.iterrows():
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
