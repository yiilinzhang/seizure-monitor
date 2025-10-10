#!/bin/bash
# DataLad setup for local selective download

echo "==================================="
echo "DataLad Setup for SeizeIT2 Dataset"
echo "==================================="

# Install DataLad (if not installed)
pip install datalad

# Clone the dataset structure (metadata only, no data files)
datalad clone https://github.com/OpenNeuroDatasets/ds005873 seizeit2_dataset
cd seizeit2_dataset

echo "Dataset structure cloned (metadata only)"
echo "Now selectively downloading specific subjects..."

# Download only specific subjects' EDF files
# This gives you full control over what to download
for i in {1..5}; do
    subject=$(printf "sub-%03d" $i)
    echo "Downloading $subject EDF files..."

    # Get only the EDF files for this subject
    datalad get $subject/eeg/*edf

    # Check disk usage
    du -sh .
done

echo "✅ Selected EDF files downloaded locally"
echo "Now you can:"
echo "1. Process them locally to extract features"
echo "2. Upload processed features to cloud for training"
echo "3. Or upload raw EDF files to cloud storage"