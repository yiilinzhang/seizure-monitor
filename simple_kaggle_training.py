"""
Simple ECG/EMG Training - Works on Kaggle WITHOUT internet
No external packages needed - uses only pre-installed libraries
Copy this entire code into a Kaggle notebook cell
"""

import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

print("=" * 50)
print("ECG/EMG Model Training - No Internet Required")
print("=" * 50)

# Check for GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
if torch.cuda.is_available():
    print(f'✅ GPU: {torch.cuda.get_device_name(0)}')
else:
    print('⚠️ No GPU - Enable in Settings → Accelerator → GPU P100')
    print('   Training will continue on CPU (slower)')

# ============ GENERATE DATA ============
print("\nGenerating synthetic ECG/EMG data...")

np.random.seed(42)
n_samples = 2000

# Create realistic features without complex processing
features = []
labels = []

for i in range(n_samples):
    # Randomly assign class
    label = np.random.choice([0, 1], p=[0.6, 0.4])

    if label == 0:  # Normal
        # ECG-like features
        mean_hr = np.random.normal(70, 5)
        std_hr = np.random.normal(5, 1)
        min_hr = mean_hr - np.random.uniform(5, 10)
        max_hr = mean_hr + np.random.uniform(10, 15)
        rmssd = np.random.normal(40, 10)
        pnn50 = np.random.normal(20, 5)

        # EMG-like features
        emg_mean = np.random.normal(0.3, 0.05)
        emg_std = np.random.normal(0.1, 0.02)
        emg_max = emg_mean * np.random.uniform(2, 3)
        emg_rms = np.random.normal(0.25, 0.05)

    else:  # Abnormal
        # ECG-like features (elevated)
        mean_hr = np.random.normal(90, 10)
        std_hr = np.random.normal(10, 2)
        min_hr = mean_hr - np.random.uniform(15, 20)
        max_hr = mean_hr + np.random.uniform(20, 30)
        rmssd = np.random.normal(25, 8)
        pnn50 = np.random.normal(10, 3)

        # EMG-like features (elevated)
        emg_mean = np.random.normal(0.5, 0.1)
        emg_std = np.random.normal(0.15, 0.03)
        emg_max = emg_mean * np.random.uniform(3, 4)
        emg_rms = np.random.normal(0.4, 0.08)

    # Add noise and correlations
    features.append([
        mean_hr,
        std_hr,
        min_hr,
        max_hr,
        rmssd,
        pnn50,
        emg_mean,
        emg_std,
        emg_max,
        emg_rms
    ])
    labels.append(label)

# Convert to arrays
X = np.array(features)
y = np.array(labels)

feature_names = ['mean_hr', 'std_hr', 'min_hr', 'max_hr', 'rmssd',
                 'pnn50', 'emg_mean', 'emg_std', 'emg_max', 'emg_rms']

print(f"Dataset shape: {X.shape}")
print(f"Class distribution: {np.bincount(y)}")

# ============ PREPARE DATA ============
# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Convert to tensors
X_train_t = torch.FloatTensor(X_train_scaled)
y_train_t = torch.LongTensor(y_train)
X_test_t = torch.FloatTensor(X_test_scaled)
y_test_t = torch.LongTensor(y_test)

print(f"\nTrain: {X_train_t.shape}, Test: {X_test_t.shape}")

# ============ MODEL ============
class ECGEMGClassifier(nn.Module):
    def __init__(self, input_dim=10):
        super(ECGEMGClassifier, self).__init__()
        # Simple but effective architecture
        self.fc1 = nn.Linear(input_dim, 64)
        self.bn1 = nn.BatchNorm1d(64)
        self.dropout1 = nn.Dropout(0.3)

        self.fc2 = nn.Linear(64, 32)
        self.bn2 = nn.BatchNorm1d(32)
        self.dropout2 = nn.Dropout(0.3)

        self.fc3 = nn.Linear(32, 16)
        self.bn3 = nn.BatchNorm1d(16)
        self.dropout3 = nn.Dropout(0.2)

        self.fc4 = nn.Linear(16, 2)

    def forward(self, x):
        x = torch.relu(self.bn1(self.fc1(x)))
        x = self.dropout1(x)

        x = torch.relu(self.bn2(self.fc2(x)))
        x = self.dropout2(x)

        x = torch.relu(self.bn3(self.fc3(x)))
        x = self.dropout3(x)

        return self.fc4(x)

model = ECGEMGClassifier(input_dim=X.shape[1]).to(device)
print(f"\nModel parameters: {sum(p.numel() for p in model.parameters())}")

# ============ TRAINING ============
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=50, gamma=0.5)

print("\nTraining...")
print("-" * 40)

# Move data to device once
X_train_d = X_train_t.to(device)
y_train_d = y_train_t.to(device)
X_test_d = X_test_t.to(device)
y_test_d = y_test_t.to(device)

