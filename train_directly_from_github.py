"""
TRAIN DIRECTLY FROM GITHUB - No bulk download needed!
Stream data directly from OpenNeuroDatasets GitHub repo
This uses the REAL ECG/EMG data without downloading everything
"""

import requests
import pandas as pd
import numpy as np
import io
import json
from urllib.parse import quote

print("=" * 60)
print("TRAINING DIRECTLY FROM GITHUB - OpenNeuro ds005873")
print("=" * 60)

# GitHub raw content base URL
GITHUB_RAW = "https://raw.githubusercontent.com/OpenNeuroDatasets/ds005873/main"

# ========== STEP 1: Get dataset metadata from GitHub ==========
print("\n📊 Fetching dataset info from GitHub...")

# Get dataset description
try:
    response = requests.get(f"{GITHUB_RAW}/dataset_description.json")
    if response.status_code == 200:
        dataset_info = response.json()
        print(f"Dataset: {dataset_info.get('Name', 'Unknown')}")
        print(f"BIDSVersion: {dataset_info.get('BIDSVersion', 'Unknown')}")
except Exception as e:
    print(f"Could not fetch dataset description: {e}")

# Get participants info
print("\n👥 Fetching participants list...")
try:
    response = requests.get(f"{GITHUB_RAW}/participants.tsv")
    if response.status_code == 200:
        participants_df = pd.read_csv(io.StringIO(response.text), sep='\t')
        print(f"Found {len(participants_df)} participants")
        print(f"Columns: {participants_df.columns.tolist()}")
        print(participants_df.head())
except Exception as e:
    print(f"Could not fetch participants: {e}")

# ========== STEP 2: Stream individual data files ==========
print("\n📥 Streaming data files directly from GitHub...")

def fetch_github_file(path):
    """Fetch a file directly from GitHub"""
    url = f"{GITHUB_RAW}/{path}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.content
        else:
            return None
    except:
        return None

def fetch_subject_data(subject_id):
    """Fetch all data for a specific subject"""
    subject_data = {}

    # Common BIDS file patterns for physiological data
    file_patterns = [
        f"{subject_id}/eeg/{subject_id}_task-rest_eeg.tsv",
        f"{subject_id}/physio/{subject_id}_physio.tsv.gz",
        f"{subject_id}/func/{subject_id}_task-rest_physio.tsv",
        f"{subject_id}/beh/{subject_id}_beh.tsv",
        # JSON sidecars
        f"{subject_id}/eeg/{subject_id}_task-rest_eeg.json",
        f"{subject_id}/physio/{subject_id}_physio.json",
    ]

    print(f"\nFetching {subject_id}...")
    for pattern in file_patterns:
        content = fetch_github_file(pattern)
        if content:
            print(f"  ✅ Found: {pattern}")
            subject_data[pattern] = content

            # Parse if it's TSV
            if pattern.endswith('.tsv'):
                try:
                    df = pd.read_csv(io.StringIO(content.decode()), sep='\t')
                    print(f"     Shape: {df.shape}, Columns: {df.columns.tolist()[:3]}...")
                    subject_data[pattern + '_parsed'] = df
                except:
                    pass

            # Parse if it's JSON
            elif pattern.endswith('.json'):
                try:
                    metadata = json.loads(content)
                    print(f"     Metadata keys: {list(metadata.keys())[:5]}...")
                    subject_data[pattern + '_parsed'] = metadata
                except:
                    pass

    return subject_data

