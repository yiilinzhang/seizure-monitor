import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

class HRSequenceDatasetV2(Dataset):
    def __init__(self, csv_path, seq_len=30, normalize_per_event=True, use_o2=True):
        """
        Loads long-format CSV (event_id,userId,dataTime,hr,o2Sat,label),
        groups by event_id into sequences, pads/truncates to seq_len.

        Args:
            csv_path: Path to CSV file
            seq_len: Fixed sequence length
            normalize_per_event: Apply z-score normalization per event
            use_o2: Include O2 saturation as second feature (default True)
        """
        df = pd.read_csv(csv_path)

        # Sort within each event by time
        if 'dataTime' in df.columns:
            df['dataTime'] = pd.to_datetime(df['dataTime'], errors='coerce')
            df = df.sort_values(['event_id', 'dataTime'])

        self.seq_len = seq_len
        self.use_o2 = use_o2
        self.samples = []  # list of (seq_features, label, event_id)

        for event_id, group in df.groupby('event_id'):
            hr = group['hr'].astype(float).to_numpy()
            o2 = group['o2Sat'].astype(float).to_numpy() if use_o2 else None

            # Per-event normalization
            if normalize_per_event and len(hr) > 1:
                # Normalize HR
                m_hr = hr.mean()
                s_hr = hr.std()
                if s_hr > 1e-8:
                    hr = (hr - m_hr) / s_hr
                else:
                    hr = hr - m_hr

                # Normalize O2 if using it
                if use_o2 and o2 is not None:
                    m_o2 = o2.mean()
                    s_o2 = o2.std()
                    if s_o2 > 1e-8:
                        o2 = (o2 - m_o2) / s_o2
                    else:
                        o2 = o2 - m_o2

            # Pad/truncate to fixed length
            if len(hr) >= seq_len:
                hr_seq = hr[:seq_len]
                o2_seq = o2[:seq_len] if use_o2 and o2 is not None else None
            else:
                pad_len = seq_len - len(hr)
                hr_seq = np.concatenate([hr, np.zeros(pad_len, dtype=float)], axis=0)
                if use_o2 and o2 is not None:
                    o2_seq = np.concatenate([o2, np.zeros(pad_len, dtype=float)], axis=0)
                else:
                    o2_seq = None

            # Stack features: [seq_len, num_features]
            if use_o2 and o2_seq is not None:
                features = np.stack([hr_seq, o2_seq], axis=1).astype(np.float32)  # [seq_len, 2]
            else:
                features = hr_seq.reshape(-1, 1).astype(np.float32)  # [seq_len, 1]

            # Get label
            lbl = int(group['label'].iloc[0]) if 'label' in group.columns else 1

            self.samples.append((features, lbl, int(event_id)))

        num_features = 2 if use_o2 else 1
        print(f"Loaded {len(self.samples)} events (seq_len={seq_len}, features={num_features})")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        features, lbl, event_id = self.samples[idx]
        x = torch.from_numpy(features)  # shape [seq_len, num_features]
        y = torch.tensor(lbl, dtype=torch.long)
        return x, y, event_id

# Example usage:
if __name__ == "__main__":
    ds = HRSequenceDatasetV2("../data_csv/train_data.csv", seq_len=30, use_o2=True)
    dl = DataLoader(ds, batch_size=32, shuffle=True)

    for x, y, event_ids in dl:
        # x: [B, seq_len, num_features], y: [B]
        print(x.shape, y.shape)
        break
