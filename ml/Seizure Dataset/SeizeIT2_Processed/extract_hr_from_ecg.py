import pyedflib
import numpy as np
import pandas as pd
from scipy.signal import find_peaks
from pathlib import Path
import json
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

def extract_hr_from_ecg(ecg_signal, sampling_rate=256, window_sec=4):
    """
    Extract heart rate from ECG signal using R-peak detection.

    Args:
        ecg_signal: ECG waveform array
        sampling_rate: Sampling frequency (Hz)
        window_sec: Window size for HR calculation (seconds)

    Returns:
        timestamps, hr_values, hrv_values
    """
    # Detect R-peaks (QRS complexes)
    # Peaks should be at least 0.6 seconds apart (100 BPM max reasonable)
    min_distance = int(0.6 * sampling_rate)

    # Find peaks with adaptive height threshold
    height_threshold = np.percentile(np.abs(ecg_signal), 75)
    peaks, _ = find_peaks(ecg_signal, distance=min_distance, height=height_threshold)

    if len(peaks) < 2:
        return np.array([]), np.array([]), np.array([])

    # Calculate RR intervals (time between consecutive R-peaks)
    rr_intervals = np.diff(peaks) / sampling_rate  # in seconds

    # Calculate HR in sliding windows
    window_samples = int(window_sec * sampling_rate)
    num_windows = len(ecg_signal) // window_samples

    timestamps = []
    hr_values = []
    hrv_values = []

    for i in range(num_windows):
        start_sample = i * window_samples
        end_sample = start_sample + window_samples

        # Find peaks in this window
        window_peaks = peaks[(peaks >= start_sample) & (peaks < end_sample)]

        if len(window_peaks) >= 2:
            # Calculate HR from number of peaks
            num_beats = len(window_peaks) - 1
            window_duration = window_sec
            hr = (num_beats / window_duration) * 60  # BPM

            # Calculate HRV (SDNN - standard deviation of RR intervals)
            window_rr = np.diff(window_peaks) / sampling_rate
            hrv = np.std(window_rr) * 1000 if len(window_rr) > 0 else 0  # in ms

            timestamps.append(start_sample / sampling_rate)
            hr_values.append(hr)
            hrv_values.append(hrv)

    return np.array(timestamps), np.array(hr_values), np.array(hrv_values)

def read_edf_file(edf_path):
    """Read ECG signal from EDF file."""
    try:
        f = pyedflib.EdfReader(str(edf_path))
        n_signals = f.signals_in_file

        if n_signals == 0:
            f.close()
            return None, None

        # Read first channel (usually the ECG channel)
        signal = f.readSignal(0)
        sample_rate = f.getSampleFrequency(0)

        f.close()
        return signal, int(sample_rate)
    except Exception as e:
        print(f"Error reading {edf_path}: {e}")
        return None, None

def read_events_tsv(tsv_path):
    """Read seizure events from TSV file."""
    try:
        df = pd.read_csv(tsv_path, sep='\t')
        events = []
        for _, row in df.iterrows():
            events.append({
                'onset': float(row['onset']),
                'duration': float(row['duration']),
                'type': row['eventType'] if 'eventType' in row else 'unknown'
            })
        return events
    except Exception as e:
        print(f"Error reading {tsv_path}: {e}")
        return []

def process_subject(subject_dir, output_csv):
    """Process all ECG files for one subject."""
    ecg_dir = subject_dir / 'ses-01' / 'ecg'
    eeg_dir = subject_dir / 'ses-01' / 'eeg'

    if not ecg_dir.exists():
        print(f"No ECG data for {subject_dir.name}")
        return

    subject_id = subject_dir.name
    all_data = []

    # Process each ECG recording (run)
    ecg_files = sorted(ecg_dir.glob('*_ecg.edf'))

    for ecg_file in ecg_files:
        run_id = ecg_file.stem.split('_run-')[1].split('_')[0]

        # Read ECG
        ecg_signal, sample_rate = read_edf_file(ecg_file)
        if ecg_signal is None:
            continue

        # Extract HR and HRV
        timestamps, hr, hrv = extract_hr_from_ecg(ecg_signal, sample_rate)

        if len(timestamps) == 0:
            continue

        # Read events for this run
        event_file = eeg_dir / f"{subject_id}_ses-01_task-szMonitoring_run-{run_id}_events.tsv"
        events = read_events_tsv(event_file) if event_file.exists() else []

        # Label each HR sample
        for t, h, v in zip(timestamps, hr, hrv):
            label = 0  # default: non-seizure
            event_id = f"{subject_id}_run{run_id}"

            # Check if this timestamp falls within any seizure
            for event in events:
                if event['onset'] <= t <= (event['onset'] + event['duration']):
                    label = 1
                    event_id = f"{subject_id}_run{run_id}_sz{int(event['onset'])}"
                    break

            all_data.append({
                'subject_id': subject_id,
                'event_id': event_id,
                'timestamp': t,
                'hr': h,
                'hrv': v,
                'label': label
            })

    # Save subject data
    if all_data:
        df = pd.DataFrame(all_data)
        df.to_csv(output_csv, index=False)
        print(f"✅ {subject_id}: {len(df)} samples, {df['label'].sum()} seizure samples")

def main():
    base_dir = Path("/Users/yilinzhang/Desktop/Sensor code Pixel/ml/Seizure Dataset/ECG + EMG(HR)  886 Seizures")
    output_dir = Path("/Users/yilinzhang/Desktop/Sensor code Pixel/ml/Seizure Dataset/SeizeIT2_Processed")

    # Find all subject directories
    subject_dirs = sorted([d for d in base_dir.iterdir() if d.is_dir() and d.name.startswith('sub-')])

    print(f"Found {len(subject_dirs)} subjects")
    print("Extracting HR from ECG...\n")

    # Process each subject
    subject_csvs = []
    for subject_dir in tqdm(subject_dirs):
        output_csv = output_dir / f"{subject_dir.name}_hr.csv"
        process_subject(subject_dir, output_csv)
        if output_csv.exists():
            subject_csvs.append(output_csv)

    # Combine all subjects into one CSV
    print("\nCombining all subjects...")
    all_dfs = []
    for csv_file in subject_csvs:
        df = pd.read_csv(csv_file)
        all_dfs.append(df)

    combined_df = pd.concat(all_dfs, ignore_index=True)
    combined_df.to_csv(output_dir / 'seizeit2_hr_all.csv', index=False)

    print(f"\n✅ Processing complete!")
    print(f"Total samples: {len(combined_df)}")
    print(f"Seizure samples: {combined_df['label'].sum()}")
    print(f"Non-seizure samples: {(combined_df['label']==0).sum()}")
    print(f"Unique subjects: {combined_df['subject_id'].nunique()}")
    print(f"Output: {output_dir / 'seizeit2_hr_all.csv'}")

if __name__ == "__main__":
    main()