# ========== STEP 3: Process ECG/EMG data ==========
def process_physio_signals(data_df, metadata=None):
    """Extract features from physiological signals"""
    features = {}

    if data_df is None or data_df.empty:
        return features

    # Get sampling rate from metadata or default
    fs = 256  # Default for many physio recordings
    if metadata and 'SamplingFrequency' in metadata:
        fs = metadata['SamplingFrequency']

    print(f"  Processing {len(data_df)} samples at {fs} Hz...")

    # Process each column as a potential signal
    for col in data_df.columns:
        if col in ['time', 'timestamp', 'sample']:
            continue

        signal = data_df[col].dropna().values
        if len(signal) < fs:  # Need at least 1 second
            continue

        # Extract features
        col_features = {
            f'{col}_mean': np.mean(signal),
            f'{col}_std': np.std(signal),
            f'{col}_min': np.min(signal),
            f'{col}_max': np.max(signal),
            f'{col}_rms': np.sqrt(np.mean(signal**2)),
            f'{col}_var': np.var(signal),
        }

        # Frequency domain features
        try:
            fft = np.fft.fft(signal[:fs*10])  # Use first 10 seconds
            freqs = np.fft.fftfreq(len(fft), 1/fs)
            psd = np.abs(fft)**2

            # Dominant frequency
            dominant_freq_idx = np.argmax(psd[:len(psd)//2])
            col_features[f'{col}_dominant_freq'] = abs(freqs[dominant_freq_idx])

            # Power in bands
            low_power = np.sum(psd[(abs(freqs) < 50)])
            high_power = np.sum(psd[(abs(freqs) >= 50) & (abs(freqs) < 100)])
            col_features[f'{col}_low_power'] = low_power
            col_features[f'{col}_high_power'] = high_power

        except:
            pass

        features.update(col_features)

    return features

# ========== STEP 4: Stream and process multiple subjects ==========
print("\n🔄 Streaming and processing subjects...")

# Try to get first 5 subjects
all_features = []
all_labels = []

for i in range(1, 6):  # Try subjects 001-005
    subject_id = f"sub-{i:03d}"

    # Fetch this subject's data
    subject_data = fetch_subject_data(subject_id)

    if not subject_data:
        print(f"  ⚠️ No data found for {subject_id}")
        continue

    # Process any TSV data we found
    for key, value in subject_data.items():
        if key.endswith('_parsed') and isinstance(value, pd.DataFrame):
            # Get corresponding metadata if available
            json_key = key.replace('.tsv_parsed', '.json_parsed')
            metadata = subject_data.get(json_key, {})

            # Extract features
            features = process_physio_signals(value, metadata)

            if features:
                all_features.append(features)
                # Create a label (you'd replace this with actual labels)
                all_labels.append(i % 2)  # Alternating labels for demo
                print(f"  ✅ Extracted {len(features)} features from {subject_id}")

# ========== STEP 5: Train model on streamed data ==========
if all_features:
    print(f"\n🚀 Training on {len(all_features)} samples from GitHub data...")

    # Convert to array
    feature_names = list(all_features[0].keys())
    X = np.array([[f.get(k, 0) for k in feature_names] for f in all_features])
    y = np.array(all_labels)

    print(f"Feature matrix shape: {X.shape}")
    print(f"Sample features: {feature_names[:5]}...")

    # Normalize
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split

    # Handle NaN values
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    if len(X) > 1:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42
        )

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        # Simple model
        try:
            import torch
            import torch.nn as nn

            # Convert to tensors
            X_train_t = torch.FloatTensor(X_train)
            y_train_t = torch.LongTensor(y_train)
            X_test_t = torch.FloatTensor(X_test)
            y_test_t = torch.LongTensor(y_test)

            # Define model
            model = nn.Sequential(
                nn.Linear(X.shape[1], 32),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(32, 16),
                nn.ReLU(),
                nn.Linear(16, 2)
            )

            criterion = nn.CrossEntropyLoss()
            optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

            print("\n📈 Training neural network on GitHub data...")
            for epoch in range(100):
                optimizer.zero_grad()
                outputs = model(X_train_t)
                loss = criterion(outputs, y_train_t)
                loss.backward()
                optimizer.step()

                if (epoch + 1) % 25 == 0:
                    model.eval()
                    with torch.no_grad():
                        test_out = model(X_test_t)
                        _, pred = test_out.max(1)
                        acc = (pred == y_test_t).float().mean() * 100
                        print(f"  Epoch {epoch+1}: Loss={loss:.3f}, Accuracy={acc:.1f}%")
                    model.train()

            # Save model
            torch.save({
                'model_state': model.state_dict(),
                'feature_names': feature_names,
                'scaler_mean': scaler.mean_,
                'scaler_scale': scaler.scale_,
                'github_url': GITHUB_RAW
            }, 'github_trained_model.pth')

            print("\n✅ Model trained on REAL GitHub data!")
            print("📥 Download 'github_trained_model.pth'")

        except ImportError:
            print("PyTorch not available, using sklearn...")
            from sklearn.ensemble import RandomForestClassifier

            clf = RandomForestClassifier(n_estimators=50, random_state=42)
            clf.fit(X_train, y_train)

            acc = clf.score(X_test, y_test) * 100
            print(f"Random Forest Accuracy: {acc:.1f}%")

            import pickle
            with open('github_trained_model.pkl', 'wb') as f:
                pickle.dump({
                    'model': clf,
                    'scaler': scaler,
                    'feature_names': feature_names,
                    'github_url': GITHUB_RAW
                }, f)

            print("✅ Model saved as 'github_trained_model.pkl'")

else:
    print("\n⚠️ Could not extract features from GitHub data.")
    print("\nAlternative: Clone specific files manually:")
    print("1. Go to: https://github.com/OpenNeuroDatasets/ds005873")
    print("2. Navigate to a subject folder (e.g., sub-001)")
    print("3. Download individual .tsv or .edf files")
    print("4. Upload to Kaggle and process locally")

print("\n" + "=" * 60)
print("GitHub streaming complete!")
print("=" * 60)

# ========== BONUS: List all available files ==========
print("\n📂 To see all available files in the dataset:")
print("Visit: https://github.com/OpenNeuroDatasets/ds005873")
print("Or use GitHub API to list files programmatically:")

try:
    # GitHub API to list files (without authentication, limited to 60 requests/hour)
    api_response = requests.get(
        "https://api.github.com/repos/OpenNeuroDatasets/ds005873/contents/sub-001",
        headers={'Accept': 'application/vnd.github.v3+json'}
    )
    if api_response.status_code == 200:
        files = api_response.json()
        print(f"\nFiles in sub-001:")
        for file in files[:10]:
            print(f"  - {file['name']} ({file.get('size', 0)} bytes)")
except:
    pass