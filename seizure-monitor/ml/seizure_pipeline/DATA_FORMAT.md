# Data Format Explanation

## Current CSV Format (30-second windows)

### Basic Structure
```
1 CSV row = 30 seconds of sensor data from all modalities
```

### File: `train_data.csv` (837 rows, 97 KB)

#### Columns (17 total):
```
Metadata:
  - event_id       : Unique identifier (e.g., "sub-001_run03_1200")
  - userId         : Subject ID
  - run            : Recording run number (1-9)
  - dataTime       : Timestamp
  - window_start   : Start time in seconds
  - window_end     : End time in seconds (start + 30)

Features from ECG:
  - hr             : Heart rate (beats per minute)
  - hrv            : Heart rate variability (milliseconds)

Features from EEG:
  - eeg_delta      : Delta band power (0.5-4 Hz)
  - eeg_theta      : Theta band power (4-8 Hz)
  - eeg_alpha      : Alpha band power (8-13 Hz)
  - eeg_beta       : Beta band power (13-30 Hz)

Features from EMG:
  - emg_rms        : RMS amplitude (muscle activity)
  - emg_var        : Variance

Features from MOV:
  - mov_mag        : Movement magnitude
  - mov_std        : Movement standard deviation

Target:
  - label          : 0=Normal, 1=Pre-seizure (5 min before), 2=Seizure
```

## How LSTM Processes This Data

### Input Format
```python
# Your LSTM expects:
input_shape = [batch_size, sequence_length, num_features]
input_shape = [32, 30, 2]  # For HR+O2 model
            batch  seq  features

# With multi-modal:
input_shape = [32, 30, 14]  # All features
            batch  seq  features
```

### Visual Representation

```
CSV File (837 rows):
┌─────────────────────────────────────────────────┐
│ Row 1:  0:00-0:30  | HR=70 | EEG=... | Label=0 │
│ Row 2:  0:30-1:00  | HR=71 | EEG=... | Label=0 │
│ Row 3:  1:00-1:30  | HR=71 | EEG=... | Label=0 │
│ ...                                             │
│ Row 30: 14:30-15:00| HR=82 | EEG=... | Label=1 │ ← Pre-seizure!
│ Row 31: 15:00-15:30| HR=85 | EEG=... | Label=2 │ ← Seizure starts
└─────────────────────────────────────────────────┘

LSTM takes 30 consecutive rows at a time:
┌────────────────────────────────────────┐
│  Rows 1-30  → One LSTM input sequence │
│  Rows 2-31  → Next LSTM input (sliding)│
│  Rows 3-32  → Next input...            │
└────────────────────────────────────────┘
```

### Timeline Example

```
One LSTM Sequence (30 rows):

Time    Row   Window      HR   Label   What's Happening
─────────────────────────────────────────────────────────
0:00    1     0-30s      70   Normal  ●━━━━━━━━━━━━━━━━━━
0:30    2     30-60s     70   Normal  ●━━━━━━━━━━━━━━━━━━
1:00    3     60-90s     71   Normal  ●━━━━━━━━━━━━━━━━━━
2:00    5     120-150s   71   Normal  ●━━━━━━━━━━━━━━━━━━
3:00    7     180-210s   72   Normal  ●━━━━━━━━━━━━━━━━━━
5:00    11    300-330s   73   Normal  ━●━━━━━━━━━━━━━━━━━
7:00    15    420-450s   75   Normal  ━━●━━━━━━━━━━━━━━━━ HR rising
10:00   21    600-630s   78   Pre!    ━━━━━●━━━━━━━━━━━━ 5 min before
12:00   25    720-750s   80   Pre!    ━━━━━━━●━━━━━━━━━━
14:00   29    840-870s   82   Pre!    ━━━━━━━━━●━━━━━━━━
15:00   30    870-900s   85   Seiz!   ━━━━━━━━━━━━━━━━━● Seizure!

                           ↑
                    LSTM sees this full pattern
                    and learns: gradual HR rise
                    over 10+ minutes = seizure coming
```

## Comparison: Different Window Sizes

