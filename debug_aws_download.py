"""
DEBUG: Figure out why AWS S3 download is failing
Run this in Kaggle/Colab to diagnose the issue
"""

import subprocess
import os
import sys
import platform

print("=" * 60)
print("AWS S3 DOWNLOAD DEBUGGER")
print("=" * 60)

# 1. Check environment
print("\n1️⃣ ENVIRONMENT CHECK:")
print(f"Platform: {platform.platform()}")
print(f"Python: {sys.version}")
print(f"Working dir: {os.getcwd()}")
print(f"Available space: ", end="")
try:
    import shutil
    stat = shutil.disk_usage(".")
    print(f"{stat.free / (1024**3):.1f} GB free")
except:
    print("Could not determine")

# 2. Check if AWS CLI is installed
print("\n2️⃣ AWS CLI CHECK:")
aws_check = subprocess.run("which aws", shell=True, capture_output=True, text=True)
if aws_check.returncode == 0:
    print(f"✅ AWS CLI found at: {aws_check.stdout.strip()}")

    # Check version
    version = subprocess.run("aws --version", shell=True, capture_output=True, text=True)
    print(f"Version: {version.stdout or version.stderr}")
else:
    print("❌ AWS CLI not found - installing...")
    install = subprocess.run("pip install awscli", shell=True, capture_output=True, text=True)
    print(install.stdout[:200] if install.returncode == 0 else install.stderr[:200])

# 3. Test basic S3 access
print("\n3️⃣ S3 ACCESS TEST:")
test_commands = [
    # Test listing without downloading
    ("List bucket", "aws s3 ls --no-sign-request s3://openneuro.org/ --max-items 5"),

    # Test listing the specific dataset
    ("List dataset", "aws s3 ls --no-sign-request s3://openneuro.org/ds005873/ --max-items 5"),

    # Test downloading a tiny file
    ("Download small file", "aws s3 cp --no-sign-request s3://openneuro.org/ds005873/dataset_description.json ./test.json"),
]

for desc, cmd in test_commands:
    print(f"\n{desc}:")
    print(f"  Command: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)

    if result.returncode == 0:
        print(f"  ✅ Success!")
        if result.stdout:
            print(f"  Output: {result.stdout[:200]}")
    else:
        print(f"  ❌ Failed!")
        print(f"  Error: {result.stderr[:200]}")

# 4. Alternative methods
print("\n4️⃣ ALTERNATIVE DOWNLOAD METHODS:")

# Method A: Using boto3
print("\n📦 Method A: boto3 (Python library)")
try:
    import boto3
    from botocore import UNSIGNED
    from botocore.config import Config

    s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

    # List objects
    response = s3.list_objects_v2(
        Bucket='openneuro.org',
        Prefix='ds005873/',
        MaxKeys=3
    )

    print("✅ boto3 works! Found files:")
    for obj in response.get('Contents', []):
        print(f"  - {obj['Key']} ({obj['Size']/1024:.1f} KB)")

    # Try downloading one
    s3.download_file('openneuro.org', 'ds005873/dataset_description.json', 'test_boto3.json')
    print("  ✅ Downloaded test file via boto3")

except Exception as e:
    print(f"❌ boto3 failed: {e}")

# Method B: Using requests (HTTP)
print("\n🌐 Method B: Direct HTTP download")
try:
    import requests

    # OpenNeuro also serves via HTTP
    urls = [
        "https://s3.amazonaws.com/openneuro.org/ds005873/dataset_description.json",
        "https://openneuro.org/crn/datasets/ds005873/files/dataset_description.json",
        "https://github.com/OpenNeuroDatasets/ds005873/raw/main/dataset_description.json"
    ]

    for url in urls:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ HTTP works via: {url[:50]}...")
                print(f"  Got {len(response.content)} bytes")
                with open('test_http.json', 'wb') as f:
                    f.write(response.content)
                break
        except:
            print(f"❌ Failed: {url[:50]}...")

except Exception as e:
    print(f"❌ requests failed: {e}")

# Method C: Using urllib (built-in)
print("\n🔗 Method C: urllib (no packages needed)")
try:
    import urllib.request

    url = "https://s3.amazonaws.com/openneuro.org/ds005873/participants.tsv"
    urllib.request.urlretrieve(url, "test_urllib.tsv")
    print(f"✅ urllib works! Downloaded participants.tsv")

    # Read first line
    with open("test_urllib.tsv") as f:
        first_line = f.readline()
        print(f"  First line: {first_line[:100]}")

except Exception as e:
    print(f"❌ urllib failed: {e}")

# 5. Check what files we managed to get
print("\n5️⃣ FILES DOWNLOADED:")
test_files = ['test.json', 'test_boto3.json', 'test_http.json', 'test_urllib.tsv']
found_any = False

for file in test_files:
    if os.path.exists(file):
        size = os.path.getsize(file)
        print(f"✅ {file}: {size} bytes")
        found_any = True

        # Show content preview
        with open(file, 'r') as f:
            content = f.read(200)
            print(f"   Preview: {content[:100]}...")

if not found_any:
    print("❌ No files were successfully downloaded")

# 6. Recommendation
print("\n6️⃣ RECOMMENDATION:")
if found_any:
    print("✅ At least one method worked! You can download the data.")
    print("\nBest method based on what worked:")
    if os.path.exists('test.json'):
        print("  → Use AWS CLI (already working)")
    elif os.path.exists('test_boto3.json'):
        print("  → Use boto3 in Python")
    elif os.path.exists('test_http.json'):
        print("  → Use requests library")
    elif os.path.exists('test_urllib.tsv'):
        print("  → Use urllib (built-in)")
else:
    print("❌ No download methods worked. Possible issues:")
    print("  1. Network restrictions (firewall/proxy)")
    print("  2. No internet connection")
    print("  3. S3 bucket permissions changed")
    print("\nTry:")
    print("  1. Use Google Colab instead")
    print("  2. Download locally and upload")
    print("  3. Use synthetic data for testing")

print("\n" + "=" * 60)
print("DEBUG COMPLETE")
print("=" * 60)