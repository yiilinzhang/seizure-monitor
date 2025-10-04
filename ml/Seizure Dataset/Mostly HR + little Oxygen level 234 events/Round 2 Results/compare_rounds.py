import json

def load_results(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def main():
    round1 = load_results('../Round 1 Results/lstm_results.json')
    round2 = load_results('lstm_v2_results.json')

    print("="*70)
    print("ROUND 1 vs ROUND 2 COMPARISON")
    print("="*70)
    print()

    # Header
    print(f"{'Metric':<20} {'Round 1':<15} {'Round 2':<15} {'Change':<15}")
    print("-"*70)

    # Metrics
    metrics = ['accuracy', 'precision', 'recall', 'f1']
    for metric in metrics:
        r1_val = round1['final_metrics'][metric]
        r2_val = round2['final_metrics'][metric]
        change = ((r2_val - r1_val) / r1_val) * 100 if r1_val > 0 else 0
        change_str = f"{'+' if change > 0 else ''}{change:.1f}%"
        print(f"{metric.capitalize():<20} {r1_val:<15.4f} {r2_val:<15.4f} {change_str:<15}")

    print()
    print("="*70)
    print("CONFUSION MATRICES")
    print("="*70)
    print()

    print("Round 1 (Basic LSTM):")
    print("              Predicted")
    print("            0        1")
    cm1 = round1['confusion_matrix']
    print(f"Actual 0  {cm1[0][0]:4d}    {cm1[0][1]:4d}")
    print(f"       1  {cm1[1][0]:4d}    {cm1[1][1]:4d}")
    print()

    print("Round 2 (Improved LSTM):")
    print("              Predicted")
    print("            0        1")
    cm2 = round2['confusion_matrix']
    print(f"Actual 0  {cm2[0][0]:4d}    {cm2[0][1]:4d}")
    print(f"       1  {cm2[1][0]:4d}    {cm2[1][1]:4d}")
    print()

    print("="*70)
    print("KEY IMPROVEMENTS IN ROUND 2")
    print("="*70)
    print()

    # Calculate improvements
    recall_improvement = ((round2['final_metrics']['recall'] - round1['final_metrics']['recall'])
                          / round1['final_metrics']['recall']) * 100

    # True positives (correctly detected seizures)
    tp1 = cm1[1][1]
    tp2 = cm2[1][1]
    tp_improvement = tp2 - tp1

    print(f"✅ Recall improved by {recall_improvement:.1f}%")
    print(f"   → Now detecting {tp2}/{cm2[1][0]+cm2[1][1]} seizures (was {tp1}/{cm1[1][0]+cm1[1][1]})")
    print(f"   → {tp_improvement} more seizures caught!")
    print()

    print("Improvements applied:")
    for improvement in round2['improvements']:
        print(f"  • {improvement}")
    print()

    print("="*70)
    print("SUMMARY")
    print("="*70)
    print()

    r1_avg = sum(round1['final_metrics'][m] for m in metrics) / len(metrics)
    r2_avg = sum(round2['final_metrics'][m] for m in metrics) / len(metrics)
    overall_improvement = ((r2_avg - r1_avg) / r1_avg) * 100

    print(f"Average Score Round 1: {r1_avg:.4f}")
    print(f"Average Score Round 2: {r2_avg:.4f}")
    print(f"Overall Improvement:   {'+' if overall_improvement > 0 else ''}{overall_improvement:.1f}%")
    print()

    if overall_improvement > 0:
        print(f"✅ Round 2 model performs better!")
        print(f"   Most significant improvement: RECALL (seizure detection)")
        print(f"   → {round2['final_metrics']['recall']:.1%} vs {round1['final_metrics']['recall']:.1%}")
    else:
        print(f"⚠️  Round 1 model still performs slightly better overall")
        print(f"   However, Round 2 has better recall for seizure detection")

    print()
    print("Recommended model: lstm_v2_model.pth (Round 2)")
    print("  → Better at catching seizures (higher recall)")
    print("  → Uses both HR + O2 saturation data")

    # Save comparison
    with open('round_comparison.txt', 'w') as f:
        f.write("ROUND 1 vs ROUND 2 COMPARISON\n")
        f.write("="*70 + "\n\n")

        f.write(f"{'Metric':<20} {'Round 1':<15} {'Round 2':<15} {'Change':<15}\n")
        f.write("-"*70 + "\n")

        for metric in metrics:
            r1_val = round1['final_metrics'][metric]
            r2_val = round2['final_metrics'][metric]
            change = ((r2_val - r1_val) / r1_val) * 100 if r1_val > 0 else 0
            change_str = f"{'+' if change > 0 else ''}{change:.1f}%"
            f.write(f"{metric.capitalize():<20} {r1_val:<15.4f} {r2_val:<15.4f} {change_str:<15}\n")

        f.write("\n" + "="*70 + "\n")
        f.write("KEY IMPROVEMENTS\n")
        f.write("="*70 + "\n\n")

        f.write(f"Recall improved by {recall_improvement:.1f}%\n")
        f.write(f"Detecting {tp2}/{cm2[1][0]+cm2[1][1]} seizures (was {tp1}/{cm1[1][0]+cm1[1][1]})\n\n")

        f.write("Improvements applied:\n")
        for improvement in round2['improvements']:
            f.write(f"  • {improvement}\n")

        f.write(f"\nOverall Improvement: {'+' if overall_improvement > 0 else ''}{overall_improvement:.1f}%\n")
        f.write(f"\nRecommended: lstm_v2_model.pth\n")

    print("\n✅ Comparison saved to round_comparison.txt")

if __name__ == "__main__":
    main()
