#!/usr/bin/env python3
"""
Train seizure detection model on batch1 balanced data
Supports Random Forest, XGBoost, and simple Neural Network
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.preprocessing import StandardScaler
import joblib
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SeizureModelTrainer:
    """Train and evaluate seizure detection models"""

    def __init__(self, train_path: str, test_path: str, model_type: str = 'rf'):
        """
        Initialize trainer

        Args:
            train_path: Path to training CSV
            test_path: Path to test CSV
            model_type: Model type ('rf', 'xgb', 'nn')
        """
        self.train_path = Path(train_path)
        self.test_path = Path(test_path)
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()

        # Load data
        logger.info(f"Loading training data from {train_path}")
        self.train_df = pd.read_csv(train_path)
        logger.info(f"Loading test data from {test_path}")
        self.test_df = pd.read_csv(test_path)

        # Prepare features
        self.prepare_features()

    def prepare_features(self):
        """Prepare feature matrices and labels"""
        logger.info("Preparing features...")

        # Define feature columns (exclude metadata and label)
        exclude_cols = ['event_id', 'userId', 'run', 'dataTime',
                       'window_start', 'window_end', 'label']

        # Get feature columns
        feature_cols = [col for col in self.train_df.columns
                       if col not in exclude_cols]

        logger.info(f"Using {len(feature_cols)} features: {feature_cols}")

        # Extract features and labels
        self.X_train = self.train_df[feature_cols].values
        self.y_train = self.train_df['label'].values
        self.X_test = self.test_df[feature_cols].values
        self.y_test = self.test_df['label'].values

        # Handle missing values
        logger.info("Handling missing values...")
        self.X_train = np.nan_to_num(self.X_train, nan=0.0)
        self.X_test = np.nan_to_num(self.X_test, nan=0.0)

        # Scale features
        logger.info("Scaling features...")
        self.X_train = self.scaler.fit_transform(self.X_train)
        self.X_test = self.scaler.transform(self.X_test)

        # Log class distribution
        unique, counts = np.unique(self.y_train, return_counts=True)
        logger.info("Training set class distribution:")
        for label, count in zip(unique, counts):
            logger.info(f"  Label {label}: {count} samples ({count/len(self.y_train)*100:.2f}%)")

    def train_random_forest(self, n_estimators: int = 100, max_depth: int = 20):
        """Train Random Forest model"""
        logger.info(f"Training Random Forest (n_estimators={n_estimators}, max_depth={max_depth})...")

        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced',
            verbose=1
        )

        self.model.fit(self.X_train, self.y_train)
        logger.info("Training completed!")

    def train_xgboost(self, n_estimators: int = 100, max_depth: int = 6):
        """Train XGBoost model"""
        try:
            import xgboost as xgb
        except ImportError:
            logger.error("XGBoost not installed. Install with: pip install xgboost")
            return

        logger.info(f"Training XGBoost (n_estimators={n_estimators}, max_depth={max_depth})...")

        # Calculate scale_pos_weight for imbalanced data
        unique, counts = np.unique(self.y_train, return_counts=True)
        scale_pos_weight = counts[0] / counts[-1] if len(counts) > 1 else 1.0

        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1,
            scale_pos_weight=scale_pos_weight,
            eval_metric='mlogloss'
        )

        self.model.fit(
            self.X_train, self.y_train,
            eval_set=[(self.X_test, self.y_test)],
            verbose=True
        )
        logger.info("Training completed!")

    def train(self):
        """Train model based on model_type"""
        if self.model_type == 'rf':
            self.train_random_forest()
        elif self.model_type == 'xgb':
            self.train_xgboost()
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

    def evaluate(self):
        """Evaluate model on test set"""
        logger.info("Evaluating model on test set...")

        # Predictions
        y_pred = self.model.predict(self.X_test)
        y_pred_proba = self.model.predict_proba(self.X_test)

        # Detect number of classes
        n_classes = len(np.unique(self.y_test))

        # Set target names based on number of classes
        if n_classes == 2:
            target_names = ['No Seizure', 'Seizure']
            label_names = ['no_seizure', 'seizure']
        else:
            target_names = ['Inter-ictal', 'Pre-ictal', 'Ictal']
            label_names = ['inter_ictal', 'pre_ictal', 'ictal']

        # Classification report
        logger.info("\nClassification Report:")
        print(classification_report(self.y_test, y_pred, target_names=target_names))

        # Confusion matrix
        logger.info("\nConfusion Matrix:")
        cm = confusion_matrix(self.y_test, y_pred)
        print(cm)

        # Calculate metrics per class
        results = {}

        # For binary classification, calculate AUC directly
        if n_classes == 2:
            try:
                auc = roc_auc_score(self.y_test, y_pred_proba[:, 1])
                results['auc_binary'] = float(auc)
                logger.info(f"Binary AUC: {auc:.4f}")
            except Exception as e:
                logger.warning(f"Could not calculate binary AUC: {e}")
        else:
            # For multi-class, calculate AUC per class
            for i, label_name in enumerate(label_names):
                if i < y_pred_proba.shape[1]:
                    try:
                        y_test_binary = (self.y_test == i).astype(int)
                        if len(np.unique(y_test_binary)) > 1:
                            auc = roc_auc_score(y_test_binary, y_pred_proba[:, i])
                            results[f'auc_{label_name}'] = float(auc)
                            logger.info(f"AUC for {label_name}: {auc:.4f}")
                    except Exception as e:
                        logger.warning(f"Could not calculate AUC for {label_name}: {e}")

        # Overall accuracy
        accuracy = (y_pred == self.y_test).mean()
        results['accuracy'] = float(accuracy)
        logger.info(f"\nOverall Accuracy: {accuracy:.4f}")

        return results

    def save_model(self, output_dir: str = './models'):
        """Save trained model and scaler"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save model
        model_path = output_dir / f'seizure_model_{self.model_type}.joblib'
        joblib.dump(self.model, model_path)
        logger.info(f"Model saved to {model_path}")

        # Save scaler
        scaler_path = output_dir / 'scaler.joblib'
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")

        # Save feature names
        feature_cols = [col for col in self.train_df.columns
                       if col not in ['event_id', 'userId', 'run', 'dataTime',
                                     'window_start', 'window_end', 'label']]
        features_path = output_dir / 'features.json'
        with open(features_path, 'w') as f:
            json.dump({'features': feature_cols}, f, indent=2)
        logger.info(f"Feature names saved to {features_path}")

        return str(model_path)


