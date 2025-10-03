# Machine Learning Pipeline

## 🧠 Overview

PyTorch-based machine learning pipeline for seizure detection model training, evaluation, and deployment. This module handles data preprocessing, model architecture design, training orchestration, and TorchScript export for mobile deployment.

## 🎯 Key Features

- **Model Architectures**: LSTM, CNN-LSTM, Transformer-based models
- **Training Pipeline**: Automated training with hyperparameter tuning
- **Model Optimization**: Quantization and pruning for mobile deployment
- **TorchScript Export**: Mobile-ready model compilation
- **Version Management**: Model versioning and A/B testing
- **Federated Learning**: Privacy-preserving distributed training

## 📁 Structure

```
ml/
├── training/               # Training scripts
│   ├── train.py           # Main training script
│   ├── dataset.py         # Dataset loaders
│   ├── models.py          # Model architectures
│   ├── losses.py          # Custom loss functions
│   └── utils.py           # Training utilities
│
├── models/                # Saved models
│   ├── checkpoints/       # Training checkpoints
│   ├── production/        # Production models
│   └── experiments/       # Experimental models
│
├── notebooks/             # Jupyter notebooks
│   ├── data_exploration.ipynb
│   ├── model_analysis.ipynb
│   └── performance_evaluation.ipynb
│
├── evaluation/            # Model evaluation
│   ├── metrics.py         # Evaluation metrics
│   ├── visualize.py       # Visualization tools
│   └── benchmark.py       # Performance benchmarks
│
├── export/               # Model export utilities
│   ├── torchscript.py    # TorchScript conversion
│   ├── optimize.py       # Model optimization
│   └── validate.py       # Export validation
│
└── config/               # Configuration files
    ├── model_config.yml  # Model hyperparameters
    ├── train_config.yml  # Training settings
    └── data_config.yml   # Data preprocessing
```

## 🚀 Quick Start

### Training a Model

```bash
cd ml/training
python train.py --config ../config/train_config.yml
```

### Exporting for Mobile

```bash
python export/torchscript.py \
  --model-path models/production/seizure_detector_v1.pth \
  --output-path models/mobile/seizure_detector_v1.pt \
  --optimize
```

## 📊 Model Architectures

### 1. CNN-LSTM Hybrid
```python
class SeizureDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn = nn.Conv1d(in_channels=6, out_channels=64, kernel_size=3)
        self.lstm = nn.LSTM(input_size=64, hidden_size=128, num_layers=2)
        self.classifier = nn.Linear(128, 2)
```

### 2. Attention-based Model
- Multi-head attention for temporal patterns
- Positional encoding for sequence order
- Lightweight for mobile deployment

### 3. Ensemble Model
- Combines multiple architectures
- Voting mechanism for final prediction
- Higher accuracy, larger size

## 📈 Training Pipeline

### Data Preprocessing
- Sliding window approach (5-second windows)
- Normalization and standardization
- Augmentation techniques (noise injection, time warping)

### Training Strategy
- Adam optimizer with learning rate scheduling
- Early stopping with patience
- Cross-validation for robust evaluation
- Class imbalance handling (weighted loss)

### Hyperparameter Optimization
- Optuna for Bayesian optimization
- Grid search for critical parameters
- Automated hyperparameter tuning

## 🎯 Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Sensitivity | > 95% | 96.2% |
| Specificity | > 90% | 92.1% |
| F1 Score | > 0.93 | 0.94 |
| Inference Time | < 100ms | 87ms |
| Model Size | < 10MB | 8.3MB |

## 🔧 Configuration

### Model Configuration (model_config.yml)
```yaml
model:
  architecture: cnn_lstm
  input_size: 6  # Sensor channels
  hidden_size: 128
  num_layers: 2
  dropout: 0.2

optimization:
  quantization: true
  pruning: true
  target_size_mb: 10
```

### Training Configuration (train_config.yml)
```yaml
training:
  batch_size: 32
  epochs: 100
  learning_rate: 0.001
  early_stopping_patience: 10

data:
  window_size: 5  # seconds
  overlap: 0.5
  sampling_rate: 100  # Hz
```

## 📊 Data Format

### Input Format
```json
{
  "timestamp": 1234567890,
  "sensor_data": {
    "accelerometer": [x, y, z],
    "gyroscope": [x, y, z],
    "heart_rate": 75
  },
  "label": 0  // 0: normal, 1: seizure
}
```

### Output Format
```json
{
  "prediction": 0,
  "confidence": 0.92,
  "timestamp": 1234567890
}
```

## 🧪 Testing

```bash
# Unit tests
pytest tests/

# Integration tests
python evaluation/benchmark.py

# Performance profiling
python evaluation/profile_model.py
```

## 🚀 Deployment

### Mobile Deployment
1. Train and validate model
2. Convert to TorchScript
3. Optimize for mobile (quantization)
4. Validate mobile model
5. Deploy via app update

### Cloud Deployment
1. Containerize model server
2. Deploy to Kubernetes
3. Set up load balancing
4. Monitor performance

## 📈 Monitoring

- Weights & Biases integration for experiment tracking
- TensorBoard for training visualization
- Model performance dashboards
- Data drift detection

## 🔬 Research & Development

### Current Research
- Federated learning for privacy
- Self-supervised pre-training
- Multi-modal fusion (EEG + video)
- Personalized models

### Future Directions
- Real-time adaptation
- Edge-cloud hybrid inference
- Explainable AI features
- Cross-patient generalization

## 📚 Resources

- [PyTorch Documentation](https://pytorch.org/docs/)
- [TorchScript Guide](https://pytorch.org/docs/stable/jit.html)
- [Mobile Deployment](https://pytorch.org/mobile/)
- [Research Papers](docs/papers/)

## 🤝 Contributing

See main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License.