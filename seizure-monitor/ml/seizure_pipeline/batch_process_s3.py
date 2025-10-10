#!/usr/bin/env python3
"""
Batch processing for S3 EDF conversion with checkpoint support
Process subjects in small batches for fault tolerance
"""

import argparse
import json
import logging
from pathlib import Path
from convert_s3_edf_to_csv import S3EdfProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_checkpoint(checkpoint_file):
    """Load processing checkpoint"""
    if Path(checkpoint_file).exists():
        with open(checkpoint_file, 'r') as f:
            return json.load(f)
    return {'completed_subjects': [], 'current_batch': 0}


def save_checkpoint(checkpoint_file, checkpoint_data):
    """Save processing checkpoint"""
    with open(checkpoint_file, 'w') as f:
        json.dump(checkpoint_data, f, indent=2)


def process_batches(bucket, dataset, output_dir, batch_size=5,
                     resume=True, start_batch=None, end_batch=None):
    """
    Process subjects in batches with checkpointing

    Args:
        bucket: S3 bucket name
        dataset: Dataset name
        output_dir: Output directory
        batch_size: Number of subjects per batch
        resume: Resume from checkpoint
        start_batch: Start from specific batch (1-indexed)
        end_batch: End at specific batch (inclusive)
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    checkpoint_file = output_path / 'processing_checkpoint.json'
    batch_dir = output_path / 'batches'
    batch_dir.mkdir(exist_ok=True)

    # Initialize processor
    processor = S3EdfProcessor(bucket, dataset, str(output_path))

    # Get all subjects
    all_subjects = processor.list_subjects()
    total_subjects = len(all_subjects)

    logger.info(f"Found {total_subjects} subjects")
    logger.info(f"Batch size: {batch_size}")
    logger.info(f"Total batches: {(total_subjects + batch_size - 1) // batch_size}")

    # Load checkpoint
    checkpoint = load_checkpoint(checkpoint_file) if resume else {'completed_subjects': [], 'current_batch': 0}
    completed = set(checkpoint['completed_subjects'])

    # Create batches
    batches = []
    for i in range(0, total_subjects, batch_size):
        batch_subjects = all_subjects[i:i + batch_size]
        batch_num = (i // batch_size) + 1

        # Apply batch filters
        if start_batch and batch_num < start_batch:
            continue
        if end_batch and batch_num > end_batch:
            break

        batches.append((batch_num, batch_subjects))

    logger.info(f"Processing {len(batches)} batches...")

    # Process each batch
    for batch_num, batch_subjects in batches:
        # Skip completed subjects
        remaining_subjects = [s for s in batch_subjects if s not in completed]

        if not remaining_subjects:
            logger.info(f"Batch {batch_num}: Already completed, skipping")
            continue

        logger.info(f"\n{'='*60}")
        logger.info(f"Processing Batch {batch_num}/{len(batches)}")
        logger.info(f"Subjects: {', '.join(remaining_subjects)}")
        logger.info(f"{'='*60}\n")

        # Process batch
        batch_dfs = []
        for subject_id in remaining_subjects:
            try:
                df = processor.process_subject(subject_id)
                if df is not None:
                    batch_dfs.append(df)
                    completed.add(subject_id)

                    # Save checkpoint after each subject
                    checkpoint['completed_subjects'] = list(completed)
                    checkpoint['current_batch'] = batch_num
                    save_checkpoint(checkpoint_file, checkpoint)

            except Exception as e:
                logger.error(f"Error processing {subject_id}: {e}")
                continue

        # Save batch results
        if batch_dfs:
            import pandas as pd
            batch_df = pd.concat(batch_dfs, ignore_index=True)

            batch_file = batch_dir / f"batch_{batch_num:03d}_subjects_{batch_subjects[0]}_{batch_subjects[-1]}.csv"
            batch_df.to_csv(batch_file, index=False)
            logger.info(f"✓ Saved batch to {batch_file}")
            logger.info(f"  Samples: {len(batch_df)}, Labels: {batch_df['label'].value_counts().to_dict()}")

        logger.info(f"\nProgress: {len(completed)}/{total_subjects} subjects completed")

    logger.info(f"\n{'='*60}")
    logger.info(f"Batch processing complete!")
    logger.info(f"Processed: {len(completed)}/{total_subjects} subjects")
    logger.info(f"Batch files saved to: {batch_dir}")
    logger.info(f"{'='*60}")

    return checkpoint


def combine_batches(output_dir):
    """Combine all batch files into single CSV"""
    import pandas as pd

    output_path = Path(output_dir)
    batch_dir = output_path / 'batches'

    if not batch_dir.exists():
        logger.error(f"Batch directory not found: {batch_dir}")
        return

    # Find all batch files
    batch_files = sorted(batch_dir.glob('batch_*.csv'))

    if not batch_files:
        logger.error("No batch files found!")
        return

    logger.info(f"Combining {len(batch_files)} batch files...")

    # Combine all batches
    all_dfs = []
    for batch_file in batch_files:
        logger.info(f"  Reading {batch_file.name}...")
        df = pd.read_csv(batch_file)
        all_dfs.append(df)

    combined_df = pd.concat(all_dfs, ignore_index=True)

    # Save combined file
    combined_dir = output_path / 'combined'
    combined_dir.mkdir(exist_ok=True)
    combined_file = combined_dir / 'all_features.csv'

    combined_df.to_csv(combined_file, index=False)

    logger.info(f"\n✓ Combined file saved: {combined_file}")
    logger.info(f"  Total samples: {len(combined_df):,}")
    logger.info(f"  Label distribution: {combined_df['label'].value_counts().to_dict()}")
    logger.info(f"  Unique subjects: {combined_df['userId'].nunique()}")


def main():
    parser = argparse.ArgumentParser(description='Batch process S3 EDF files')
    parser.add_argument('--bucket', default='openneuro.org', help='S3 bucket')
    parser.add_argument('--dataset', default='ds005873', help='Dataset name')
    parser.add_argument('--output', default='./processed_batches', help='Output directory')
    parser.add_argument('--batch_size', type=int, default=5, help='Subjects per batch')
    parser.add_argument('--start_batch', type=int, help='Start from batch number')
    parser.add_argument('--end_batch', type=int, help='End at batch number')
    parser.add_argument('--no_resume', action='store_true', help='Start fresh (ignore checkpoint)')
    parser.add_argument('--combine', action='store_true', help='Combine existing batches')

    args = parser.parse_args()

    if args.combine:
        combine_batches(args.output)
    else:
        process_batches(
            bucket=args.bucket,
            dataset=args.dataset,
            output_dir=args.output,
            batch_size=args.batch_size,
            resume=not args.no_resume,
            start_batch=args.start_batch,
            end_batch=args.end_batch
        )


if __name__ == '__main__':
    main()
