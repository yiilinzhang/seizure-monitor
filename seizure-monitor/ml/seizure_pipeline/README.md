# Seizure Dataset Processing Pipeline

Complete pipeline for converting 120GB of EDF seizure data from OpenNeuro S3 to ML-ready CSV format on EC2.

## Overview

This pipeline processes the ds005873 dataset (125 subjects, ~800 seizures) from OpenNeuro:
- **Input**: EDF files from S3 (ECG, EEG, EMG, MOV modalities)
- **Processing**: Multi-modal feature extraction with temporal labeling
- **Output**: Balanced CSV datasets ready for LSTM training
- **Cost**: Under $2 for entire dataset
- **Time**: ~5-6 hours on t3.large EC2 instance

## Features Extracted

### From ECG (Heart signals)
- Heart Rate (HR) via R-peak detection
- Heart Rate Variability (HRV/SDNN)

### From EEG (Brain signals)
- Delta band power (0.5-4 Hz)
- Theta band power (4-8 Hz)
- Alpha band power (8-13 Hz)
- Beta band power (13-30 Hz)

### From EMG (Muscle signals)
- RMS amplitude
- Variance

### From MOV (Motion/accelerometer)
- Movement magnitude
- Standard deviation

## Temporal Labels

- **0 (Inter-ictal)**: Normal baseline periods
- **1 (Pre-ictal)**: 5 minutes before seizure onset
- **2 (Ictal)**: During seizure

## Quick Start

### 1. Local Testing (with sample data)

Test on your local sub-001 sample first:

```bash
cd seizure_pipeline

# Convert local EDF files to CSV
python3 convert_s3_edf_to_csv.py \
    --bucket local \
    --dataset ../ds005873-download \
    --output ./test_output \
    --subjects sub-001

# Balance the data
python3 balance_dataset.py \
    --input ./test_output/combined/all_features.csv \
    --output ./test_balanced \
    --strategy all
```

### 2. EC2 Processing (full dataset)

#### Step 1: Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 instance
# Recommended: t3.large (2 vCPU, 8GB RAM, ~$0.08/hr)
# Storage: 50GB EBS volume
# Region: us-east-1 (same as OpenNeuro S3)

# Get instance IP
EC2_IP=<your-instance-ip>
```

#### Step 2: Setup EC2 Environment

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@$EC2_IP

# Download and run setup script
wget https://raw.githubusercontent.com/YOUR_REPO/setup_ec2.sh
chmod +x setup_ec2.sh
./setup_ec2.sh
```

Or manually:

```bash
# Copy setup script to EC2
scp -i your-key.pem setup_ec2.sh ubuntu@$EC2_IP:~/

# SSH in and run
ssh -i your-key.pem ubuntu@$EC2_IP
chmod +x setup_ec2.sh
./setup_ec2.sh
```

#### Step 3: Upload Processing Scripts

```bash
# From your local machine
scp -i your-key.pem convert_s3_edf_to_csv.py ubuntu@$EC2_IP:~/seizure_processing/scripts/
scp -i your-key.pem balance_dataset.py ubuntu@$EC2_IP:~/seizure_processing/scripts/
```

#### Step 4: Run Pipeline

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@$EC2_IP

# Start tmux session (keeps running if disconnected)
tmux new -s processing

# Activate environment
source ~/seizure_env/bin/activate

