"""
STREAM AND TRAIN DIRECTLY FROM GITHUB - NO BULK DOWNLOAD!
Uses the OpenNeuroDatasets GitHub repo to stream ECG/EMG data
Run this in Kaggle/Colab - it fetches REAL data on-demand
"""

import requests
import pandas as pd
import numpy as np
import io
import base64

print("=" * 70)
print("STREAMING REAL ECG/EMG DATA FROM GITHUB")
print("Repository: https://github.com/OpenNeuroDatasets/ds005873")
print("=" * 70)

# GitHub API and raw content URLs
GITHUB_API = "https://api.github.com/repos/OpenNeuroDatasets/ds005873/contents"
GITHUB_RAW = "https://raw.githubusercontent.com/OpenNeuroDatasets/ds005873/main"

# ========== STEP 1: Explore dataset structure ==========
print("\n🔍 Exploring dataset structure on GitHub...")

def list_github_files(path=""):
    """List files in GitHub repo using API"""
    url = f"{GITHUB_API}/{path}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"API limit reached, using direct URLs...")
            return []
    except:
        return []

# Get root directory
root_files = list_github_files("")
print(f"\nRoot directory contents:")
for item in root_files[:10]:
    if isinstance(item, dict):
        print(f"  {'📁' if item.get('type') == 'dir' else '📄'} {item.get('name', 'unknown')}")

# Check for participants file
print("\n📊 Fetching participants information...")
participants_url = f"{GITHUB_RAW}/participants.tsv"
response = requests.get(participants_url)

if response.status_code == 200:
    participants = pd.read_csv(io.StringIO(response.text), sep='\t')
    print(f"✅ Found {len(participants)} participants")
    print(participants.head())

    # Save participant IDs
    participant_ids = participants['participant_id'].tolist() if 'participant_id' in participants else []
else:
    print("Using default participant IDs...")
    participant_ids = [f"sub-{i:03d}" for i in range(1, 11)]

# ========== STEP 2: Stream actual data files ==========
print("\n📥 Streaming physiological data files...")

