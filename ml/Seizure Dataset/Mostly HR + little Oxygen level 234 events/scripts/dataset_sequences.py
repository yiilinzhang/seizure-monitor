import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

class HRSequenceDataset(Dataset):
    def __init__(self, csv_path, seq_len=30, normalize_per_event=True):
        """
        Loads long-format CSV (event_id,userId,dataTime,hr,o2Sat,label),
        groups by event_id into sequences of HR values, pads/truncates to seq_len.
        """
        df = pd.read_csv(csv_path)

        # sort within each event by time (string sort works if consistent; for safety parse to datetime)
        if 'dataTime' in df.columns:
            df['dataTime'] = pd.to_datetime(df['dataTime'], errors='coerce', dayfirst=True)
            df = df.sort_values(['event_id', 'dataTime'])

        self.seq_len = seq_len
        self.samples = []  # list of (seq_hr, label, event_id)

        for event_id, group in df.groupby('event_id'):
            hr = group['hr'].astype(float).to_numpy()

            # Optional: per-event normalization (z-score)
            if normalize_per_event and len(hr) > 1:
                m = hr.mean()
                s = hr.std()
                if s > 1e-8:
                    hr = (hr - m) / s
                else:
                    hr = hr - m

            # pad/truncate to fixed length
            if len(hr) >= seq_len:
                seq = hr[:seq_len]
            else:
                pad = np.zeros(seq_len - len(hr), dtype=float)
                seq = np.concatenate([hr, pad], axis=0)

            # label → since this CSV is seizures, label=1 (but read it anyway)
            lbl = int(group['label'].iloc[0]) if 'label' in group.columns else 1

            self.samples.append((seq.astype(np.float32), lbl, int(event_id)))

        # Convert to tensors on-the-fly in __getitem__
        print(f"Loaded {len(self.samples)} events (seq_len={seq_len})")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        seq, lbl, event_id = self.samples[idx]
        x = torch.from_numpy(seq)              # shape [seq_len]
        y = torch.tensor(lbl, dtype=torch.long)
        return x, y, event_id

# Example usage:
if __name__ == "__main__":
    ds = HRSequenceDataset("../data_csv/train_data.csv", seq_len=30)
    dl = DataLoader(ds, batch_size=32, shuffle=True)

    for x, y, event_ids in dl:
        # x: [B, seq_len], y: [B]
        print(x.shape, y.shape)
        break

