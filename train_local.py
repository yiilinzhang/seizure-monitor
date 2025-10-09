#!/usr/bin/env python3
"""
Local training script for ECG/EMG model
Runs on your computer without Colab
"""

import torch
import torch.nn as nn
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import os

# Check if CUDA is available locally
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Using device: {device}')

# Generate synthetic ECG/EMG features
def generate_data(n_samples=1000):
    """Generate synthetic physiological data"""
    np.random.seed(42)

    # Two groups
    labels = np.random.randint(0, 2, n_samples)
    features = []

    for label in labels:
        if label == 0:  # Healthy
            features.append([
                np.random.normal(70, 5),    # mean_hr
                np.random.normal(4, 1),      # std_hr
                np.random.normal(40, 10),    # rmssd
                np.random.normal(0.3, 0.05), # emg_amp
                np.random.normal(80, 10),    # emg_freq
            ])
        else:  # Condition
            features.append([
                np.random.normal(85, 8),
                np.random.normal(8, 2),
                np.random.normal(25, 8),
                np.random.normal(0.5, 0.1),
                np.random.normal(120, 15),
            ])

    return np.array(features), labels

# Simple model
class SimpleNet(nn.Module):
    def __init__(self, input_dim=5):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, 16)
        self.fc2 = nn.Linear(16, 8)
        self.fc3 = nn.Linear(8, 2)
        self.dropout = nn.Dropout(0.2)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.dropout(x)
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

def train():
    # Generate data
    print("Generating synthetic data...")
    X, y = generate_data(1000)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Convert to tensors
    X_train = torch.FloatTensor(X_train)
    y_train = torch.LongTensor(y_train)
    X_test = torch.FloatTensor(X_test)
    y_test = torch.LongTensor(y_test)

    # Model
    model = SimpleNet().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # Train
    print("Training...")
    epochs = 100
    batch_size = 32
    best_acc = 0

    for epoch in range(epochs):
        model.train()

        # Shuffle
        perm = torch.randperm(len(X_train))
        X_train = X_train[perm]
        y_train = y_train[perm]

        # Mini-batches
        for i in range(0, len(X_train), batch_size):
            batch_X = X_train[i:i+batch_size].to(device)
            batch_y = y_train[i:i+batch_size].to(device)

            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

        # Evaluate
        model.eval()
        with torch.no_grad():
            outputs = model(X_test.to(device))
            _, predicted = outputs.max(1)
            acc = (predicted == y_test.to(device)).float().mean().item() * 100

        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), 'best_model.pth')

        if (epoch + 1) % 20 == 0:
            print(f"Epoch {epoch+1}/{epochs} - Accuracy: {acc:.2f}%")

    print(f"\nTraining complete! Best accuracy: {best_acc:.2f}%")

    # Save everything
    with open('model_package.pkl', 'wb') as f:
        pickle.dump({
            'scaler': scaler,
            'input_dim': X.shape[1],
            'accuracy': best_acc
        }, f)

    print("Model saved to 'best_model.pth'")
    print("Package saved to 'model_package.pkl'")

if __name__ == "__main__":
    train()