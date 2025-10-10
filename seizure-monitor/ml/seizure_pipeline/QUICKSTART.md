# Quick Start Guide - EC2 Processing

## 5-Minute Setup

### 1. Launch EC2 Instance (AWS Console)

```
AMI: Ubuntu Server 22.04 LTS
Instance Type: t3.large
Storage: 50 GB gp3
Security Group: Allow SSH (port 22) from your IP
Key Pair: Create or use existing
```

### 2. Connect & Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@<EC2-IP>

# Run setup (copy-paste this entire block)
sudo apt update && sudo apt install -y python3-pip git
pip3 install boto3 pandas numpy scipy pyedflib scikit-learn
mkdir -p ~/seizure_processing/{scripts,output,logs}
cd ~/seizure_processing/scripts

# Test S3 connection
python3 << 'EOF'
import boto3
from botocore import UNSIGNED
from botocore.config import Config
s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))
response = s3.list_objects_v2(Bucket='openneuro.org', Prefix='ds005873/', MaxKeys=5)
print("✓ S3 Connected!")
for obj in response.get('Contents', []): print(f"  {obj['Key']}")
EOF
```

### 3. Upload Scripts

From your **local machine**:

```bash
cd /path/to/seizure_pipeline
EC2_IP=<your-ec2-ip>

scp -i your-key.pem convert_s3_edf_to_csv.py ubuntu@$EC2_IP:~/seizure_processing/scripts/
scp -i your-key.pem balance_dataset.py ubuntu@$EC2_IP:~/seizure_processing/scripts/
```

### 4. Run Pipeline

Back on **EC2**:

```bash
cd ~/seizure_processing/scripts

# Start in background session
nohup python3 convert_s3_edf_to_csv.py \
    --bucket openneuro.org \
    --dataset ds005873 \
    --output ~/seizure_processing/output \
    --pre_ictal 5 \
    --window 4 \
    --workers 4 \
    > ~/seizure_processing/logs/processing.log 2>&1 &

# Save the process ID
echo $! > ~/seizure_processing/pipeline.pid
```

### 5. Monitor Progress

```bash
# Watch logs in real-time
tail -f ~/seizure_processing/logs/processing.log

# Check progress
watch -n 10 'ls -lh ~/seizure_processing/output/subject_csvs/ | wc -l'

# Monitor resources
htop
```

### 6. Balance & Download

After processing completes (~5-6 hours):

```bash
# Balance dataset
cd ~/seizure_processing/scripts
python3 balance_dataset.py \
    --input ~/seizure_processing/output/combined/all_features.csv \
    --output ~/seizure_processing/output/balanced \
    --strategy all

# Compress results
cd ~/seizure_processing/output
tar -czf seizure_data_final.tar.gz combined/ balanced/

# Check size
ls -lh seizure_data_final.tar.gz
```

From **local machine**:

```bash
# Download results (~500MB-2GB)
scp -i your-key.pem ubuntu@$EC2_IP:~/seizure_processing/output/seizure_data_final.tar.gz ./

# Extract
tar -xzf seizure_data_final.tar.gz

# View summary
cat balanced/balancing_summary.txt
```

### 7. Terminate EC2

After downloading results:

```bash
# On EC2: Clean up
rm -rf ~/seizure_processing

# On AWS Console: Terminate instance to stop charges
```

## Test Run (5 minutes, free)

Process just one subject to test:

```bash
# On EC2
python3 convert_s3_edf_to_csv.py \
    --bucket openneuro.org \
    --dataset ds005873 \
    --output ~/test_output \
    --subjects sub-001 \
    --workers 2

# Should complete in ~5 minutes
# Output: ~2-3 MB CSV with ~48,000 samples
```

## Common Commands

### Check if processing is running
```bash
ps aux | grep convert_s3_edf_to_csv
```

### Stop processing
```bash
kill $(cat ~/seizure_processing/pipeline.pid)
```

### Resume from interruption
```bash
# Check which subjects are done
ls ~/seizure_processing/output/subject_csvs/

# Process remaining subjects
python3 convert_s3_edf_to_csv.py \
    --subjects sub-050 sub-051 ... \
    --output ~/seizure_processing/output
```

### Check disk space
```bash
df -h
du -sh ~/seizure_processing/output/*
```

## Expected Timeline

| Stage | Time | Output |
|-------|------|--------|
| Setup EC2 | 5 min | Environment ready |
| Test connection | 1 min | S3 accessible |
| Process 1 subject | 5 min | ~2 MB CSV |
| Process all 125 | 5-6 hrs | ~1-2 GB CSV |
| Balance data | 10 min | ~100 MB balanced |
| Compress & download | 5 min | Ready for training |

## Cost Estimate

- **t3.large**: $0.08/hr × 6 hrs = **$0.48**
- **S3 requests**: ~$0.50
- **Data transfer**: ~$0.10
- **Total**: ~**$1-2**

## Troubleshooting

### Connection timeout
```bash
# Increase boto3 timeout
export AWS_METADATA_SERVICE_TIMEOUT=10
```

### Out of memory
```bash
# Use fewer workers
python3 convert_s3_edf_to_csv.py --workers 1
```

### Slow processing
```bash
# Check network
ping s3.amazonaws.com

# Check CPU usage
htop
```

## Next Steps

After downloading:

1. **Validate data**:
   ```bash
   python3 -c "import pandas as pd; df=pd.read_csv('balanced/train_data.csv'); print(df.head()); print(df['label'].value_counts())"
   ```

2. **Train model**:
   ```bash
   cd "Seizure Dataset/Mostly HR + little Oxygen level 234 events"
   cp ~/Downloads/balanced/train_data.csv ./data_csv/
   python Round\ 2\ Results/train_lstm_v2.py
   ```

3. **Experiment**:
   - Try different pre-ictal windows (5, 10, 15 min)
   - Test different balancing strategies
   - Add more features (EEG, EMG, MOV)

## Support

Need help? Check:
1. Processing logs: `~/seizure_processing/logs/processing.log`
2. Main README: `README.md`
3. Python errors: Look for `Traceback` in logs