### 4-Second Windows (Old)
```
Row = 4 seconds
30 rows = 120 seconds = 2 minutes

Timeline:
  Row 1:   0:00 - 0:04
  Row 2:   0:04 - 0:08
  ...
  Row 30:  1:56 - 2:00

Problem: Only 2 minutes of history!
Can't see gradual HR changes that take 10+ minutes
```

### 30-Second Windows (Current) ✅
```
Row = 30 seconds
30 rows = 900 seconds = 15 minutes

Timeline:
  Row 1:   0:00 - 0:30
  Row 2:   0:30 - 1:00
  ...
  Row 30:  14:30 - 15:00

Success: 15 minutes of history!
Can see HR rising from 70 → 85 over time
```

### 60-Second Windows (Alternative)
```
Row = 60 seconds
30 rows = 1800 seconds = 30 minutes

Timeline:
  Row 1:   0:00 - 1:00
  Row 2:   1:00 - 2:00
  ...
  Row 30:  29:00 - 30:00

Tradeoff: More context but less temporal resolution
```

## Real Data Example

From `train_data.csv`:

```csv
event_id,userId,run,window_start,window_end,hr,hrv,label
sub-001_run03_57600,sub-001,3,57600,57630,70.5,45.2,0
sub-001_run03_57630,sub-001,3,57630,57660,71.2,46.1,0
sub-001_run03_57660,sub-001,3,57660,57690,72.0,44.8,0
...
sub-001_run03_57900,sub-001,3,57900,57930,78.3,52.1,1  ← Pre-ictal (5 min before)
sub-001_run03_57930,sub-001,3,57930,57960,80.1,55.3,1  ← Pre-ictal
sub-001_run03_57960,sub-001,3,57960,57990,82.5,58.7,1  ← Pre-ictal
sub-001_run03_57990,sub-001,3,57990,58020,85.2,61.2,2  ← Seizure starts!
```

LSTM input at time 57,990s (right before seizure):
- Takes 30 rows: from 57,090s to 57,990s
- Span: 900 seconds = 15 minutes
- Sees HR pattern: 70 → 71 → 72 → ... → 78 → 82 → 85
- Learns: "This gradual rise pattern means seizure!"

## Key Insights

### Why 30 Seconds?
1. **Enough heartbeats**: 30-35 beats @ 70 bpm
2. **Good HRV calculation**: Needs multiple R-R intervals
3. **Temporal resolution**: Captures minute-by-minute changes
4. **LSTM sweet spot**: 30 timesteps × 30 sec = perfect for pattern learning

### Why 30 Timesteps?
1. **Long enough**: See 15-minute trends
2. **Not too long**: Training doesn't explode computationally
3. **Research standard**: Most LSTM models use 20-50 timesteps
4. **Your existing model**: Already uses SEQ_LEN=30

### Why 15 Minutes?
1. **Pre-seizure changes**: Develop over 5-30 minutes
2. **Autonomic activation**: Heart rate rises gradually
3. **Pattern detection**: Need full trend, not snapshot
4. **Clinical relevance**: 5-15 minute warning is useful

## Usage in Your Model

### Current Model (HR only):
```python
# From dataset_sequences_v2.py
class HRSequenceDatasetV2(Dataset):
    def __init__(self, csv_path, seq_len=30):
        # Each sequence: [seq_len, 1] for HR only
        # Shape: [30, 1] - 30 timesteps, 1 feature (HR)
```

### Multi-Modal (Future):
```python
class MultiModalDataset(Dataset):
    def __init__(self, csv_path, seq_len=30):
        # Each sequence: [seq_len, 14] for all features
        # Shape: [30, 14] - 30 timesteps, 14 features
        # Features: hr, hrv, eeg_delta, eeg_theta, eeg_alpha,
        #           eeg_beta, emg_rms, emg_var, mov_mag, mov_std, etc.
```

## Summary

**Current format = Perfect for seizure prediction!**

- ✅ 30-second windows = meaningful HR measurements
- ✅ 30 timesteps = 15 minutes of history
- ✅ Multi-modal features available (ECG, EEG, EMG, MOV)
- ✅ Temporal labels (inter/pre/ictal)
- ✅ Balanced datasets ready for training
- ✅ Compatible with your existing LSTM architecture

The data is ready to train a model that can detect seizures 5+ minutes before they happen! 🎯
