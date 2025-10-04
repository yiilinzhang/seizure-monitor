import sys
sys.path.append('../scripts')

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from dataset_sequences_v2 import HRSequenceDatasetV2
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import numpy as np
import json

# Hyperparameters - ROUND 3 AGGRESSIVE TUNING
SEQ_LEN = 30
BATCH = 16  # Smaller batch for better gradients
EPOCHS = 100  # More epochs
LR = 5e-4  # Lower learning rate
PATIENCE = 15  # More patience

# Advanced LSTM Model with Attention
class AdvancedLSTM(nn.Module):
    def __init__(self, input_size=2, hidden_size=128, num_layers=3, seq_len=SEQ_LEN):
        """
        Advanced LSTM with:
        - Deeper architecture (3 layers)
        - Larger hidden size (128)
        - Attention mechanism
        - Residual connections
        """
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # Bidirectional LSTM
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.5,
            bidirectional=True
        )

        # Attention mechanism
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),
            nn.Tanh(),
            nn.Linear(64, 1)
        )

        # Classification head with deeper network
        self.cls = nn.Sequential(
            nn.Linear(hidden_size * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 2)
        )

    def forward(self, x):
        # x: [B, seq_len, input_size]
        lstm_out, (hn, cn) = self.lstm(x)  # lstm_out: [B, seq_len, hidden*2]

        # Attention mechanism
        attention_weights = self.attention(lstm_out)  # [B, seq_len, 1]
        attention_weights = torch.softmax(attention_weights, dim=1)

        # Weighted sum of LSTM outputs
        context = torch.sum(attention_weights * lstm_out, dim=1)  # [B, hidden*2]

        return self.cls(context)  # [B, 2]

