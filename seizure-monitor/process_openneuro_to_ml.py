"""
Process OpenNeuro DS005873 BIDS data for seizure detection ML training
Extracts ECG/EMG signals, computes heart rate, and aligns with seizure labels
"""

import os
import numpy as np
import pandas as pd
import pyedflib
from scipy import signal
from scipy.signal import find_peaks
import h5py
from datetime import datetime, timedelta
from tqdm import tqdm
import json
from pathlib import Path

class OpenNeuroSeizureProcessor:
    """Process BIDS format seizure monitoring data for ML training"""

    def __init__(self, data_root, output_dir, sampling_rate=256):
        self.data_root = Path(data_root)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.sampling_rate = sampling_rate

        # Window parameters for ML
        self.window_duration = 30  # seconds
        self.window_stride = 15    # seconds (50% overlap)
        self.hr_window = 10        # seconds for HR calculation

    def extract_hr_from_ecg(self, ecg_signal, fs=256):
        """
        Extract heart rate from ECG signal using peak detection

        Args:
            ecg_signal: Raw ECG signal array
            fs: Sampling frequency (Hz)

        Returns:
            hr_values: Array of heart rate values (bpm)
            hr_times: Timestamps for HR values
        """
        # Bandpass filter ECG (0.5-40 Hz for R-peak detection)
        nyquist = fs / 2
        low = 0.5 / nyquist
        high = 40.0 / nyquist
        b, a = signal.butter(4, [low, high], btype='band')
        filtered_ecg = signal.filtfilt(b, a, ecg_signal)

        # Detect R-peaks
        min_distance = int(0.4 * fs)  # Minimum 0.4s between peaks (150 bpm max)
        peaks, properties = find_peaks(
            filtered_ecg,
            distance=min_distance,
            prominence=np.std(filtered_ecg) * 0.3
        )

        # Calculate instantaneous HR
        hr_values = []
        hr_times = []

        window_samples = int(self.hr_window * fs)
        stride_samples = int(fs)  # 1 second stride

        for i in range(0, len(ecg_signal) - window_samples, stride_samples):
            window_peaks = peaks[(peaks >= i) & (peaks < i + window_samples)]

            if len(window_peaks) > 1:
                # Calculate RR intervals
                rr_intervals = np.diff(window_peaks) / fs  # in seconds
                # Convert to BPM
                hr = 60.0 / np.mean(rr_intervals)

                # Physiological HR limits
                if 30 <= hr <= 200:
                    hr_values.append(hr)
                    hr_times.append(i / fs)

        return np.array(hr_values), np.array(hr_times)

    def extract_hr_from_emg(self, emg_signal, fs=256):
        """
        Extract heart rate from EMG signal (contains ECG artifacts)
        EMG on deltoid muscle can pick up heart activity

        Args:
            emg_signal: Raw EMG signal array
            fs: Sampling frequency (Hz)

        Returns:
            hr_values: Array of heart rate values (bpm)
            hr_times: Timestamps for HR values
        """
        # For EMG, we need to extract the ECG component
        # High-pass filter to remove movement artifacts
        nyquist = fs / 2
        high_cutoff = 20.0 / nyquist  # Focus on ECG component
        b, a = signal.butter(4, high_cutoff, btype='high')
        filtered_emg = signal.filtfilt(b, a, emg_signal)

        # Use same peak detection as ECG
        return self.extract_hr_from_ecg(filtered_emg, fs)

    def read_edf_file(self, edf_path):
        """Read EDF file and extract signal data"""
        try:
            f = pyedflib.EdfReader(edf_path)
            n_channels = f.signals_in_file

            # Read all signals
            signals = []
            for i in range(n_channels):
                signals.append(f.readSignal(i))

            # Get sampling frequency (assume all channels same)
            fs = f.getSampleFrequency(0)

            # Get labels
            labels = [f.getLabel(i) for i in range(n_channels)]

            f.close()

            return np.array(signals), fs, labels
        except Exception as e:
            print(f"Error reading {edf_path}: {e}")
            return None, None, None

    def parse_events_file(self, events_path):
        """Parse BIDS events TSV file for seizure annotations"""
        df = pd.read_csv(events_path, sep='\t')

        seizure_events = []
        for _, row in df.iterrows():
            event_type = row['eventType']

            # Check if this is a seizure event
            if event_type.startswith('sz_'):
                seizure_events.append({
                    'onset': float(row['onset']),
                    'duration': float(row['duration']),
                    'type': event_type,
                    'lateralization': row.get('lateralization', 'n/a'),
                    'localization': row.get('localization', 'n/a'),
                    'vigilance': row.get('vigilance', 'n/a')
                })

        return seizure_events

    def create_labeled_windows(self, hr_values, hr_times, seizure_events, total_duration):
        """
        Create fixed-size windows with labels for ML training

        Returns:
            windows: List of HR sequences
            labels: Binary labels (0=normal, 1=seizure)
            metadata: Additional info for each window
        """
        windows = []
        labels = []
        metadata = []

        # Create windows with stride
        window_samples = self.window_duration  # HR is sampled at ~1Hz
        stride_samples = self.window_stride

        for start_idx in range(0, len(hr_times) - window_samples, stride_samples):
            end_idx = start_idx + window_samples

            # Extract window
            window_hr = hr_values[start_idx:end_idx]
            window_time_start = hr_times[start_idx]
            window_time_end = hr_times[min(end_idx, len(hr_times)-1)]

            # Pad if necessary
            if len(window_hr) < window_samples:
                padding = np.full(window_samples - len(window_hr), np.mean(window_hr))
                window_hr = np.concatenate([window_hr, padding])

            # Determine label (check if window overlaps with any seizure)
            is_seizure = 0
            seizure_info = None

            for sz in seizure_events:
                sz_start = sz['onset']
                sz_end = sz['onset'] + sz['duration']

                # Check overlap
                if not (window_time_end < sz_start or window_time_start > sz_end):
                    is_seizure = 1
                    seizure_info = sz['type']
                    break

            windows.append(window_hr)
            labels.append(is_seizure)
            metadata.append({
                'start_time': window_time_start,
                'end_time': window_time_end,
                'seizure_type': seizure_info
            })

        return np.array(windows), np.array(labels), metadata

    def process_subject_session(self, subject_id, session_id):
        """Process all runs for a subject/session"""

        session_path = self.data_root / f"sub-{subject_id:03d}" / f"ses-{session_id:02d}"

        if not session_path.exists():
            print(f"Session path not found: {session_path}")
            return None

        all_windows = []
        all_labels = []
        all_metadata = []

        # Find all runs
        ecg_dir = session_path / "ecg"
        eeg_dir = session_path / "eeg"
        emg_dir = session_path / "emg"

        # Process each run
        for run_num in range(1, 10):  # Assuming max 9 runs
            ecg_file = ecg_dir / f"sub-{subject_id:03d}_ses-{session_id:02d}_task-szMonitoring_run-{run_num:02d}_ecg.edf"
            emg_file = emg_dir / f"sub-{subject_id:03d}_ses-{session_id:02d}_task-szMonitoring_run-{run_num:02d}_emg.edf"
            events_file = eeg_dir / f"sub-{subject_id:03d}_ses-{session_id:02d}_task-szMonitoring_run-{run_num:02d}_events.tsv"

            # Skip if files don't exist
            if not events_file.exists():
                continue

            print(f"Processing run {run_num}...")

            # Parse seizure events
            seizure_events = self.parse_events_file(events_file)

            # Try ECG first, fallback to EMG
            hr_values = None
            hr_times = None

            if ecg_file.exists():
                signals, fs, labels = self.read_edf_file(str(ecg_file))
                if signals is not None:
                    # Use first channel (assuming single ECG channel)
                    ecg_signal = signals[0] if len(signals.shape) > 1 else signals
                    hr_values, hr_times = self.extract_hr_from_ecg(ecg_signal, fs)

            # Fallback to EMG if ECG failed or doesn't exist
            if hr_values is None or len(hr_values) < self.window_duration:
                if emg_file.exists():
                    signals, fs, labels = self.read_edf_file(str(emg_file))
                    if signals is not None:
                        emg_signal = signals[0] if len(signals.shape) > 1 else signals
                        hr_values, hr_times = self.extract_hr_from_emg(emg_signal, fs)

            # Skip if no valid HR data
            if hr_values is None or len(hr_values) < self.window_duration:
                print(f"  Skipping run {run_num} - insufficient HR data")
                continue

            # Get total recording duration
            total_duration = hr_times[-1] if len(hr_times) > 0 else 0

            # Create labeled windows
            windows, labels, metadata = self.create_labeled_windows(
                hr_values, hr_times, seizure_events, total_duration
            )

            # Add subject/run info to metadata
            for m in metadata:
                m['subject_id'] = subject_id
                m['session_id'] = session_id
                m['run_id'] = run_num

            all_windows.append(windows)
            all_labels.append(labels)
            all_metadata.extend(metadata)

            print(f"  Run {run_num}: {len(windows)} windows, {np.sum(labels)} seizure windows")

        if len(all_windows) > 0:
            return {
                'windows': np.vstack(all_windows),
                'labels': np.hstack(all_labels),
                'metadata': all_metadata
            }
        return None

    def save_to_hdf5(self, data, filename):
        """Save processed data to HDF5 format for efficient loading"""
        output_path = self.output_dir / filename

        with h5py.File(output_path, 'w') as f:
            # Save main data
            f.create_dataset('hr_windows', data=data['windows'], compression='gzip')
            f.create_dataset('labels', data=data['labels'], compression='gzip')

            # Save metadata as JSON string
            metadata_json = json.dumps(data['metadata'])
            f.attrs['metadata'] = metadata_json

            # Save processing parameters
            f.attrs['window_duration'] = self.window_duration
            f.attrs['window_stride'] = self.window_stride
            f.attrs['hr_window'] = self.hr_window
            f.attrs['sampling_rate'] = self.sampling_rate

        print(f"Saved to {output_path}")
        return output_path

    def save_to_npz(self, data, filename):
        """Save processed data to compressed numpy format"""
        output_path = self.output_dir / filename

        np.savez_compressed(
            output_path,
            hr_windows=data['windows'],
            labels=data['labels'],
            metadata=json.dumps(data['metadata']),
            params=json.dumps({
                'window_duration': self.window_duration,
                'window_stride': self.window_stride,
                'hr_window': self.hr_window,
                'sampling_rate': self.sampling_rate
            })
        )

        print(f"Saved to {output_path}")
        return output_path

    def process_all_subjects(self, subject_ids=None, max_subjects=None):
        """Process multiple subjects and create train/val/test splits"""

        if subject_ids is None:
            # Find all subjects in data directory
            subject_dirs = sorted([d for d in self.data_root.iterdir() if d.name.startswith('sub-')])
            subject_ids = [int(d.name.split('-')[1]) for d in subject_dirs]

        if max_subjects:
            subject_ids = subject_ids[:max_subjects]

        all_data = {
            'windows': [],
            'labels': [],
            'metadata': []
        }

        for subject_id in tqdm(subject_ids, desc="Processing subjects"):
            # Process session 01 (you can extend to multiple sessions)
            result = self.process_subject_session(subject_id, 1)

            if result is not None:
                all_data['windows'].append(result['windows'])
                all_data['labels'].append(result['labels'])
                all_data['metadata'].extend(result['metadata'])

        if len(all_data['windows']) > 0:
            # Combine all data
            combined_data = {
                'windows': np.vstack(all_data['windows']),
                'labels': np.hstack(all_data['labels']),
                'metadata': all_data['metadata']
            }

            # Print statistics
            n_total = len(combined_data['labels'])
            n_seizure = np.sum(combined_data['labels'])
            n_normal = n_total - n_seizure

            print(f"\nDataset Statistics:")
            print(f"Total windows: {n_total}")
            print(f"Seizure windows: {n_seizure} ({100*n_seizure/n_total:.1f}%)")
            print(f"Normal windows: {n_normal} ({100*n_normal/n_total:.1f}%)")

            # Save full dataset
            self.save_to_hdf5(combined_data, 'openneuro_seizure_hr_data.h5')
            self.save_to_npz(combined_data, 'openneuro_seizure_hr_data.npz')

            # Create train/val/test splits (70/15/15)
            n_samples = len(combined_data['labels'])
            indices = np.arange(n_samples)
            np.random.shuffle(indices)

            train_idx = indices[:int(0.7 * n_samples)]
            val_idx = indices[int(0.7 * n_samples):int(0.85 * n_samples)]
            test_idx = indices[int(0.85 * n_samples):]

            # Save splits
            splits = {
                'train': train_idx,
                'val': val_idx,
                'test': test_idx
            }

            np.save(self.output_dir / 'data_splits.npy', splits)

            return combined_data

        return None


# Example usage
if __name__ == "__main__":
    # Configure paths
    data_root = "ml/ds005873-download"  # Path to OpenNeuro BIDS data
    output_dir = "ml/processed_openneuro"  # Output directory for processed data

    # Initialize processor
    processor = OpenNeuroSeizureProcessor(data_root, output_dir)

    # Process first subject as a test
    print("Processing first subject as test...")
    result = processor.process_subject_session(1, 1)

    if result:
        print(f"Successfully processed subject 1:")
        print(f"  Shape: {result['windows'].shape}")
        print(f"  Seizure ratio: {np.mean(result['labels']):.3f}")

        # Save test subject data
        processor.save_to_hdf5(result, 'subject_001_test.h5')

    # To process all subjects (when you have them):
    # processor.process_all_subjects(max_subjects=5)  # Process first 5 subjects