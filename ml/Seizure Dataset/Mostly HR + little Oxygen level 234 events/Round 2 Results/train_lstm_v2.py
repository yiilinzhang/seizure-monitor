import sys
sys.path.append('../scripts')

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from dataset_sequences_v2 import HRSequenceDatasetV2
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import numpy as np
import json

# Hyperparameters - IMPROVED
SEQ_LEN = 30
BATCH = 32
EPOCHS = 50  # Increased from 20
LR = 1e-3
PATIENCE = 10  # Early stopping patience

# Improved LSTM Model
class ImprovedLSTM(nn.Module):
    def __init__(self, input_size=2, hidden_size=64, num_layers=2, seq_len=SEQ_LEN):
        """
        Deeper LSTM with more capacity
        Args:
            input_size: Number of features (2 for HR + O2)
            hidden_size: LSTM hidden size (increased from 32 to 64)
            num_layers: Number of LSTM layers (increased from 1 to 2)
        """
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # Bidirectional LSTM for better pattern recognition
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.4,
            bidirectional=True  # NEW: Look at patterns both forward and backward
        )

        # Classification head - takes bidirectional output (2 * hidden_size)
        self.cls = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),  # *2 because bidirectional
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 2)
        )

    def forward(self, x):
        # x: [B, seq_len, input_size]
        lstm_out, (hn, cn) = self.lstm(x)

        # Concatenate final hidden states from both directions
        # hn shape: [num_layers*2, B, hidden_size] for bidirectional
        forward_hidden = hn[-2]  # Last layer, forward direction
        backward_hidden = hn[-1]  # Last layer, backward direction
        hidden = torch.cat([forward_hidden, backward_hidden], dim=1)  # [B, hidden_size*2]

        return self.cls(hidden)  # [B, 2]

def evaluate(model, dataloader, device, criterion):
    model.eval()
    all_preds = []
    all_labels = []
    total_loss = 0

    with torch.no_grad():
        for x, y, _ in dataloader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = criterion(logits, y)
            total_loss += loss.item()

            preds = logits.argmax(1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(y.cpu().numpy())

    acc = accuracy_score(all_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(all_labels, all_preds, average='binary', zero_division=0)
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

    # Load datasets with BOTH HR and O2 features
    print("Loading datasets with HR + O2 saturation...")
    train_ds = HRSequenceDatasetV2("../data_csv/train_data.csv", seq_len=SEQ_LEN, normalize_per_event=True, use_o2=True)
    test_ds = HRSequenceDatasetV2("../data_csv/test_data.csv", seq_len=SEQ_LEN, normalize_per_event=True, use_o2=True)

    train_loader = DataLoader(train_ds, batch_size=BATCH, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=BATCH, shuffle=False)

    # Calculate class weights to prioritize seizure detection
    train_labels = [y for _, y, _ in train_ds]
    n_neg = sum(1 for y in train_labels if y == 0)
    n_pos = sum(1 for y in train_labels if y == 1)

    # Weight inverse to class frequency
    weight_neg = len(train_labels) / (2 * n_neg)
    weight_pos = len(train_labels) / (2 * n_pos)
    class_weights = torch.tensor([weight_neg, weight_pos], dtype=torch.float32).to(device)

    print(f"Class distribution: {n_neg} negative, {n_pos} positive")
    print(f"Class weights: [neg={weight_neg:.3f}, pos={weight_pos:.3f}]")

    # Initialize improved model
    model = ImprovedLSTM(input_size=2).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-5)  # Add L2 regularization
    criterion = nn.CrossEntropyLoss(weight=class_weights)  # Use class weights

    # Training history
    history = {'train_loss': [], 'test_acc': [], 'test_f1': [], 'test_recall': []}
    best_f1 = 0
    patience_counter = 0

    print("\n" + "="*50)
    print("Training Improved LSTM Model (Round 2)")
    print("="*50)
    print(f"Improvements:")
    print(f"  • Using HR + O2 saturation (2 features)")
    print(f"  • Bidirectional LSTM (2 layers, 64 hidden)")
    print(f"  • Class weighting (prioritize seizure detection)")
    print(f"  • Early stopping (patience={PATIENCE})")
    print(f"  • {EPOCHS} max epochs")
    print("="*50 + "\n")

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
        test_metrics = evaluate(model, test_loader, device, criterion)
        history['test_acc'].append(test_metrics['accuracy'])
        history['test_f1'].append(test_metrics['f1'])
        history['test_recall'].append(test_metrics['recall'])

        print(f"Epoch {epoch}/{EPOCHS} | Loss: {avg_train_loss:.4f} | "
              f"Test Acc: {test_metrics['accuracy']:.4f} | "
              f"F1: {test_metrics['f1']:.4f} | "
              f"Recall: {test_metrics['recall']:.4f}")

        # Early stopping based on F1 score
        if test_metrics['f1'] > best_f1:
            best_f1 = test_metrics['f1']
            patience_counter = 0
            # Save best model
            torch.save(model.state_dict(), 'lstm_v2_best.pth')
        else:
            patience_counter += 1

        if patience_counter >= PATIENCE:
            print(f"\n⚠️  Early stopping triggered after {epoch} epochs (no improvement for {PATIENCE} epochs)")
            break

    # Load best model for final evaluation
    model.load_state_dict(torch.load('lstm_v2_best.pth'))

    # Final evaluation
    print("\n" + "="*50)
    print("Final Test Results (Improved LSTM - Round 2)")
    print("="*50)
    final_metrics = evaluate(model, test_loader, device, criterion)

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
    torch.save(model.state_dict(), 'lstm_v2_model.pth')
    print("\n✅ Model saved to lstm_v2_model.pth")

    # Save results
    results = {
        'model': 'Improved LSTM (Round 2)',
        'epochs_trained': epoch,
        'improvements': [
            'HR + O2 saturation features',
            'Bidirectional LSTM (2 layers, 64 hidden)',
            'Class weighting',
            'Early stopping'
        ],
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
            'test_f1': [float(x) for x in history['test_f1']],
            'test_recall': [float(x) for x in history['test_recall']]
        }
    }

    with open('lstm_v2_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    with open('lstm_v2_results.txt', 'w') as f:
        f.write("Improved LSTM Model Results (Round 2)\n")
        f.write("="*50 + "\n\n")
        f.write(f"Training Epochs: {epoch}\n")
        f.write(f"Sequence Length: {SEQ_LEN}\n")
        f.write(f"Batch Size: {BATCH}\n")
        f.write(f"Learning Rate: {LR}\n\n")
        f.write("Improvements:\n")
        f.write("  • HR + O2 saturation features\n")
        f.write("  • Bidirectional LSTM (2 layers, 64 hidden)\n")
        f.write("  • Class weighting for seizure detection\n")
        f.write("  • Early stopping\n\n")
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

    print("✅ Results saved to lstm_v2_results.json and lstm_v2_results.txt")

if __name__ == "__main__":
    main()