def main():
    parser = argparse.ArgumentParser(description='Train seizure detection model')
    parser.add_argument('--train', default='processed_data_balanced/batch1/train_data.csv',
                       help='Training data CSV')
    parser.add_argument('--test', default='processed_data_balanced/batch1/test_data.csv',
                       help='Test data CSV')
    parser.add_argument('--model', default='rf', choices=['rf', 'xgb'],
                       help='Model type (rf=Random Forest, xgb=XGBoost)')
    parser.add_argument('--output', default='./models/batch1',
                       help='Output directory for model')
    parser.add_argument('--n_estimators', type=int, default=100,
                       help='Number of trees/estimators')
    parser.add_argument('--max_depth', type=int, default=20,
                       help='Maximum tree depth')

    args = parser.parse_args()

    # Initialize trainer
    trainer = SeizureModelTrainer(args.train, args.test, args.model)

    # Train
    if args.model == 'rf':
        trainer.train_random_forest(args.n_estimators, args.max_depth)
    elif args.model == 'xgb':
        trainer.train_xgboost(args.n_estimators, args.max_depth)

    # Evaluate
    results = trainer.evaluate()

    # Save model
    model_path = trainer.save_model(args.output)

    # Save results
    results_path = Path(args.output) / 'results.json'
    results_path.parent.mkdir(parents=True, exist_ok=True)
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    logger.info(f"Results saved to {results_path}")

    logger.info(f"\nTraining complete! Model saved to {model_path}")


if __name__ == '__main__':
    main()
