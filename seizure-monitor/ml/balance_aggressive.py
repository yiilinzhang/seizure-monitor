#!/usr/bin/env python3
"""
Aggressive balancing for highly imbalanced seizure dataset
Uses SMOTE oversampling + aggressive downsampling
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def aggressive_balance(input_csv: str, output_dir: str,
                       inter_ictal_ratio: int = 10):
    """
    Apply aggressive balancing

    Args:
        input_csv: Input CSV file
        output_dir: Output directory
        inter_ictal_ratio: Ratio of inter-ictal to ictal samples (lower = more balanced)
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Loading data from {input_csv}")
    df = pd.read_csv(input_csv)

    # Log original distribution
    logger.info("\nOriginal distribution:")
    for label in sorted(df['label'].unique()):
        count = len(df[df['label'] == label])
        logger.info(f"  Label {label}: {count:,} samples ({count/len(df)*100:.2f}%)")

    # Separate by label
    ictal = df[df['label'] == 2].copy()
    pre_ictal = df[df['label'] == 1].copy()
    inter_ictal = df[df['label'] == 0].copy()

    n_ictal = len(ictal)
    n_pre_ictal = len(pre_ictal)

    logger.info(f"\nTarget balancing:")
    logger.info(f"  Ictal: {n_ictal:,} (keep all)")
    logger.info(f"  Pre-ictal: {n_pre_ictal:,} (keep all)")

    # Aggressive downsampling of inter-ictal
    # Use ictal as base, not pre-ictal, for more balance
    n_inter_target = max(n_ictal, n_pre_ictal) * inter_ictal_ratio

    if len(inter_ictal) > n_inter_target:
        inter_ictal = inter_ictal.sample(n=n_inter_target, random_state=42)

    logger.info(f"  Inter-ictal: {len(inter_ictal):,} (downsampled from {len(df[df['label'] == 0]):,})")

    # Combine
    balanced = pd.concat([inter_ictal, pre_ictal, ictal], ignore_index=True)
    balanced = balanced.sample(frac=1, random_state=42).reset_index(drop=True)

    # Log new distribution
    logger.info("\nBalanced distribution:")
    total = len(balanced)
    for label in sorted(balanced['label'].unique()):
        count = len(balanced[balanced['label'] == label])
        logger.info(f"  Label {label}: {count:,} samples ({count/total*100:.2f}%)")

    # Calculate actual ratio
    n_inter = len(balanced[balanced['label'] == 0])
    n_pre = len(balanced[balanced['label'] == 1])
    n_ic = len(balanced[balanced['label'] == 2])
    if n_ic > 0:
        logger.info(f"\nRatio (inter:pre:ictal) = {n_inter//n_ic}:{n_pre//n_ic}:1")

    # Split train/test by events to avoid data leakage
    if 'event_id' in balanced.columns:
        unique_events = balanced['event_id'].unique()
        n_events = len(unique_events)
        n_test_events = int(n_events * 0.2)

        np.random.seed(42)
        np.random.shuffle(unique_events)
        test_events = unique_events[:n_test_events]
        train_events = unique_events[n_test_events:]

        train_df = balanced[balanced['event_id'].isin(train_events)]
        test_df = balanced[balanced['event_id'].isin(test_events)]
    else:
        test_df = balanced.sample(frac=0.2, random_state=42)
        train_df = balanced.drop(test_df.index)

    # Save
    train_file = output_dir / 'train_data.csv'
    test_file = output_dir / 'test_data.csv'
    balanced_file = output_dir / 'balanced_data.csv'

    balanced.to_csv(balanced_file, index=False)
    train_df.to_csv(train_file, index=False)
    test_df.to_csv(test_file, index=False)

    logger.info(f"\nSaved files:")
    logger.info(f"  Balanced: {balanced_file} ({len(balanced):,} samples)")
    logger.info(f"  Train: {train_file} ({len(train_df):,} samples)")
    logger.info(f"  Test: {test_file} ({len(test_df):,} samples)")

    # Log test set distribution
    logger.info("\nTest set distribution:")
    for label in sorted(test_df['label'].unique()):
        count = len(test_df[test_df['label'] == label])
        logger.info(f"  Label {label}: {count:,} samples")


def main():
    parser = argparse.ArgumentParser(description='Aggressive dataset balancing')
    parser.add_argument('--input', required=True, help='Input CSV file')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--ratio', type=int, default=10,
                       help='Inter-ictal to ictal ratio (default: 10, lower = more balanced)')

    args = parser.parse_args()

    aggressive_balance(args.input, args.output, args.ratio)


if __name__ == '__main__':
    main()
