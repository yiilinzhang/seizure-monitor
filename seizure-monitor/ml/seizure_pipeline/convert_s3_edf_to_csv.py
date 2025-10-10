#!/usr/bin/env python3
"""
Convert S3 EDF files to CSV with multi-modal feature extraction
Designed for EC2 processing of OpenNeuro ds005873 dataset
"""

import os
import sys
import argparse
import logging
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import multiprocessing as mp
from typing import Dict, List, Tuple, Optional

import boto3
from botocore import UNSIGNED
from botocore.config import Config
import pandas as pd
import numpy as np
import pyedflib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class S3EdfProcessor:
    """Process EDF files from S3 and extract features"""

    def __init__(self, bucket: str, dataset: str, output_dir: str,
                 pre_ictal_minutes: int = 5, window_sec: int = 4):
        """
        Initialize S3 processor

        Args:
            bucket: S3 bucket name (e.g., 'openneuro.org')
            dataset: Dataset name (e.g., 'ds005873')
            output_dir: Local directory for output files
            pre_ictal_minutes: Minutes before seizure to label as pre-ictal
            window_sec: Window size for feature extraction
        """
        self.bucket = bucket
        self.dataset = dataset
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.pre_ictal_sec = pre_ictal_minutes * 60
        self.window_sec = window_sec

        # S3 client for public bucket (no authentication)
        self.s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

        # Create output subdirectories
        self.subject_dir = self.output_dir / 'subject_csvs'
        self.subject_dir.mkdir(exist_ok=True)
        self.combined_dir = self.output_dir / 'combined'
        self.combined_dir.mkdir(exist_ok=True)

    def list_subjects(self) -> List[str]:
        """List all subjects in the dataset"""
        prefix = f"{self.dataset}/"
        try:
            response = self.s3.list_objects_v2(
                Bucket=self.bucket,
                Prefix=prefix,
                Delimiter='/'
            )

            subjects = []
            for prefix_info in response.get('CommonPrefixes', []):
                subject = prefix_info['Prefix'].split('/')[-2]
                if subject.startswith('sub-'):
                    subjects.append(subject)

            return sorted(subjects)
        except Exception as e:
            logger.error(f"Error listing subjects: {e}")
            return []

    def download_file(self, s3_key: str, local_path: str) -> bool:
        """Download a file from S3"""
        try:
            logger.debug(f"Downloading {s3_key} to {local_path}")
            self.s3.download_file(self.bucket, s3_key, local_path)
            return True
        except Exception as e:
            logger.warning(f"Failed to download {s3_key}: {e}")
            return False

    def process_subject(self, subject_id: str) -> Optional[pd.DataFrame]:
        """
        Process all data for a single subject

        Args:
            subject_id: Subject identifier (e.g., 'sub-001')

        Returns:
            DataFrame with extracted features or None if failed
        """
        logger.info(f"Processing {subject_id}...")

        # Create temporary directory for this subject
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # List all runs for this subject
            session = 'ses-01'  # Assuming single session
            prefix = f"{self.dataset}/{subject_id}/{session}/"

            all_features = []

            # Process each modality
            for modality in ['ecg', 'eeg', 'emg', 'mov']:
                modality_prefix = f"{prefix}{modality}/"

                try:
                    # List files in modality folder
                    response = self.s3.list_objects_v2(
                        Bucket=self.bucket,
                        Prefix=modality_prefix
                    )

                    edf_files = [obj['Key'] for obj in response.get('Contents', [])
                                 if obj['Key'].endswith('.edf')]

                    for edf_key in edf_files:
                        # Extract run number from filename
                        filename = os.path.basename(edf_key)
                        if 'run-' in filename:
                            run_num = filename.split('run-')[1].split('_')[0]
                        else:
                            continue

                        # Download EDF file
                        local_edf = temp_path / filename
                        if not self.download_file(edf_key, str(local_edf)):
                            continue

                        # Download corresponding events file if in EEG folder
                        events = None
                        if modality == 'eeg':
                            events_key = f"{prefix}eeg/{subject_id}_{session}_task-szMonitoring_run-{run_num}_events.tsv"
                            local_events = temp_path / f"run-{run_num}_events.tsv"
                            if self.download_file(events_key, str(local_events)):
                                events = self.parse_events(local_events)

                        # Extract features from EDF
                        features = self.extract_features_from_edf(
                            local_edf, modality, subject_id, run_num, events
                        )

                        if features:
                            all_features.extend(features)

                        # Clean up EDF file to save space
                        local_edf.unlink()

                except Exception as e:
                    logger.warning(f"Error processing {modality} for {subject_id}: {e}")
                    continue

            if all_features:
                # Create DataFrame
                df = pd.DataFrame(all_features)

                # Sort by time
                df = df.sort_values(['run', 'window_start'])

                # Save subject CSV
                output_file = self.subject_dir / f"{subject_id}_features.csv"
                df.to_csv(output_file, index=False)
                logger.info(f"Saved {len(df)} samples for {subject_id}")

                return df
            else:
                logger.warning(f"No features extracted for {subject_id}")
                return None

    def extract_features_from_edf(self, edf_path: Path, modality: str,
                                   subject_id: str, run_num: str,
                                   events: Optional[List] = None) -> List[Dict]:
        """
        Extract windowed features from EDF file

        Args:
            edf_path: Path to EDF file
            modality: Type of signal (ecg, eeg, emg, mov)
            subject_id: Subject identifier
            run_num: Run number
            events: List of seizure events

        Returns:
            List of feature dictionaries
        """
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

            # Read first channel (or multiple for EEG)
            if modality == 'eeg':
                # Read multiple EEG channels
                signals = []
                for i in range(min(n_signals, 8)):  # Limit to 8 channels
                    signals.append(f.readSignal(i))
                signals = np.array(signals)
                sample_rate = sample_freqs[0]
            else:
                # Single channel for ECG, EMG, MOV
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

                window_signal = signals[:, start_sample:end_sample]

                # Calculate features based on modality
                feature_dict = {
                    'event_id': f"{subject_id}_run{run_num}_{start_sec}",
                    'userId': subject_id,
                    'run': run_num,
                    'dataTime': f"2000-01-01 {start_sec//3600:02d}:{(start_sec%3600)//60:02d}:{start_sec%60:02d}",
                    'window_start': start_sec,
                    'window_end': start_sec + self.window_sec,
                }

                if modality == 'ecg':
                    # Extract HR from ECG
                    hr, hrv = self.extract_hr_from_ecg(window_signal[0], sample_rate)
                    feature_dict['hr'] = hr
                    feature_dict['hrv'] = hrv

                elif modality == 'eeg':
                    # Extract EEG band powers
                    powers = self.extract_eeg_features(window_signal, sample_rate)
                    feature_dict.update(powers)

                elif modality == 'emg':
                    # Extract EMG features
                    feature_dict['emg_rms'] = np.sqrt(np.mean(window_signal[0]**2))
                    feature_dict['emg_var'] = np.var(window_signal[0])

                elif modality == 'mov':
                    # Extract movement features
                    feature_dict['mov_mag'] = np.sqrt(np.mean(window_signal[0]**2))
                    feature_dict['mov_std'] = np.std(window_signal[0])

                # Add label based on events
                feature_dict['label'] = self.get_temporal_label(start_sec, events)

                features.append(feature_dict)

            return features

        except Exception as e:
            logger.error(f"Error processing EDF {edf_path}: {e}")
            return []

    def extract_hr_from_ecg(self, ecg_signal: np.ndarray,
                             sample_rate: float) -> Tuple[float, float]:
        """
        Extract heart rate and HRV from ECG signal

        Args:
            ecg_signal: ECG waveform
            sample_rate: Sampling frequency

        Returns:
            Tuple of (heart_rate, hrv)
        """
        try:
            from scipy.signal import find_peaks

            # Find R-peaks
            min_distance = int(0.6 * sample_rate)  # Min 0.6s between beats
            height = np.percentile(np.abs(ecg_signal), 75)

            peaks, _ = find_peaks(ecg_signal, distance=min_distance, height=height)

            if len(peaks) < 2:
                return 60.0, 0.0  # Default values

            # Calculate RR intervals
            rr_intervals = np.diff(peaks) / sample_rate

            # Heart rate (BPM)
            hr = 60 / np.mean(rr_intervals) if len(rr_intervals) > 0 else 60.0

            # HRV (SDNN in ms)
            hrv = np.std(rr_intervals) * 1000 if len(rr_intervals) > 1 else 0.0

            # Sanity checks
            hr = np.clip(hr, 30, 200)  # Reasonable HR range
            hrv = np.clip(hrv, 0, 200)  # Reasonable HRV range

            return float(hr), float(hrv)

        except Exception as e:
            logger.debug(f"HR extraction error: {e}")
            return 60.0, 0.0

    def extract_eeg_features(self, eeg_signals: np.ndarray,
                              sample_rate: float) -> Dict[str, float]:
        """
        Extract frequency band powers from EEG

        Args:
            eeg_signals: Multi-channel EEG data
            sample_rate: Sampling frequency

        Returns:
            Dictionary of band powers
        """
        try:
            from scipy.signal import welch

            # Calculate PSD for each channel
            powers = {
                'eeg_delta': [],
                'eeg_theta': [],
                'eeg_alpha': [],
                'eeg_beta': []
            }

            for channel in eeg_signals:
                freqs, psd = welch(channel, fs=sample_rate, nperseg=min(len(channel), 256))

                # Calculate band powers
                delta = np.mean(psd[(freqs >= 0.5) & (freqs < 4)])
                theta = np.mean(psd[(freqs >= 4) & (freqs < 8)])
                alpha = np.mean(psd[(freqs >= 8) & (freqs < 13)])
                beta = np.mean(psd[(freqs >= 13) & (freqs < 30)])

                powers['eeg_delta'].append(delta)
                powers['eeg_theta'].append(theta)
                powers['eeg_alpha'].append(alpha)
                powers['eeg_beta'].append(beta)

            # Average across channels
            return {k: float(np.mean(v)) for k, v in powers.items()}

        except Exception as e:
            logger.debug(f"EEG feature extraction error: {e}")
            return {
                'eeg_delta': 0.0,
                'eeg_theta': 0.0,
                'eeg_alpha': 0.0,
                'eeg_beta': 0.0
            }

    def parse_events(self, events_file: Path) -> List[Dict]:
        """Parse seizure events from TSV file"""
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
        """
        Get temporal label for a timestamp

        0: Inter-ictal (normal)
        1: Pre-ictal (before seizure)
        2: Ictal (during seizure)
        """
        if not events:
            return 0

        for event in events:
            onset = event['onset']
            duration = event['duration']

            # Check if in seizure
            if timestamp >= onset and timestamp <= onset + duration:
                return 2

            # Check if pre-ictal
            if timestamp >= onset - self.pre_ictal_sec and timestamp < onset:
                return 1

        return 0

    def process_all_subjects(self, subjects: Optional[List[str]] = None,
                              n_workers: int = 4):
        """
        Process all subjects in parallel

        Args:
            subjects: List of subject IDs to process (None for all)
            n_workers: Number of parallel workers
        """
        if subjects is None:
            subjects = self.list_subjects()

        logger.info(f"Processing {len(subjects)} subjects with {n_workers} workers")

        # Process subjects
        all_dfs = []
        for subject_id in subjects:
            df = self.process_subject(subject_id)
            if df is not None:
                all_dfs.append(df)

        # Combine all data
        if all_dfs:
            logger.info("Combining all subject data...")
            combined_df = pd.concat(all_dfs, ignore_index=True)

            # Save combined dataset
            output_file = self.combined_dir / 'all_features.csv'
            combined_df.to_csv(output_file, index=False)

            logger.info(f"Complete! Saved {len(combined_df)} total samples")
            logger.info(f"Label distribution: {combined_df['label'].value_counts().to_dict()}")

            return combined_df
        else:
            logger.error("No data processed!")
            return None


def main():
    parser = argparse.ArgumentParser(description='Convert S3 EDF files to CSV')
    parser.add_argument('--bucket', default='openneuro.org', help='S3 bucket name')
    parser.add_argument('--dataset', default='ds005873', help='Dataset name')
    parser.add_argument('--output', default='./processed_data', help='Output directory')
    parser.add_argument('--subjects', nargs='+', help='Specific subjects to process')
    parser.add_argument('--pre_ictal', type=int, default=5, help='Pre-ictal window (minutes)')
    parser.add_argument('--window', type=int, default=4, help='Feature window (seconds)')
    parser.add_argument('--workers', type=int, default=4, help='Number of parallel workers')

    args = parser.parse_args()

    # Initialize processor
    processor = S3EdfProcessor(
        bucket=args.bucket,
        dataset=args.dataset,
        output_dir=args.output,
        pre_ictal_minutes=args.pre_ictal,
        window_sec=args.window
    )

    # Process subjects
    processor.process_all_subjects(
        subjects=args.subjects,
        n_workers=args.workers
    )


if __name__ == '__main__':
    main()