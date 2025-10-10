#!/usr/bin/env python3
"""
Balance seizure dataset using various strategies
Compatible with existing LSTM model pipeline
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
import logging
from typing import Tuple, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatasetBalancer:
    """Balance highly imbalanced seizure datasets"""

    def __init__(self, input_csv: str, output_dir: str):
        """
        Initialize balancer

        Args:
            input_csv: Path to input CSV file
            output_dir: Directory for balanced outputs
        """
        self.input_csv = Path(input_csv)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Load data
        logger.info(f"Loading data from {input_csv}")
        self.df = pd.read_csv(input_csv)
        self.log_stats("Original")

    def log_stats(self, name: str):
        """Log dataset statistics"""
        if 'label' in self.df.columns:
            label_counts = self.df['label'].value_counts().to_dict()
            total = len(self.df)
            logger.info(f"{name} dataset: {total} samples")
            for label, count in sorted(label_counts.items()):
                percentage = (count / total) * 100
                logger.info(f"  Label {label}: {count} samples ({percentage:.2f}%)")

    def temporal_window_balance(self, pre_ictal_minutes: int = 5,
                                 downsample_ratio: int = 100) -> pd.DataFrame:
        """
        Balance using temporal windows around seizures

        Args:
            pre_ictal_minutes: Minutes before seizure for pre-ictal
            downsample_ratio: Downsampling ratio for inter-ictal

        Returns:
            Balanced DataFrame
        """
        logger.info("Applying temporal window balancing...")

        # Separate by label
        ictal = self.df[self.df['label'] == 2]  # During seizure
        pre_ictal = self.df[self.df['label'] == 1]  # Before seizure
        inter_ictal = self.df[self.df['label'] == 0]  # Normal

        # Keep all seizure-related data
        n_ictal = len(ictal)
        n_pre_ictal = len(pre_ictal)

        # Downsample inter-ictal to balance
        n_inter_target = n_ictal * downsample_ratio
        if len(inter_ictal) > n_inter_target:
            inter_ictal = inter_ictal.sample(n=n_inter_target, random_state=42)

        # Combine
        balanced = pd.concat([inter_ictal, pre_ictal, ictal], ignore_index=True)
        balanced = balanced.sample(frac=1, random_state=42).reset_index(drop=True)

        # Save
        output_file = self.output_dir / 'temporal_balanced.csv'
        balanced.to_csv(output_file, index=False)

        logger.info(f"Temporal balanced dataset saved to {output_file}")
        logger.info(f"  Inter-ictal: {len(inter_ictal)}")
        logger.info(f"  Pre-ictal: {n_pre_ictal}")
        logger.info(f"  Ictal: {n_ictal}")
        logger.info(f"  Ratio: {len(inter_ictal)//n_ictal}:{n_pre_ictal//n_ictal if n_ictal else 0}:1")

        return balanced

    def event_based_balance(self, seizure_ratio: int = 3) -> pd.DataFrame:
        """
        Balance by grouping continuous events

        Args:
            seizure_ratio: Ratio of normal to seizure events

        Returns:
            Balanced DataFrame
        """
        logger.info("Applying event-based balancing...")

        # Group by event_id
        if 'event_id' not in self.df.columns:
            logger.warning("No event_id column, using temporal balancing instead")
            return self.temporal_window_balance()

        # Identify seizure events
        seizure_events = self.df[self.df['label'] > 0]['event_id'].unique()
        normal_events = self.df[self.df['label'] == 0]['event_id'].unique()

        # Sample normal events
        n_seizure_events = len(seizure_events)
        n_normal_target = n_seizure_events * seizure_ratio

        if len(normal_events) > n_normal_target:
            normal_events = np.random.choice(normal_events, n_normal_target, replace=False)

        # Get all data for selected events
        seizure_data = self.df[self.df['event_id'].isin(seizure_events)]
        normal_data = self.df[self.df['event_id'].isin(normal_events)]

        balanced = pd.concat([seizure_data, normal_data], ignore_index=True)
        balanced = balanced.sample(frac=1, random_state=42).reset_index(drop=True)

        # Save
        output_file = self.output_dir / 'event_balanced.csv'
        balanced.to_csv(output_file, index=False)

        logger.info(f"Event-based balanced dataset saved to {output_file}")
        logger.info(f"  Seizure events: {n_seizure_events}")
        logger.info(f"  Normal events: {len(normal_events)}")
        logger.info(f"  Total samples: {len(balanced)}")

        return balanced

    def focal_sampling(self, window_minutes: int = 10,
                        far_sample_rate: float = 0.01) -> pd.DataFrame:
        """
        Focus sampling around seizure periods

        Args:
            window_minutes: Minutes around seizures to keep all data
            far_sample_rate: Sampling rate for data far from seizures

        Returns:
            Balanced DataFrame
        """
        logger.info("Applying focal sampling around seizures...")

        # Convert window to seconds
        window_sec = window_minutes * 60

        # Find all seizure timestamps
        seizure_times = []
        if 'window_start' in self.df.columns:
            seizure_df = self.df[self.df['label'] == 2]
            for _, row in seizure_df.iterrows():
                seizure_times.append(row['window_start'])

        if not seizure_times:
            logger.warning("No seizure times found, using temporal balancing")
            return self.temporal_window_balance()

        # Mark samples near seizures
        def is_near_seizure(timestamp):
            for sz_time in seizure_times:
                if abs(timestamp - sz_time) <= window_sec:
                    return True
            return False

        if 'window_start' in self.df.columns:
            self.df['near_seizure'] = self.df['window_start'].apply(is_near_seizure)
        else:
            self.df['near_seizure'] = False

        # Keep all near-seizure data
        near_data = self.df[self.df['near_seizure']]
        far_data = self.df[~self.df['near_seizure']]

        # Sample far data
        n_far_samples = int(len(far_data) * far_sample_rate)
        if len(far_data) > n_far_samples:
            far_data = far_data.sample(n=n_far_samples, random_state=42)

        # Combine
        balanced = pd.concat([near_data, far_data], ignore_index=True)
        balanced = balanced.drop('near_seizure', axis=1)
        balanced = balanced.sample(frac=1, random_state=42).reset_index(drop=True)

        # Save
        output_file = self.output_dir / 'focal_balanced.csv'
        balanced.to_csv(output_file, index=False)

        logger.info(f"Focal sampling dataset saved to {output_file}")
        logger.info(f"  Near seizure: {len(near_data)}")
        logger.info(f"  Far from seizure: {len(far_data)}")
        logger.info(f"  Total: {len(balanced)}")

        return balanced

    def create_sequence_dataset(self, seq_len: int = 30) -> pd.DataFrame:
        """
        Create sequence dataset for LSTM training
        Compatible with existing dataset_sequences_v2.py

        Args:
            seq_len: Sequence length for LSTM

        Returns:
            Sequence dataset
        """
        logger.info(f"Creating sequence dataset (seq_len={seq_len})...")

        # Ensure proper columns for compatibility
        required_cols = ['event_id', 'userId', 'dataTime', 'hr', 'label']

        # Add o2Sat column for compatibility (set to -1)
        if 'o2Sat' not in self.df.columns:
            self.df['o2Sat'] = -1

        # If missing hr, try to use other features
        if 'hr' not in self.df.columns:
            if 'emg_rms' in self.df.columns:
                # Use EMG as proxy
                self.df['hr'] = self.df['emg_rms'] * 100 + 60
            else:
                # Generate synthetic HR for testing
                self.df['hr'] = 70 + np.random.randn(len(self.df)) * 10

        # Ensure all required columns exist
        for col in required_cols:
            if col not in self.df.columns:
                if col == 'event_id':
                    self.df['event_id'] = self.df.index // seq_len
                elif col == 'userId':
                    self.df['userId'] = self.df.get('userId', 'unknown')
                elif col == 'dataTime':
                    self.df['dataTime'] = pd.date_range(
                        '2000-01-01', periods=len(self.df), freq='4S'
                    ).astype(str)

        # Select and reorder columns
        output_cols = ['event_id', 'userId', 'dataTime', 'hr', 'o2Sat', 'label']
        sequence_df = self.df[output_cols]

        # Save
        output_file = self.output_dir / 'sequence_ready.csv'
        sequence_df.to_csv(output_file, index=False)

        logger.info(f"Sequence dataset saved to {output_file}")
        logger.info(f"  Total samples: {len(sequence_df)}")
        logger.info(f"  Unique events: {sequence_df['event_id'].nunique()}")

        return sequence_df

    def split_train_test(self, df: pd.DataFrame,
                          test_ratio: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Split data into train and test sets

        Args:
            df: Input DataFrame
            test_ratio: Ratio for test set

        Returns:
            Tuple of (train_df, test_df)
        """
        logger.info(f"Splitting data (test_ratio={test_ratio})...")

        # If we have event_id, split by events to avoid data leakage
        if 'event_id' in df.columns:
            unique_events = df['event_id'].unique()
            n_events = len(unique_events)
            n_test_events = int(n_events * test_ratio)

            # Shuffle and split events
            np.random.seed(42)
            np.random.shuffle(unique_events)
            test_events = unique_events[:n_test_events]
            train_events = unique_events[n_test_events:]

            train_df = df[df['event_id'].isin(train_events)]
            test_df = df[df['event_id'].isin(test_events)]
        else:
            # Simple random split
            test_df = df.sample(frac=test_ratio, random_state=42)
            train_df = df.drop(test_df.index)

        # Save
        train_file = self.output_dir / 'train_data.csv'
        test_file = self.output_dir / 'test_data.csv'

        train_df.to_csv(train_file, index=False)
        test_df.to_csv(test_file, index=False)

        logger.info(f"Train set: {len(train_df)} samples -> {train_file}")
        logger.info(f"Test set: {len(test_df)} samples -> {test_file}")

        return train_df, test_df

    def apply_all_strategies(self):
        """Apply all balancing strategies and save results"""
        logger.info("Applying all balancing strategies...")

        # 1. Temporal window balancing
        temporal_df = self.temporal_window_balance()
        self.split_train_test(temporal_df)

        # 2. Event-based balancing
        event_df = self.event_based_balance()

        # 3. Focal sampling
        focal_df = self.focal_sampling()

        # 4. Sequence-ready format
        sequence_df = self.create_sequence_dataset()

        # Create a summary
        summary = {
            'original_samples': len(self.df),
            'temporal_balanced': len(temporal_df),
            'event_balanced': len(event_df),
            'focal_balanced': len(focal_df),
            'sequence_ready': len(sequence_df)
        }

        # Save summary
        summary_file = self.output_dir / 'balancing_summary.txt'
        with open(summary_file, 'w') as f:
            f.write("Dataset Balancing Summary\n")
            f.write("=" * 50 + "\n\n")
            for key, value in summary.items():
                f.write(f"{key}: {value:,} samples\n")

        logger.info(f"Summary saved to {summary_file}")
        return summary


def main():
    parser = argparse.ArgumentParser(description='Balance seizure dataset')
    parser.add_argument('--input', required=True, help='Input CSV file')
    parser.add_argument('--output', default='./balanced_data', help='Output directory')
    parser.add_argument('--strategy', default='all',
                        choices=['all', 'temporal', 'event', 'focal', 'sequence'],
                        help='Balancing strategy')
    parser.add_argument('--test_ratio', type=float, default=0.2, help='Test set ratio')

    args = parser.parse_args()

    # Initialize balancer
    balancer = DatasetBalancer(args.input, args.output)

    # Apply strategies
    if args.strategy == 'all':
        balancer.apply_all_strategies()
    elif args.strategy == 'temporal':
        df = balancer.temporal_window_balance()
        balancer.split_train_test(df, args.test_ratio)
    elif args.strategy == 'event':
        df = balancer.event_based_balance()
        balancer.split_train_test(df, args.test_ratio)
    elif args.strategy == 'focal':
        df = balancer.focal_sampling()
        balancer.split_train_test(df, args.test_ratio)
    elif args.strategy == 'sequence':
        df = balancer.create_sequence_dataset()
        balancer.split_train_test(df, args.test_ratio)


if __name__ == '__main__':
    main()