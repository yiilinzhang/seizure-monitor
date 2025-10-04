import sys
sys.path.append('../scripts')

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from dataset_sequences import HRSequenceDataset
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import numpy as np
import json

# Hyperparameters
SEQ_LEN = 30
BATCH = 32
EPOCHS = 20
LR = 1e-3

# 1D-CNN Model
class CNN1D(nn.Module):
    def __init__(self, seq_len=SEQ_LEN):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(1, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(32, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.cls = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(16, 2)
        )

    def forward(self, x):
        # x: [B, seq_len]
        x = x.unsqueeze(1)           # [B, 1, seq_len]
        h = self.net(x).squeeze(-1)  # [B, 32]
        return self.cls(h)           # [B, 2]

def evaluate(model, dataloader, device):
    model.eval()
    all_preds = []
    all_labels = []
    total_loss = 0

    with torch.no_grad():
        for x, y, _ in dataloader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = nn.CrossEntropyLoss()(logits, y)
            total_loss += loss.item()

            preds = logits.argmax(1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(y.cpu().numpy())

    acc = accuracy_score(all_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(all_labels, all_preds, average='binary')
    cm = confusion_matrix(all_labels, all_preds)

    return {
        'accuracy': acc,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'confusion_matrix': cm.tolist(),
        'avg_loss': total_loss / len(dataloader)
    }

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load datasets
    print("Loading datasets...")
    train_ds = HRSequenceDataset("../data_csv/train_data.csv", seq_len=SEQ_LEN, normalize_per_event=True)
    test_ds = HRSequenceDataset("../data_csv/test_data.csv", seq_len=SEQ_LEN, normalize_per_event=True)

    train_loader = DataLoader(train_ds, batch_size=BATCH, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=BATCH, shuffle=False)

    # Initialize model
    model = CNN1D().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()

    # Training history
    history = {'train_loss': [], 'test_acc': [], 'test_f1': []}

    print("\n" + "="*50)
    print("Training 1D-CNN Model")
    print("="*50)

    # Training loop
    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0

        for x, y, _ in train_loader:
            x, y = x.to(device), y.to(device)

            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        avg_train_loss = train_loss / len(train_loader)
        history['train_loss'].append(avg_train_loss)

        # Evaluate on test set
        test_metrics = evaluate(model, test_loader, device)
        history['test_acc'].append(test_metrics['accuracy'])
        history['test_f1'].append(test_metrics['f1'])

        print(f"Epoch {epoch}/{EPOCHS} | Loss: {avg_train_loss:.4f} | "
              f"Test Acc: {test_metrics['accuracy']:.4f} | F1: {test_metrics['f1']:.4f}")

    # Final evaluation
    print("\n" + "="*50)
    print("Final Test Results (1D-CNN)")
    print("="*50)
    final_metrics = evaluate(model, test_loader, device)

    print(f"Accuracy:  {final_metrics['accuracy']:.4f}")
    print(f"Precision: {final_metrics['precision']:.4f}")
    print(f"Recall:    {final_metrics['recall']:.4f}")
    print(f"F1-Score:  {final_metrics['f1']:.4f}")
    print(f"\nConfusion Matrix:")
    print(f"                Predicted")
    print(f"              0        1")
    cm = final_metrics['confusion_matrix']
    print(f"Actual 0  {cm[0][0]:4d}    {cm[0][1]:4d}")
    print(f"       1  {cm[1][0]:4d}    {cm[1][1]:4d}")

    # Save model
    torch.save(model.state_dict(), 'cnn_model.pth')
    print("\n✅ Model saved to cnn_model.pth")

    # Save results
    results = {
        'model': '1D-CNN',
        'epochs': EPOCHS,
        'final_metrics': {
            'accuracy': float(final_metrics['accuracy']),
            'precision': float(final_metrics['precision']),
            'recall': float(final_metrics['recall']),
            'f1': float(final_metrics['f1'])
        },
        'confusion_matrix': final_metrics['confusion_matrix'],
        'history': {
            'train_loss': [float(x) for x in history['train_loss']],
            'test_acc': [float(x) for x in history['test_acc']],
            'test_f1': [float(x) for x in history['test_f1']]
        }
    }

    with open('cnn_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    with open('cnn_results.txt', 'w') as f:
        f.write("1D-CNN Model Results\n")
        f.write("="*50 + "\n\n")
        f.write(f"Training Epochs: {EPOCHS}\n")
        f.write(f"Sequence Length: {SEQ_LEN}\n")
        f.write(f"Batch Size: {BATCH}\n")
        f.write(f"Learning Rate: {LR}\n\n")
        f.write("Final Test Metrics:\n")
        f.write(f"  Accuracy:  {final_metrics['accuracy']:.4f}\n")
        f.write(f"  Precision: {final_metrics['precision']:.4f}\n")
        f.write(f"  Recall:    {final_metrics['recall']:.4f}\n")
        f.write(f"  F1-Score:  {final_metrics['f1']:.4f}\n\n")
        f.write("Confusion Matrix:\n")
        f.write(f"                Predicted\n")
        f.write(f"              0        1\n")
        f.write(f"Actual 0  {cm[0][0]:4d}    {cm[0][1]:4d}\n")
        f.write(f"       1  {cm[1][0]:4d}    {cm[1][1]:4d}\n")

    print("✅ Results saved to cnn_results.json and cnn_results.txt")

if __name__ == "__main__":
    main()
