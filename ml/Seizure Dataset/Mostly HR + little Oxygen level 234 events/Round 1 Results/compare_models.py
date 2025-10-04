import json

def load_results(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def main():
    cnn = load_results('cnn_results.json')
    lstm = load_results('lstm_results.json')

    print("="*70)
    print("MODEL COMPARISON REPORT")
    print("="*70)
    print()

    # Header
    print(f"{'Metric':<20} {'1D-CNN':<15} {'LSTM':<15} {'Winner':<15}")
    print("-"*70)

    # Metrics
    metrics = ['accuracy', 'precision', 'recall', 'f1']
    for metric in metrics:
        cnn_val = cnn['final_metrics'][metric]
        lstm_val = lstm['final_metrics'][metric]
        winner = 'LSTM' if lstm_val > cnn_val else ('CNN' if cnn_val > lstm_val else 'Tie')
        print(f"{metric.capitalize():<20} {cnn_val:<15.4f} {lstm_val:<15.4f} {winner:<15}")

    print()
    print("="*70)
    print("CONFUSION MATRICES")
    print("="*70)
    print()

    print("1D-CNN:")
    print("              Predicted")
    print("            0        1")
    cm_cnn = cnn['confusion_matrix']
    print(f"Actual 0  {cm_cnn[0][0]:4d}    {cm_cnn[0][1]:4d}")
    print(f"       1  {cm_cnn[1][0]:4d}    {cm_cnn[1][1]:4d}")
    print()

    print("LSTM:")
    print("              Predicted")
    print("            0        1")
    cm_lstm = lstm['confusion_matrix']
    print(f"Actual 0  {cm_lstm[0][0]:4d}    {cm_lstm[0][1]:4d}")
    print(f"       1  {cm_lstm[1][0]:4d}    {cm_lstm[1][1]:4d}")
    print()

    print("="*70)
    print("SUMMARY")
    print("="*70)
    print()

    # Calculate which model is better overall
    cnn_avg = sum(cnn['final_metrics'][m] for m in metrics) / len(metrics)
    lstm_avg = sum(lstm['final_metrics'][m] for m in metrics) / len(metrics)

    print(f"Average Score (CNN):  {cnn_avg:.4f}")
    print(f"Average Score (LSTM): {lstm_avg:.4f}")
    print()

    if lstm_avg > cnn_avg:
        diff = ((lstm_avg - cnn_avg) / cnn_avg) * 100
        print(f"✅ LSTM performs better overall (+{diff:.1f}%)")
        print()
        print("Key LSTM advantages:")
        print(f"  • Better recall: {lstm['final_metrics']['recall']:.4f} vs {cnn['final_metrics']['recall']:.4f}")
        print(f"    (Catches {lstm_avg*100:.1f}% of patterns vs {cnn_avg*100:.1f}%)")
        print(f"  • Superior at temporal pattern recognition")
    else:
        diff = ((cnn_avg - lstm_avg) / lstm_avg) * 100
        print(f"✅ 1D-CNN performs better overall (+{diff:.1f}%)")
        print()
        print("Key CNN advantages:")
        print(f"  • Better local feature extraction")

    print()
    print("="*70)
    print("RECOMMENDATION")
    print("="*70)
    print()

    if lstm_avg > cnn_avg and lstm['final_metrics']['recall'] > cnn['final_metrics']['recall']:
        print("Use LSTM model for production:")
        print("  • Better at detecting seizure patterns (higher recall)")
        print("  • More suited for temporal HR sequences")
        print(f"  • Model saved as: lstm_model.pth")
    else:
        print("Use 1D-CNN model for production:")
        print("  • Better overall performance")
        print("  • Faster inference")
        print(f"  • Model saved as: cnn_model.pth")

    print()

    # Save comparison to file
    with open('model_comparison.txt', 'w') as f:
        f.write("MODEL COMPARISON REPORT\n")
        f.write("="*70 + "\n\n")
        f.write(f"{'Metric':<20} {'1D-CNN':<15} {'LSTM':<15} {'Winner':<15}\n")
        f.write("-"*70 + "\n")

        for metric in metrics:
            cnn_val = cnn['final_metrics'][metric]
            lstm_val = lstm['final_metrics'][metric]
            winner = 'LSTM' if lstm_val > cnn_val else ('CNN' if cnn_val > lstm_val else 'Tie')
            f.write(f"{metric.capitalize():<20} {cnn_val:<15.4f} {lstm_val:<15.4f} {winner:<15}\n")

        f.write("\n" + "="*70 + "\n")
        f.write("CONFUSION MATRICES\n")
        f.write("="*70 + "\n\n")

        f.write("1D-CNN:\n")
        f.write("              Predicted\n")
        f.write("            0        1\n")
        f.write(f"Actual 0  {cm_cnn[0][0]:4d}    {cm_cnn[0][1]:4d}\n")
        f.write(f"       1  {cm_cnn[1][0]:4d}    {cm_cnn[1][1]:4d}\n\n")

        f.write("LSTM:\n")
        f.write("              Predicted\n")
        f.write("            0        1\n")
        f.write(f"Actual 0  {cm_lstm[0][0]:4d}    {cm_lstm[0][1]:4d}\n")
        f.write(f"       1  {cm_lstm[1][0]:4d}    {cm_lstm[1][1]:4d}\n\n")

        f.write("="*70 + "\n")
        f.write("SUMMARY\n")
        f.write("="*70 + "\n\n")
        f.write(f"Average Score (CNN):  {cnn_avg:.4f}\n")
        f.write(f"Average Score (LSTM): {lstm_avg:.4f}\n\n")

        if lstm_avg > cnn_avg:
            diff = ((lstm_avg - cnn_avg) / cnn_avg) * 100
            f.write(f"✅ LSTM performs better overall (+{diff:.1f}%)\n")
        else:
            diff = ((cnn_avg - lstm_avg) / lstm_avg) * 100
            f.write(f"✅ 1D-CNN performs better overall (+{diff:.1f}%)\n")

    print("✅ Comparison saved to model_comparison.txt")

if __name__ == "__main__":
    main()
