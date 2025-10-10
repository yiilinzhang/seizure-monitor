# EC2 Spot Instance Strategy (Save 75%!)

## Why Spot Instances are Perfect for This

### Cost Comparison
```
Regular On-Demand EC2:
  t3.large: $0.08/hour × 6 hours = $0.48

Spot Instance:
  t3.large: $0.02/hour × 6 hours = $0.12

Savings: 75% off! ($0.36 saved)
```

### Why It Works
- **Interruptible but resumable**: If spot instance terminates, just restart
- **Batch processing**: Process 5 subjects at a time (15 min per batch)
- **Checkpointing**: Never lose progress
- **No GPU needed**: CPU-only processing (no expensive GPU instances)

## Batch Processing Strategy

### Process in Small Batches
```bash
# Batch 1: Subjects 1-5 (15 minutes)
python3 batch_process_s3.py --start_batch 1 --end_batch 1

# Batch 2: Subjects 6-10 (15 minutes)
python3 batch_process_s3.py --start_batch 2 --end_batch 2

# Batch 3: Subjects 11-15 (15 minutes)
python3 batch_process_s3.py --start_batch 3 --end_batch 3

# ... 25 batches total for 125 subjects
```

### Automatic Resume
```bash
# If interrupted, just run again - it resumes automatically!
python3 batch_process_s3.py

# It checks checkpoint.json and skips completed subjects
```

## Launch Spot Instance (AWS Console)

### Step 1: Launch Instance
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Select **Ubuntu Server 22.04 LTS**

### Step 2: Instance Configuration
```
Instance Type: t3.large (2 vCPU, 8 GB RAM)

Pricing: ✓ Request Spot Instances
  Maximum price: $0.03/hour (vs $0.08 on-demand)

Storage: 30 GB gp3 (only need space for temp files)

Security Group:
  - SSH (port 22) from your IP
```

### Step 3: Launch
- Review and launch
- Wait ~2 minutes for instance to start
- Note the public IP address

## Quick Setup & Run

### One-Command Setup
```bash
# SSH into spot instance
ssh -i your-key.pem ubuntu@<SPOT-IP>

# Install dependencies (2 minutes)
sudo apt update && sudo apt install -y python3-pip
pip3 install boto3 pandas numpy scipy pyedflib scikit-learn

# Upload scripts
# (From your local machine)
scp -i your-key.pem batch_process_s3.py ubuntu@<SPOT-IP>:~/
scp -i your-key.pem convert_s3_edf_to_csv.py ubuntu@<SPOT-IP>:~/
```

### Run Processing
```bash
# Process first batch (test)
python3 batch_process_s3.py --batch_size 5 --start_batch 1 --end_batch 1

# If successful, run all batches
nohup python3 batch_process_s3.py --batch_size 5 > processing.log 2>&1 &

# Monitor progress
tail -f processing.log
```

## Batch Processing Commands

### Process Specific Batches
```bash
# Process batch 1 only (subjects 1-5)
python3 batch_process_s3.py --start_batch 1 --end_batch 1

# Process batches 5-10 (subjects 21-50)
python3 batch_process_s3.py --start_batch 5 --end_batch 10

# Process all remaining batches (auto-resume)
python3 batch_process_s3.py
```

### Combine Results
```bash
# After all batches complete, combine into one file
python3 batch_process_s3.py --combine

# Output: processed_batches/combined/all_features.csv
```

### Check Progress
```bash
# See completed batches
ls -lh processed_batches/batches/

# Check checkpoint
cat processed_batches/processing_checkpoint.json

# Monitor live
watch -n 10 'ls processed_batches/batches/ | wc -l'
```

## Handling Spot Interruptions

### If Spot Instance Terminates

**Don't worry!** Your progress is saved:

```bash
# Launch new spot instance
# Upload scripts again
# Resume processing (automatically picks up where it left off)
python3 batch_process_s3.py

# It reads checkpoint.json and continues from last completed subject
```

### Output Structure
```
processed_batches/
├── processing_checkpoint.json          ← Resume from here
├── batches/
│   ├── batch_001_subjects_sub-001_sub-005.csv  ← Batch 1 saved
│   ├── batch_002_subjects_sub-006_sub-010.csv  ← Batch 2 saved
│   ├── batch_003_subjects_sub-011_sub-015.csv  ← Batch 3 saved
│   └── ...
└── combined/
    └── all_features.csv               ← Final combined file
```