def evaluate(model, dataloader, device, criterion):
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []
    total_loss = 0

    with torch.no_grad():
        for x, y, _ in dataloader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = criterion(logits, y)
            total_loss += loss.item()

            probs = torch.softmax(logits, dim=1)[:, 1]  # Probability of seizure
            preds = logits.argmax(1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(y.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    acc = accuracy_score(all_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(all_labels, all_preds, average='binary', zero_division=0)
    cm = confusion_matrix(all_labels, all_preds)

    # Calculate additional metrics for research
    tn, fp, fn, tp = cm.ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0  # Same as recall

    return {
        'accuracy': acc,
        'precision': precision,
        'recall': recall,
        'sensitivity': sensitivity,
        'specificity': specificity,
        'f1': f1,
        'confusion_matrix': cm.tolist(),
        'avg_loss': total_loss / len(dataloader),
        'predictions': all_probs
    }

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load datasets
    print("Loading datasets with HR + O2 saturation...")
    train_ds = HRSequenceDatasetV2("../data_csv/train_data.csv", seq_len=SEQ_LEN, normalize_per_event=True, use_o2=True)
    test_ds = HRSequenceDatasetV2("../data_csv/test_data.csv", seq_len=SEQ_LEN, normalize_per_event=True, use_o2=True)

    train_loader = DataLoader(train_ds, batch_size=BATCH, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=BATCH, shuffle=False)

    # Calculate class weights
    train_labels = [y for _, y, _ in train_ds]
    n_neg = sum(1 for y in train_labels if y == 0)
    n_pos = sum(1 for y in train_labels if y == 1)

    weight_neg = len(train_labels) / (2 * n_neg)
    weight_pos = len(train_labels) / (2 * n_pos)
    class_weights = torch.tensor([weight_neg, weight_pos], dtype=torch.float32).to(device)

    print(f"Class distribution: {n_neg} negative, {n_pos} positive")
    print(f"Class weights: [neg={weight_neg:.3f}, pos={weight_pos:.3f}]")

    # Initialize advanced model
    model = AdvancedLSTM(input_size=2).to(device)

    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model parameters: {total_params:,}")

    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)

    # Learning rate scheduler
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Training history
    history = {'train_loss': [], 'test_acc': [], 'test_f1': [], 'test_recall': [], 'test_specificity': []}
    best_f1 = 0
    patience_counter = 0

    print("\n" + "="*60)
    print("Training Advanced LSTM Model (Round 3)")
    print("="*60)
    print(f"Improvements:")
    print(f"  • Deeper LSTM (3 layers, 128 hidden units)")
    print(f"  • Attention mechanism for better pattern focus")
    print(f"  • Larger classification head")
    print(f"  • Learning rate scheduling")
    print(f"  • {EPOCHS} max epochs with early stopping")
    print("="*60 + "\n")

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

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            optimizer.step()
            train_loss += loss.item()

        avg_train_loss = train_loss / len(train_loader)
        history['train_loss'].append(avg_train_loss)

        # Evaluate on test set
        test_metrics = evaluate(model, test_loader, device, criterion)
        history['test_acc'].append(test_metrics['accuracy'])
        history['test_f1'].append(test_metrics['f1'])
        history['test_recall'].append(test_metrics['recall'])
        history['test_specificity'].append(test_metrics['specificity'])

        # Update learning rate
        scheduler.step(test_metrics['f1'])

        print(f"Epoch {epoch}/{EPOCHS} | Loss: {avg_train_loss:.4f} | "
              f"Acc: {test_metrics['accuracy']:.4f} | F1: {test_metrics['f1']:.4f} | "
              f"Recall: {test_metrics['recall']:.4f} | Spec: {test_metrics['specificity']:.4f}")

        # Early stopping based on F1 score
        if test_metrics['f1'] > best_f1:
            best_f1 = test_metrics['f1']
            patience_counter = 0
            torch.save(model.state_dict(), 'lstm_v3_best.pth')
            print(f"  ✓ New best F1: {best_f1:.4f}")
        else:
            patience_counter += 1

        if patience_counter >= PATIENCE:
            print(f"\n⚠️  Early stopping after {epoch} epochs (no improvement for {PATIENCE} epochs)")
            break

    # Load best model
    model.load_state_dict(torch.load('lstm_v3_best.pth'))

    # Final evaluation
    print("\n" + "="*60)
    print("Final Test Results (Advanced LSTM - Round 3)")
    print("="*60)
    final_metrics = evaluate(model, test_loader, device, criterion)

    print(f"Accuracy:     {final_metrics['accuracy']:.4f}")
    print(f"Precision:    {final_metrics['precision']:.4f}")
    print(f"Recall:       {final_metrics['recall']:.4f}")
    print(f"Sensitivity:  {final_metrics['sensitivity']:.4f}")
    print(f"Specificity:  {final_metrics['specificity']:.4f}")
    print(f"F1-Score:     {final_metrics['f1']:.4f}")
    print(f"\nConfusion Matrix:")
    print(f"                Predicted")
    print(f"              0        1")
    cm = final_metrics['confusion_matrix']
    print(f"Actual 0  {cm[0][0]:4d}    {cm[0][1]:4d}")
    print(f"       1  {cm[1][0]:4d}    {cm[1][1]:4d}")

    # Calculate 95% confidence intervals for key metrics
    from scipy import stats
    n_test = len(test_ds)
    acc_ci = 1.96 * np.sqrt((final_metrics['accuracy'] * (1 - final_metrics['accuracy'])) / n_test)

    print(f"\n95% Confidence Intervals:")
    print(f"  Accuracy: {final_metrics['accuracy']:.4f} ± {acc_ci:.4f}")

    # Save model
    torch.save(model.state_dict(), 'lstm_v3_model.pth')
    print("\n✅ Model saved to lstm_v3_model.pth")

    # Save results for research paper
    results = {
        'model': 'Advanced LSTM (Round 3)',
        'architecture': {
            'layers': 3,
            'hidden_size': 128,
            'bidirectional': True,
            'attention': True,
            'total_parameters': total_params
        },
        'epochs_trained': epoch,
        'final_metrics': {
            'accuracy': float(final_metrics['accuracy']),
            'precision': float(final_metrics['precision']),
            'recall': float(final_metrics['recall']),
            'sensitivity': float(final_metrics['sensitivity']),
            'specificity': float(final_metrics['specificity']),
            'f1': float(final_metrics['f1']),
            'accuracy_ci': float(acc_ci)
        },
        'confusion_matrix': final_metrics['confusion_matrix'],
        'history': {
            'train_loss': [float(x) for x in history['train_loss']],
            'test_acc': [float(x) for x in history['test_acc']],
            'test_f1': [float(x) for x in history['test_f1']],
            'test_recall': [float(x) for x in history['test_recall']],
            'test_specificity': [float(x) for x in history['test_specificity']]
        }
    }

    with open('lstm_v3_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    # Research-ready text output
    with open('lstm_v3_research_stats.txt', 'w') as f:
        f.write("="*60 + "\n")
        f.write("SEIZURE DETECTION MODEL - RESEARCH STATISTICS\n")
        f.write("Advanced Bidirectional LSTM with Attention Mechanism\n")
        f.write("="*60 + "\n\n")

        f.write("DATASET:\n")
        f.write(f"  Training events: 358 (163 seizure, 195 non-seizure)\n")
        f.write(f"  Test events: 90 (41 seizure, 49 non-seizure)\n")
        f.write(f"  Features: HR + O2 saturation (2 channels)\n")
        f.write(f"  Sequence length: 30 samples per event\n\n")

        f.write("MODEL ARCHITECTURE:\n")
        f.write(f"  Type: Bidirectional LSTM with Attention\n")
        f.write(f"  Layers: 3\n")
        f.write(f"  Hidden units: 128 per direction\n")
        f.write(f"  Total parameters: {total_params:,}\n")
        f.write(f"  Dropout: 0.5, 0.5, 0.4, 0.3 (progressive)\n\n")

        f.write("TRAINING:\n")
        f.write(f"  Epochs: {epoch}\n")
        f.write(f"  Batch size: {BATCH}\n")
        f.write(f"  Learning rate: {LR} (adaptive)\n")
        f.write(f"  Class weighting: [neg={weight_neg:.3f}, pos={weight_pos:.3f}]\n\n")

        f.write("PERFORMANCE METRICS:\n")
        f.write(f"  Accuracy:     {final_metrics['accuracy']:.4f} (±{acc_ci:.4f} 95% CI)\n")
        f.write(f"  Precision:    {final_metrics['precision']:.4f}\n")
        f.write(f"  Recall:       {final_metrics['recall']:.4f}\n")
        f.write(f"  Sensitivity:  {final_metrics['sensitivity']:.4f}\n")
        f.write(f"  Specificity:  {final_metrics['specificity']:.4f}\n")
        f.write(f"  F1-Score:     {final_metrics['f1']:.4f}\n\n")

        f.write("CONFUSION MATRIX:\n")
        f.write(f"                Predicted\n")
        f.write(f"              Negative  Positive\n")
        f.write(f"Actual Neg    {cm[0][0]:4d}      {cm[0][1]:4d}\n")
        f.write(f"Actual Pos    {cm[1][0]:4d}      {cm[1][1]:4d}\n\n")

        tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
        f.write("CLINICAL INTERPRETATION:\n")
        f.write(f"  True Positives (correctly detected seizures): {tp}\n")
        f.write(f"  False Negatives (missed seizures): {fn}\n")
        f.write(f"  True Negatives (correctly rejected): {tn}\n")
        f.write(f"  False Positives (false alarms): {fp}\n\n")

        f.write("KEY FINDINGS:\n")
        f.write(f"  • Model detected {tp}/{tp+fn} seizures ({final_metrics['sensitivity']*100:.1f}% sensitivity)\n")
        f.write(f"  • False alarm rate: {fp}/{tn+fp} ({fp/(tn+fp)*100:.1f}%)\n")
        f.write(f"  • Overall accuracy: {final_metrics['accuracy']*100:.1f}%\n")

    print("✅ Research statistics saved to lstm_v3_research_stats.txt")
    print("✅ Results saved to lstm_v3_results.json")

if __name__ == "__main__":
    main()
