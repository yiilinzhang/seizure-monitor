#!/bin/bash
# Automated batch processing for all 125 subjects
# Processes 5 at a time, downloads CSV, cleans up, repeats

PEM_FILE=~/Downloads/seizure-ec2-t3.pem
EC2_HOST=ec2-user@54.84.16.6
OUTPUT_DIR=seizure-monitor/ml/processed_data

# Total batches: 125 subjects / 5 per batch = 25 batches
TOTAL_BATCHES=25

for BATCH in $(seq 3 $TOTAL_BATCHES); do
    echo "=================================="
    echo "Processing Batch $BATCH of $TOTAL_BATCHES"
    echo "=================================="

    # Start processing on EC2
    echo "Starting batch $BATCH on EC2..."
    ssh -i $PEM_FILE $EC2_HOST "nohup ./next_batch.sh $BATCH > process_batch${BATCH}.log 2>&1 &"

    # Wait for processing to complete (check every 2 minutes)
    echo "Waiting for batch $BATCH to complete..."
    while true; do
        sleep 120  # Check every 2 minutes

        # Check if processing is done
        DONE=$(ssh -i $PEM_FILE $EC2_HOST "tail -1 process_batch${BATCH}.log 2>/dev/null | grep -c 'complete'")
        if [ "$DONE" -gt 0 ]; then
            echo "Batch $BATCH processing complete!"
            break
        fi

        # Show progress
        ssh -i $PEM_FILE $EC2_HOST "tail -3 process_batch${BATCH}.log 2>/dev/null"
    done

    # Download CSV
    echo "Downloading batch $BATCH CSV..."
    scp -i $PEM_FILE $EC2_HOST:~/processed_batch${BATCH}/combined/all_features.csv \
        $OUTPUT_DIR/batch${BATCH}_all_features.csv

    # Clean up EC2
    echo "Cleaning up batch $BATCH on EC2..."
    ssh -i $PEM_FILE $EC2_HOST "rm -rf ds005873-download/sub-$(printf '%03d' $((($BATCH-1)*5+1)))-* ds005873-download/sub-$(printf '%03d' $((($BATCH-1)*5+2)))-* ds005873-download/sub-$(printf '%03d' $((($BATCH-1)*5+3)))-* ds005873-download/sub-$(printf '%03d' $((($BATCH-1)*5+4)))-* ds005873-download/sub-$(printf '%03d' $((($BATCH-1)*5+5)))-* processed_batch${BATCH}"

    START=$(( ($BATCH - 1) * 5 + 1 ))
    END=$(( $START + 4 ))
    for i in $(seq $START $END); do
        SUB=$(printf "sub-%03d" $i)
        ssh -i $PEM_FILE $EC2_HOST "rm -rf ds005873-download/$SUB processed_batch${BATCH}"
    done

    echo "Batch $BATCH complete and cleaned up!"
    echo ""
done

echo "All 25 batches processed!"
echo "Combining all CSVs..."
python3 seizure-monitor/ml/combine_all_batches.py
