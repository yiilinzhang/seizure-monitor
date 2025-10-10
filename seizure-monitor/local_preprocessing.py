"""
Local preprocessing - Extract features locally, train in cloud
This minimizes data transfer by extracting features first
"""

import requests
import pyedflib
import numpy as np
import pandas as pd
from scipy.signal import find_peaks, butter, filtfilt
import pickle
from tqdm import tqdm

def download_and_process_edf(subject_num):
    """Download and immediately process to features"""

    subject_id = f"sub-{subject_num:03d}"
    url = f"https://s3.amazonaws.com/openneuro.org/ds005873/{subject_id}/eeg/{subject_id}_task-rest_eeg.edf"

    # Download to temp file
    temp_file = f"temp_{subject_id}.edf"

    try:
        print(f"Downloading {subject_id}...")
        response = requests.get(url, stream=True)

        if response.status_code == 200:
            with open(temp_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Process immediately
            features = extract_features_from_edf(temp_file)

            # Delete EDF file immediately to save space
            import os
            os.remove(temp_file)

            return features

    except Exception as e:
        print(f"Failed: {e}")
        return None

def extract_features_from_edf(edf_path):
    """Extract compact features from EDF"""

    features = {}

    with pyedflib.EdfReader(edf_path) as edf:
        for i in range(edf.signals_in_file):
            label = edf.getSignalLabel(i)

            if 'ECG' in label.upper():
                ecg = edf.readSignal(i)
                # Convert to heart rate
                hr = ecg_to_heart_rate(ecg, edf.getSampleFrequency(i))

                # Extract HR statistics
                features['hr_mean'] = np.mean(hr)
                features['hr_std'] = np.std(hr)
                features['hr_min'] = np.min(hr)
                features['hr_max'] = np.max(hr)
                features['hrv'] = np.std(np.diff(hr))

            elif 'EMG' in label.upper():
                emg = edf.readSignal(i)

                # Extract EMG features
                features['emg_mean'] = np.mean(np.abs(emg))
                features['emg_std'] = np.std(emg)
                features['emg_rms'] = np.sqrt(np.mean(emg**2))
                features['emg_max'] = np.max(np.abs(emg))

                # Frequency features
                fft = np.fft.rfft(emg)
                features['emg_power'] = np.sum(np.abs(fft)**2)

    return features

def ecg_to_heart_rate(ecg, fs):
    """Convert ECG to heart rate"""

    # Filter
    b, a = butter(2, [0.5, 40], btype='band', fs=fs)
    filtered = filtfilt(b, a, ecg)

    # Find R-peaks
    peaks, _ = find_peaks(filtered, height=np.std(filtered), distance=fs*0.3)

    if len(peaks) > 1:
        rr_intervals = np.diff(peaks) / fs
        heart_rates = 60 / rr_intervals
        return heart_rates
    else:
        return np.array([60])  # Default

# Process multiple subjects locally
print("Processing EDFs locally to extract features...")
print("This creates a small feature file instead of large EDFs")

all_features = []
for i in tqdm(range(1, 21)):  # Process 20 subjects
    features = download_and_process_edf(i)
    if features:
        all_features.append(features)

# Save compact feature file
feature_df = pd.DataFrame(all_features)
feature_df.to_csv('seizeit2_features.csv', index=False)
print(f"\n✅ Saved features to seizeit2_features.csv")
print(f"   Size: {os.path.getsize('seizeit2_features.csv')/1024:.1f} KB")
print("\nNow upload this small CSV to Kaggle/Colab for training!")
print("Much smaller than uploading EDF files!")