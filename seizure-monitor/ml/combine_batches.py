#!/usr/bin/env python3
"""
Combine multiple batch CSV files into a single dataset
"""

import pandas as pd
from pathlib import Path
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def combine_batches(input_dir: str, output_file: str, batches: list):
    """
    Combine multiple batch CSV files

    Args:
        input_dir: Directory containing batch files
        output_file: Output combined CSV file
        batches: List of batch numbers to combine
    """
    input_dir = Path(input_dir)
    output_file = Path(output_file)

    all_dfs = []

    for batch_num in batches:
        batch_file = input_dir / f"batch{batch_num}_all_features.csv"

        if not batch_file.exists():
            logger.warning(f"Batch file not found: {batch_file}")
            continue

        logger.info(f"Loading {batch_file}...")
        df = pd.read_csv(batch_file)
        logger.info(f"  Loaded {len(df):,} rows")

        # Log label distribution
        if 'label' in df.columns:
            label_counts = df['label'].value_counts().to_dict()
            for label, count in sorted(label_counts.items()):
                logger.info(f"    Label {label}: {count:,} samples")

        all_dfs.append(df)

    if not all_dfs:
        logger.error("No batch files found!")
        return

    # Combine all dataframes
    logger.info("\nCombining all batches...")
    combined_df = pd.concat(all_dfs, ignore_index=True)

    logger.info(f"Combined dataset: {len(combined_df):,} total rows")

    # Log combined label distribution
    if 'label' in combined_df.columns:
        logger.info("\nCombined label distribution:")
        label_counts = combined_df['label'].value_counts().to_dict()
        total = len(combined_df)
        for label, count in sorted(label_counts.items()):
            percentage = (count / total) * 100
            logger.info(f"  Label {label}: {count:,} samples ({percentage:.2f}%)")

    # Save combined file
    output_file.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"\nSaving to {output_file}...")
    combined_df.to_csv(output_file, index=False)
    logger.info("Done!")


def main():
    parser = argparse.ArgumentParser(description='Combine batch CSV files')
    parser.add_argument('--input_dir', default='processed_data',
                       help='Directory containing batch files')
    parser.add_argument('--output', default='processed_data/batches_1-5_combined.csv',
                       help='Output combined CSV file')
    parser.add_argument('--batches', nargs='+', type=int, default=[1, 2, 3, 4, 5],
                       help='Batch numbers to combine (e.g., 1 2 3 4 5)')

    args = parser.parse_args()

    combine_batches(args.input_dir, args.output, args.batches)


if __name__ == '__main__':
    main()