best_acc = 0
history = {'loss': [], 'acc': []}

# Training loop
for epoch in range(150):
    # Train
    model.train()

    # Mini-batch training
    batch_size = 32
    indices = torch.randperm(len(X_train_d))

    epoch_loss = 0
    n_batches = 0

    for i in range(0, len(X_train_d), batch_size):
        batch_indices = indices[i:i+batch_size]
        batch_x = X_train_d[batch_indices]
        batch_y = y_train_d[batch_indices]

        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        epoch_loss += loss.item()
        n_batches += 1

    avg_loss = epoch_loss / n_batches
    history['loss'].append(avg_loss)

    # Evaluate
    model.eval()
    with torch.no_grad():
        outputs = model(X_test_d)
        _, predicted = outputs.max(1)
        accuracy = (predicted == y_test_d).float().mean().item() * 100
        history['acc'].append(accuracy)

        if accuracy > best_acc:
            best_acc = accuracy
            # Save model
            best_model_state = model.state_dict()

    scheduler.step()

    # Print progress
    if (epoch + 1) % 25 == 0:
        print(f"Epoch {epoch+1:3d} | Loss: {avg_loss:.4f} | Acc: {accuracy:.1f}%")

print("-" * 40)
print(f"✅ Training complete!")
print(f"🎯 Best accuracy: {best_acc:.2f}%")

# ============ EVALUATION ============
# Load best model
model.load_state_dict(best_model_state)
model.eval()

# Get predictions
with torch.no_grad():
    outputs = model(X_test_d)
    probs = torch.softmax(outputs, dim=1)
    _, preds = outputs.max(1)

# Move to CPU for sklearn
y_test_cpu = y_test_d.cpu().numpy()
preds_cpu = preds.cpu().numpy()
probs_cpu = probs[:, 1].cpu().numpy()

# Confusion matrix
from sklearn.metrics import confusion_matrix, classification_report

cm = confusion_matrix(y_test_cpu, preds_cpu)
print("\nConfusion Matrix:")
print(cm)

print("\nClassification Report:")
print(classification_report(y_test_cpu, preds_cpu,
                          target_names=['Normal', 'Abnormal']))

# ============ VISUALIZATION ============
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Training history
axes[0].plot(history['loss'])
axes[0].set_title('Training Loss')
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('Loss')
axes[0].grid(True, alpha=0.3)

# Accuracy history
axes[1].plot(history['acc'])
axes[1].axhline(y=best_acc, color='r', linestyle='--', alpha=0.5)
axes[1].set_title(f'Test Accuracy (Best: {best_acc:.1f}%)')
axes[1].set_xlabel('Epoch')
axes[1].set_ylabel('Accuracy (%)')
axes[1].grid(True, alpha=0.3)

# Confusion matrix
im = axes[2].imshow(cm, cmap='Blues')
axes[2].set_title('Confusion Matrix')
axes[2].set_xlabel('Predicted')
axes[2].set_ylabel('Actual')
axes[2].set_xticks([0, 1])
axes[2].set_yticks([0, 1])
axes[2].set_xticklabels(['Normal', 'Abnormal'])
axes[2].set_yticklabels(['Normal', 'Abnormal'])

# Add text annotations
for i in range(2):
    for j in range(2):
        text = axes[2].text(j, i, str(cm[i, j]),
                           ha="center", va="center", color="black")

plt.colorbar(im, ax=axes[2])
plt.tight_layout()
plt.savefig('results.png', dpi=100)
plt.show()

# ============ SAVE MODEL ============
print("\n💾 Saving model...")

# Save everything
torch.save({
    'model_state_dict': best_model_state,
    'model_config': {
        'input_dim': X.shape[1],
        'feature_names': feature_names
    },
    'scaler': {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist()
    },
    'performance': {
        'best_accuracy': best_acc,
        'confusion_matrix': cm.tolist()
    }
}, 'ecg_emg_model.pth')

print("✅ Model saved as 'ecg_emg_model.pth'")
print("\n📥 To download from Kaggle:")
print("   1. Click 'Save Version' (top right)")
print("   2. Go to Output tab")
print("   3. Download 'ecg_emg_model.pth'")

# Quick inference test
print("\n🔍 Testing inference on sample data...")
sample_idx = np.random.randint(0, len(X_test_d))
sample = X_test_d[sample_idx:sample_idx+1]
true_label = y_test_d[sample_idx].item()

with torch.no_grad():
    output = model(sample)
    prob = torch.softmax(output, dim=1)
    pred = output.argmax(dim=1).item()

print(f"Sample {sample_idx}: True={true_label}, Predicted={pred}")
print(f"Confidence: {prob[0, pred].item():.2%}")