# Run pipeline
cd ~/seizure_processing/scripts
./run_pipeline.sh
```

#### Step 5: Monitor Progress

In a new terminal (while pipeline runs):

```bash
ssh -i your-key.pem ubuntu@$EC2_IP
cd ~/seizure_processing/scripts
./monitor_processing.sh
```

Or check logs:

```bash
tail -f ~/seizure_processing/logs/processing.log
```

#### Step 6: Download Results

```bash
# Download compressed results (~500MB-2GB)
scp -i your-key.pem ubuntu@$EC2_IP:~/seizure_processing/output/*.tar.gz ./

# Extract locally
tar -xzf seizure_data_*.tar.gz
```

## Output Structure

```
output/
├── subject_csvs/              # Individual subject files
│   ├── sub-001_features.csv
│   ├── sub-002_features.csv
│   └── ...
├── combined/                  # Full dataset
│   └── all_features.csv       # ~1-2 GB, all 125 subjects
└── balanced/                  # Balanced datasets
    ├── temporal_balanced.csv  # Temporal window balancing
    ├── event_balanced.csv     # Event-based balancing
    ├── focal_balanced.csv     # Focal sampling around seizures
    ├── train_data.csv         # Training set (80%)
    ├── test_data.csv          # Test set (20%)
    └── balancing_summary.txt  # Statistics
```

## CSV Format

Output CSV compatible with existing LSTM model:

```csv
event_id,userId,dataTime,hr,hrv,eeg_delta,eeg_theta,eeg_alpha,eeg_beta,emg_rms,emg_var,mov_mag,mov_std,label
sub-001_run03_0,sub-001,2000-01-01 00:00:00,72.5,45.2,0.23,0.18,0.15,0.12,0.08,0.02,0.05,0.01,0
sub-001_run03_4,sub-001,2000-01-01 00:00:04,73.1,44.8,0.25,0.19,0.14,0.11,0.09,0.02,0.06,0.01,0
```

For compatibility with existing model (HR only):

```csv
event_id,userId,dataTime,hr,o2Sat,label
sub-001_run03_0,sub-001,2000-01-01 00:00:00,72.5,-1,0
```

## Balancing Strategies

### 1. Temporal Window Balancing
Best for pre-seizure detection:
- Keeps all pre-ictal and ictal samples
- Downsamples inter-ictal by 100:1
- Result: ~500K samples with better balance

### 2. Event-Based Balancing
Best for diverse representation:
- Samples complete recording runs
- 3:1 ratio of normal to seizure events
- Result: ~3,200 events with temporal context

### 3. Focal Sampling
Best for focused learning:
- Keeps all data ±10 min from seizures
- Samples 1% of far-away data
- Result: ~400K samples, seizure-focused

## Training with Balanced Data

### Using Existing LSTM Model

```bash
# Navigate to your existing model directory
cd "../Seizure Dataset/Mostly HR + little Oxygen level 234 events"

# Copy balanced data
cp ~/seizure_processing/output/balanced/train_data.csv ./data_csv/
cp ~/seizure_processing/output/balanced/test_data.csv ./data_csv/

# Train with existing script
python Round\ 2\ Results/train_lstm_v2.py
```

### Multi-Modal Training

For better accuracy, use all features:

```python
# Modify dataset_sequences_v2.py to include additional features
class MultiModalSequenceDataset(Dataset):
    def __init__(self, csv_path, seq_len=30):
        df = pd.read_csv(csv_path)

        # Extract all features
        features = ['hr', 'hrv', 'eeg_delta', 'eeg_theta',
                   'eeg_alpha', 'eeg_beta', 'emg_rms', 'mov_mag']

        # Normalize and create sequences
        # ... (similar to existing code)
```

## Cost & Performance

### EC2 Costs (us-east-1)

| Instance | vCPU | RAM | Price/hr | Total Cost | Time |
|----------|------|-----|----------|------------|------|
| t3.medium | 2 | 4GB | $0.04 | $0.20 | ~8 hrs |
| t3.large | 2 | 8GB | $0.08 | $0.50 | ~6 hrs |
| t3.xlarge | 4 | 16GB | $0.17 | $0.85 | ~3 hrs |

Plus:
- S3 requests: ~$0.50
- Data transfer out: ~$0.10 (for 2GB download)
- **Total: $1-2** for full pipeline

### Data Reduction

- **Input**: 120 GB of raw EDF files
- **Output**: 1-2 GB of feature CSV
- **Balanced**: 50-100 MB for training
- **Compression ratio**: 99:1

## Troubleshooting

### Out of Memory Error

```bash
# Reduce parallel workers
python3 convert_s3_edf_to_csv.py --workers 1

# Or use smaller instance and process fewer subjects at a time
python3 convert_s3_edf_to_csv.py --subjects sub-001 sub-002
```

### S3 Connection Failed

```bash
# Test connectivity
python3 scripts/test_s3_connection.py

# Check region - should be in us-east-1 for best performance
```

### Incomplete Processing

```bash
# Check which subjects were processed
ls ~/seizure_processing/output/subject_csvs/

# Resume from specific subject
python3 convert_s3_edf_to_csv.py --subjects sub-050 sub-051 ...
```

### Disk Space Running Out

```bash
# Clean up temporary files
./cleanup.sh

# Or manually
rm -rf /tmp/sub-*
rm -rf ~/seizure_processing/data/temp_*
```

## Advanced Usage

### Process Specific Subjects Only

```bash
python3 convert_s3_edf_to_csv.py \
    --subjects sub-001 sub-002 sub-003 \
    --output ./partial_output
```

### Adjust Pre-Ictal Window

```bash
# Use 10-minute pre-ictal window
python3 convert_s3_edf_to_csv.py --pre_ictal 10
```

### Extract Only Specific Modalities

Edit `convert_s3_edf_to_csv.py` line 144:

```python
# Only process ECG and EEG
for modality in ['ecg', 'eeg']:  # Remove 'emg', 'mov'
```

### Custom Balancing

```python
from balance_dataset import DatasetBalancer

balancer = DatasetBalancer('all_features.csv', './custom_output')

# Create custom ratio
balanced = balancer.temporal_window_balance(
    pre_ictal_minutes=10,  # Longer pre-ictal
    downsample_ratio=50    # Less aggressive downsampling
)
```

## Dataset Statistics

### Expected Output

- **Total samples**: ~24 million (unbalanced)
- **Seizure samples**: ~16,000 (0.07%)
- **Pre-ictal samples** (5 min): ~360,000 (1.5%)
- **Inter-ictal samples**: ~23.6 million (98.4%)

### After Balancing (temporal strategy)

- **Total samples**: ~500,000
- **Inter-ictal**: ~400,000 (80%)
- **Pre-ictal**: ~80,000 (16%)
- **Ictal**: ~20,000 (4%)
- **Ratio**: 20:4:1 (much better than 1517:23:1!)

## Integration with Existing Model

The output CSV format is designed to work seamlessly with your existing LSTM model:

1. **Same column structure**: event_id, userId, dataTime, hr, o2Sat, label
2. **Same sequence processing**: Compatible with `dataset_sequences_v2.py`
3. **Same training loop**: Works with `train_lstm_v2.py`
4. **Enhanced features**: Optional additional columns for multi-modal training

Simply replace your existing data files and retrain!

## Next Steps

After processing:

1. **Analyze results**:
   ```bash
   python -c "import pandas as pd; df=pd.read_csv('balanced/train_data.csv'); print(df.describe()); print(df['label'].value_counts())"
   ```

2. **Train baseline model**:
   Use existing LSTM with HR features only

3. **Train multi-modal model**:
   Incorporate EEG, EMG, MOV features for better accuracy

4. **Experiment with strategies**:
   Compare temporal vs event-based vs focal balancing

5. **Optimize pre-ictal window**:
   Test 5, 10, 15, 30 minute windows for best prediction

## Support

For issues or questions:
1. Check `processing.log` for detailed error messages
2. Review troubleshooting section above
3. Verify S3 connectivity with test script
4. Ensure sufficient disk space and memory

## License

This pipeline processes data from OpenNeuro ds005873 dataset. Please cite original dataset when publishing results.
