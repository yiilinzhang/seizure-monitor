import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from dataset_sequences import HRSequenceDataset

class Tiny1DCNN(nn.Module):
    def __init__(self, seq_len=30):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(1, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.cls = nn.Linear(32, 2)

    def forward(self, x):
        x = x.unsqueeze(1)          # [B, 1, seq_len]
        h = self.net(x).squeeze(-1) # [B, 32]
        return self.cls(h)

if __name__ == "__main__":
    ds = HRSequenceDataset("osdb_seizures_long.csv", seq_len=30)
    dl = DataLoader(ds, batch_size=32, shuffle=True)

    model = Tiny1DCNN(seq_len=30)
    crit  = nn.CrossEntropyLoss()
    opt   = torch.optim.Adam(model.parameters(), lr=1e-3)

    for x, y, _ in dl:
        logits = model(x)
        loss = crit(logits, y)
        loss.backward()
        opt.step(); opt.zero_grad()
        print("batch loss:", float(loss))
        break
    torch.save(model.state_dict(), "seizure_hr_model.pth")