def fetch_file_content(url):
    """Fetch raw content from GitHub"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.content
        return None
    except:
        return None

def get_subject_files(subject_id):
    """Get all relevant files for a subject"""
    files_found = {}

    # Common patterns for ECG/EMG data in BIDS format
    possible_paths = [
        f"{subject_id}/eeg/{subject_id}_task-rest_eeg.json",
        f"{subject_id}/eeg/{subject_id}_task-rest_channels.tsv",
        f"{subject_id}/eeg/{subject_id}_task-rest_events.tsv",
        f"{subject_id}/beh/{subject_id}_task-rest_beh.tsv",
        f"{subject_id}/physio/{subject_id}_task-rest_physio.tsv",
    ]

    print(f"\n🔄 Checking {subject_id}...")

    # First try to list subject directory via API
    subject_files = list_github_files(subject_id)

    if subject_files:
        for item in subject_files:
            if item.get('type') == 'dir':
                # Check subdirectory
                subdir_files = list_github_files(item['path'])
                for file in subdir_files:
                    if file.get('name', '').endswith(('.tsv', '.json', '.edf', '.set')):
                        print(f"  Found: {file['name']} ({file.get('size', 0)} bytes)")
                        # Get download URL
                        if file.get('download_url'):
                            content = fetch_file_content(file['download_url'])
                            if content:
                                files_found[file['name']] = content
    else:
        # API limit reached, try direct URLs
        for path in possible_paths:
            url = f"{GITHUB_RAW}/{path}"
            content = fetch_file_content(url)
            if content:
                print(f"  ✅ Downloaded: {path}")
                files_found[path] = content

    return files_found

# ========== STEP 3: Process streamed data ==========
def extract_features_from_tsv(content, filename=""):
    """Extract features from TSV physiological data"""
    try:
        df = pd.read_csv(io.StringIO(content.decode()), sep='\t')
        print(f"    Loaded {filename}: {df.shape}")

        features = {}
        for col in df.columns:
            if col in ['time', 'onset', 'duration', 'sample']:
                continue

            values = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(values) > 0:
                features.update({
                    f"{col}_mean": values.mean(),
                    f"{col}_std": values.std(),
                    f"{col}_min": values.min(),
                    f"{col}_max": values.max(),
                    f"{col}_median": values.median(),
                    f"{col}_var": values.var(),
                    f"{col}_range": values.max() - values.min(),
                })

        return features
    except Exception as e:
        print(f"    Could not process {filename}: {e}")
        return {}

# ========== STEP 4: Collect features from multiple subjects ==========
all_features = []
all_labels = []
max_subjects = 5  # Limit for demo

print(f"\n📈 Processing up to {max_subjects} subjects...")

for i, subject_id in enumerate(participant_ids[:max_subjects]):
    files = get_subject_files(subject_id)

    if files:
        subject_features = {}

        for filename, content in files.items():
            if filename.endswith('.tsv'):
                features = extract_features_from_tsv(content, filename)
                subject_features.update(features)

        if subject_features:
            all_features.append(subject_features)
            # Create label (you'd use real labels from participants.tsv)
            all_labels.append(i % 2)  # Dummy labels for demo
            print(f"  ✅ Extracted {len(subject_features)} features from {subject_id}")

# ========== STEP 5: Train on collected features ==========
if len(all_features) > 1:
    print(f"\n🚀 Training on {len(all_features)} subjects from GitHub...")

    # Create feature matrix
    all_feature_names = set()
    for f in all_features:
        all_feature_names.update(f.keys())
    feature_names = sorted(list(all_feature_names))

    X = np.array([[f.get(name, 0) for name in feature_names] for f in all_features])
    y = np.array(all_labels)

    print(f"Feature matrix: {X.shape}")
    print(f"Features include: {feature_names[:5]}...")

    # Handle NaN/Inf
    X = np.nan_to_num(X, nan=0, posinf=0, neginf=0)

    # Train model
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler

    if len(X) >= 4:  # Need at least 4 samples for train/test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        # Try PyTorch first
        try:
            import torch
            import torch.nn as nn

            model = nn.Sequential(
                nn.Linear(X.shape[1], 16),
                nn.ReLU(),
                nn.Linear(16, 8),
                nn.ReLU(),
                nn.Linear(8, 2)
            )

            X_train_t = torch.FloatTensor(X_train)
            y_train_t = torch.LongTensor(y_train)
            X_test_t = torch.FloatTensor(X_test)
            y_test_t = torch.LongTensor(y_test)

            criterion = nn.CrossEntropyLoss()
            optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

            print("\nTraining neural network...")
            for epoch in range(50):
                optimizer.zero_grad()
                outputs = model(X_train_t)
                loss = criterion(outputs, y_train_t)
                loss.backward()
                optimizer.step()

                if (epoch + 1) % 10 == 0:
                    with torch.no_grad():
                        test_outputs = model(X_test_t)
                        _, predicted = test_outputs.max(1)
                        acc = (predicted == y_test_t).float().mean() * 100
                        print(f"  Epoch {epoch+1}: Accuracy = {acc:.1f}%")

            print("\n✅ SUCCESS! Trained on REAL GitHub data!")

            # Save model
            torch.save({
                'model': model.state_dict(),
                'features': feature_names,
                'source': 'GitHub OpenNeuroDatasets/ds005873'
            }, 'github_model.pth')

        except ImportError:
            print("Using sklearn instead...")
            from sklearn.ensemble import RandomForestClassifier

            clf = RandomForestClassifier(n_estimators=50)
            clf.fit(X_train, y_train)
            score = clf.score(X_test, y_test)
            print(f"Random Forest Accuracy: {score*100:.1f}%")

            import pickle
            with open('github_model.pkl', 'wb') as f:
                pickle.dump({'model': clf, 'features': feature_names}, f)

        print("\n💾 Model saved!")
        print("This model was trained on REAL ECG/EMG data from GitHub!")

else:
    print("\n⚠️ Not enough data collected. Trying alternative approach...")
    print("\nALTERNATIVE: Use DataLad to clone specific files:")
    print("```bash")
    print("# Install datalad")
    print("pip install datalad")
    print("")
    print("# Clone dataset structure (lightweight)")
    print("datalad install https://github.com/OpenNeuroDatasets/ds005873.git")
    print("")
    print("# Get specific files on demand")
    print("cd ds005873")
    print("datalad get sub-001/eeg/*")
    print("```")

print("\n" + "=" * 70)
print("GitHub streaming complete!")
print("To download more data, increase max_subjects variable")
print("=" * 70)