## Timeline & Cost Breakdown

### Processing Timeline
```
125 subjects ÷ 5 subjects/batch = 25 batches

Per batch:
  - Download EDF files: ~3 min
  - Process features: ~10 min
  - Save results: ~1 min
  Total: ~15 min per batch

Total time: 25 batches × 15 min = 375 min = 6.25 hours
```

### Cost Breakdown
```
Spot Instance (t3.large):
  Hourly rate: $0.02-0.03/hour
  Processing: 6.25 hours
  Cost: $0.125 - $0.188

S3 Requests:
  ~1,125 GET requests × $0.0004/1000 = $0.45

Data Transfer:
  Output CSV download: ~500 MB × $0.09/GB = $0.045

Total: ~$0.62 (vs $2+ with on-demand)
```

## Advantages of Batch Processing

### 1. Fault Tolerance ✅
- Lose max 15 minutes of work if interrupted
- Auto-resume from checkpoint
- No need to babysit

### 2. Cost Optimization ✅
- 75% cheaper with spot instances
- Process during low-demand hours for even better prices
- Can pause/resume anytime

### 3. Incremental Results ✅
- Get partial results as you go
- Can analyze first few batches while rest process
- Early validation before processing all 125 subjects

### 4. Flexibility ✅
```bash
# Weekend: Process 10 batches
python3 batch_process_s3.py --end_batch 10

# Next week: Process remaining 15 batches
python3 batch_process_s3.py --start_batch 11
```

## Monitoring & Tips

### Monitor Progress
```bash
# Watch log in real-time
tail -f processing.log

# Count completed subjects
cat processing_checkpoint.json | grep -o "sub-[0-9]*" | wc -l

# Check batch files
ls -lh processed_batches/batches/ | tail -5
```

### Optimize for Speed
```bash
# Use larger batches if instance is stable
python3 batch_process_s3.py --batch_size 10

# Or smaller batches for max safety
python3 batch_process_s3.py --batch_size 3
```

### Download Results Incrementally
```bash
# Download completed batches while processing continues
scp -i key.pem ubuntu@<SPOT-IP>:~/processed_batches/batches/*.csv ./local_batches/

# Combine locally
cat local_batches/*.csv > partial_dataset.csv

# Start training on partial data while rest processes!
```

## Why No GPU Needed

### This is CPU-Bound Processing:
```
Tasks:
  ✓ Read EDF files        → CPU (file I/O)
  ✓ Parse signals         → CPU (parsing)
  ✓ Calculate FFT         → CPU (scipy)
  ✓ Detect R-peaks        → CPU (scipy.signal)
  ✓ Compute statistics    → CPU (numpy)
  ✓ Write CSV             → CPU (file I/O)

NOT doing:
  ✗ Neural network training  → Would need GPU
  ✗ Deep learning inference  → Would need GPU
  ✗ Image processing         → Would benefit from GPU
```

### Cost Comparison:
```
CPU Instance (t3.large):
  Cost: $0.02/hour spot
  Perfect for this task!

GPU Instance (g4dn.xlarge):
  Cost: $0.15/hour spot (7.5× more expensive!)
  Overkill - GPU sits idle
```

## Recommended Workflow

### Option 1: Conservative (Most Reliable)
```bash
# Process 5 subjects at a time, 25 separate runs
for i in {1..25}; do
  python3 batch_process_s3.py --start_batch $i --end_batch $i
  sleep 60  # Cool down between batches
done
```

### Option 2: Balanced (Recommended)
```bash
# Auto-process all batches with checkpoint resume
nohup python3 batch_process_s3.py --batch_size 5 > log.txt 2>&1 &

# If interrupted, relaunch spot instance and run same command
# Automatically resumes from checkpoint!
```

### Option 3: Aggressive (Fastest)
```bash
# Larger batches, process quickly
python3 batch_process_s3.py --batch_size 10

# 125 subjects ÷ 10 = 13 batches (~3 hours total)
```

## Summary

**Your idea is excellent!**

- ✅ Use cheap spot instances ($0.02/hr)
- ✅ Process 5 subjects per batch (15 min each)
- ✅ Auto-checkpoint and resume
- ✅ No GPU needed (CPU is perfect)
- ✅ Total cost: ~$0.60 for entire dataset
- ✅ Fault-tolerant and flexible

This is **way better** than asking for vGPU access or using expensive on-demand instances!
