import numpy as np, torch, torch.nn as nn
from torch.utils.data import DataLoader, Subset
from dataset_sequences import HRSequenceDataset

CSV = "osdb_combined_long.csv"   # made in step 2
SEQ_LEN = 30
BATCH = 32
EPOCHS = 10
LR = 1e-3

# dataset (groups by event_id, pads to SEQ_LEN)
ds = HRSequenceDataset(CSV, seq_len=SEQ_LEN, normalize_per_event=True)

# we need labels 0 and 1 present
labels = [y for _, y, _ in ds]
n_pos = sum(int(l==1) for l in labels)
n_neg = sum(int(l==0) for l in labels)
print(f"Events: total={len(ds)}  pos={n_pos}  neg={n_neg}")
assert n_pos>0 and n_neg>0, "Need both seizure(1) and false(0) events!"

# split by event (indices)
np.random.seed(42)
idx = np.arange(len(ds))
np.random.shuffle(idx)
split = int(0.8 * len(idx))
train_idx, test_idx = idx[:split], idx[split:]

train_dl = DataLoader(Subset(ds, train_idx), batch_size=BATCH, shuffle=True)
test_dl  = DataLoader(Subset(ds, test_idx),  batch_size=BATCH, shuffle=False)

# tiny 1D-CNN
class Tiny1DCNN(nn.Module):
    def __init__(self, seq_len=SEQ_LEN):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(1,16,3,padding=1), nn.ReLU(),
            nn.Conv1d(16,32,3,padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.cls = nn.Linear(32, 2)
    def forward(self, x):
        x = x.unsqueeze(1)           # [B,1,T]
        h = self.net(x).squeeze(-1)  # [B,32]
        return self.cls(h)

device = "cpu"
model = Tiny1DCNN().to(device)
opt = torch.optim.Adam(model.parameters(), lr=LR)
crit = nn.CrossEntropyLoss()

def eval_loop():
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for x,y,_ in test_dl:
            x,y = x.to(device), y.to(device)
            logits = model(x)
            pred = logits.argmax(1)
            correct += (pred==y).sum().item()
            total   += y.numel()
    acc = correct/total if total else 0
    print(f"Test accuracy: {acc:.3f}")
    model.train()
    return acc

for epoch in range(1, EPOCHS+1):
    for x,y,_ in train_dl:
        x,y = x.to(device), y.to(device)
        logits = model(x)
        loss = crit(logits, y)
        loss.backward(); opt.step(); opt.zero_grad()
    print(f"Epoch {epoch}: last_batch_loss={loss.item():.4f}")
    eval_loop()
