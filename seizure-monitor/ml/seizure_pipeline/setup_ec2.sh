#!/bin/bash
# Setup script for EC2 instance to process seizure EDF data
# Run this after launching an Ubuntu EC2 instance

set -e  # Exit on error

echo "=========================================="
echo "EC2 Setup for Seizure Data Processing"
echo "=========================================="

# Update system
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Python and essential tools
echo "Installing Python and development tools..."
sudo apt install -y python3-pip python3-dev python3-venv
sudo apt install -y build-essential wget curl git
sudo apt install -y htop tmux  # For monitoring and persistent sessions

# Create virtual environment
echo "Creating Python virtual environment..."
cd ~
python3 -m venv seizure_env
source seizure_env/bin/activate

# Install Python packages
echo "Installing Python packages..."
pip install --upgrade pip
pip install boto3
pip install pandas numpy scipy
pip install pyedflib
pip install scikit-learn
pip install tqdm
pip install psutil  # For system monitoring

# Create working directories
echo "Creating working directories..."
mkdir -p ~/seizure_processing
mkdir -p ~/seizure_processing/scripts
mkdir -p ~/seizure_processing/data
mkdir -p ~/seizure_processing/logs
mkdir -p ~/seizure_processing/output

# Download processing scripts
echo "Setting up processing scripts..."
cd ~/seizure_processing/scripts

# Create a script to test S3 connectivity
cat > test_s3_connection.py << 'EOF'
#!/usr/bin/env python3
import boto3
from botocore import UNSIGNED
from botocore.config import Config

# Test connection to OpenNeuro S3
s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

try:
    response = s3.list_objects_v2(
        Bucket='openneuro.org',
        Prefix='ds005873/',
        MaxKeys=5
    )
    print("✓ Successfully connected to OpenNeuro S3")
    print("Sample files:")
    for obj in response.get('Contents', []):
        print(f"  - {obj['Key']}")
except Exception as e:
    print(f"✗ Failed to connect: {e}")
EOF

chmod +x test_s3_connection.py

# Create monitoring script
cat > monitor_processing.sh << 'EOF'
#!/bin/bash
# Monitor processing progress

while true; do
    clear
    echo "=== Processing Monitor ==="
    echo "Time: $(date)"
    echo ""
    echo "CPU & Memory:"
    top -b -n 1 | head -n 5
    echo ""
    echo "Disk Usage:"
    df -h | grep -E "/$|/home"
    echo ""
    echo "Processing Logs (last 10 lines):"
    tail -n 10 ~/seizure_processing/logs/processing.log 2>/dev/null || echo "No logs yet"
    echo ""
    echo "Output Files:"
    ls -lh ~/seizure_processing/output/*.csv 2>/dev/null | tail -5 || echo "No output yet"
    sleep 5
done
EOF

chmod +x monitor_processing.sh

# Create main run script
cat > run_pipeline.sh << 'EOF'
#!/bin/bash
# Main pipeline runner

# Activate virtual environment
source ~/seizure_env/bin/activate

# Set paths
SCRIPT_DIR=~/seizure_processing/scripts
OUTPUT_DIR=~/seizure_processing/output
LOG_DIR=~/seizure_processing/logs

# Create timestamp for this run
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE=$LOG_DIR/processing_${TIMESTAMP}.log

echo "Starting processing pipeline at $(date)" | tee $LOG_FILE
echo "Output directory: $OUTPUT_DIR" | tee -a $LOG_FILE
echo "Log file: $LOG_FILE" | tee -a $LOG_FILE

# Test S3 connection first
echo "Testing S3 connection..." | tee -a $LOG_FILE
python3 $SCRIPT_DIR/test_s3_connection.py | tee -a $LOG_FILE

# Run main conversion
echo "Starting EDF to CSV conversion..." | tee -a $LOG_FILE
python3 $SCRIPT_DIR/convert_s3_edf_to_csv.py \
    --bucket openneuro.org \
    --dataset ds005873 \
    --output $OUTPUT_DIR \
    --pre_ictal 5 \
    --window 4 \
    --workers 4 \
    2>&1 | tee -a $LOG_FILE

# Check if conversion was successful
if [ -f "$OUTPUT_DIR/combined/all_features.csv" ]; then
    echo "Conversion successful!" | tee -a $LOG_FILE

    # Run balancing
    echo "Balancing dataset..." | tee -a $LOG_FILE
    python3 $SCRIPT_DIR/balance_dataset.py \
        --input $OUTPUT_DIR/combined/all_features.csv \
        --output $OUTPUT_DIR/balanced \
        --strategy all \
        2>&1 | tee -a $LOG_FILE

    # Compress results
    echo "Compressing output files..." | tee -a $LOG_FILE
    cd $OUTPUT_DIR
    tar -czf seizure_data_${TIMESTAMP}.tar.gz combined/ balanced/

    echo "Pipeline completed successfully!" | tee -a $LOG_FILE
    echo "Compressed file: $OUTPUT_DIR/seizure_data_${TIMESTAMP}.tar.gz" | tee -a $LOG_FILE

    # Show file sizes
    echo "" | tee -a $LOG_FILE
    echo "Output file sizes:" | tee -a $LOG_FILE
    ls -lh $OUTPUT_DIR/*.tar.gz | tee -a $LOG_FILE
    ls -lh $OUTPUT_DIR/combined/*.csv | tee -a $LOG_FILE
    ls -lh $OUTPUT_DIR/balanced/*.csv | tee -a $LOG_FILE
else
    echo "Conversion failed! Check logs for errors." | tee -a $LOG_FILE
    exit 1
fi
EOF

chmod +x run_pipeline.sh

# Create cleanup script
cat > cleanup.sh << 'EOF'
#!/bin/bash
# Clean up temporary files to save space

echo "Cleaning up temporary files..."
rm -rf ~/seizure_processing/data/temp_*
rm -rf /tmp/sub-*
echo "Cleanup complete"
EOF

chmod +x cleanup.sh

# Test S3 connection
echo ""
echo "Testing S3 connection..."
python3 test_s3_connection.py

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload your processing scripts:"
echo "   scp convert_s3_edf_to_csv.py ubuntu@<EC2_IP>:~/seizure_processing/scripts/"
echo "   scp balance_dataset.py ubuntu@<EC2_IP>:~/seizure_processing/scripts/"
echo ""
echo "2. Start processing in a tmux session:"
echo "   tmux new -s processing"
echo "   cd ~/seizure_processing/scripts"
echo "   ./run_pipeline.sh"
echo ""
echo "3. Monitor progress (in another terminal):"
echo "   ./monitor_processing.sh"
echo ""
echo "4. Download results when complete:"
echo "   scp ubuntu@<EC2_IP>:~/seizure_processing/output/*.tar.gz ./"
echo ""