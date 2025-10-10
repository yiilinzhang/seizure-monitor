"""
AWS EC2 Setup for Direct S3 Access to OpenNeuro
This runs on an EC2 instance with high bandwidth to S3
"""

import boto3
import pyedflib
import torch
import numpy as np
from io import BytesIO

# No credentials needed for public OpenNeuro bucket
s3 = boto3.client('s3', config=boto3.session.Config(signature_version='UNSIGNED'))

def stream_edf_from_s3(bucket='openneuro.org', key_prefix='ds005873'):
    """Stream EDF files directly from S3 without downloading"""

    # List all EDF files
    response = s3.list_objects_v2(
        Bucket=bucket,
        Prefix=key_prefix,
        MaxKeys=1000
    )

    edf_files = [obj['Key'] for obj in response.get('Contents', [])
                 if obj['Key'].endswith('.edf')]

    print(f"Found {len(edf_files)} EDF files in S3")

    for edf_key in edf_files[:10]:  # Process first 10
        print(f"\nStreaming: {edf_key}")

        # Stream the file into memory
        obj = s3.get_object(Bucket=bucket, Key=edf_key)
        edf_bytes = obj['Body'].read()

        # Save temporarily to process with pyedflib
        temp_file = '/tmp/temp.edf'
        with open(temp_file, 'wb') as f:
            f.write(edf_bytes)

        # Process the EDF file
        with pyedflib.EdfReader(temp_file) as edf:
            n_channels = edf.signals_in_file

            # Extract ECG and EMG channels
            for i in range(n_channels):
                label = edf.getSignalLabel(i)
                if 'ECG' in label or 'EMG' in label:
                    signal = edf.readSignal(i)
                    print(f"  - {label}: {len(signal)} samples")

                    # Process signal here...
                    yield signal, label

# Example usage on EC2
if __name__ == "__main__":
    print("Running on AWS EC2 with direct S3 access")
    print("No download needed - streaming from S3!")

    signals = []
    for signal, label in stream_edf_from_s3():
        signals.append(signal)
        if len(signals) >= 100:  # Process in batches
            # Train your model here
            break