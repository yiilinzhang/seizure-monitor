import pandas as pd
from sklearn.model_selection import train_test_split

def main():
    df = pd.read_csv("osdb_combined_long.csv")

    # Get unique events with their labels
    events = df.groupby("event_id")["label"].first().reset_index()

    # Split events 80/20, stratified by label to maintain class balance
    train_events, test_events = train_test_split(
        events["event_id"],
        test_size=0.2,
        random_state=42,
        stratify=events["label"]
    )

    # Filter samples by event membership
    train_df = df[df["event_id"].isin(train_events)]
    test_df = df[df["event_id"].isin(test_events)]

    # Save splits
    train_df.to_csv("train_data.csv", index=False)
    test_df.to_csv("test_data.csv", index=False)

    # Print statistics
    print("✅ Split complete!")
    print(f"\nTrain: {len(train_df)} samples, {train_events.nunique()} events")
    print(f"  - Positive: {(train_df['label']==1).sum()} samples, {train_df[train_df['label']==1]['event_id'].nunique()} events")
    print(f"  - Negative: {(train_df['label']==0).sum()} samples, {train_df[train_df['label']==0]['event_id'].nunique()} events")

    print(f"\nTest: {len(test_df)} samples, {test_events.nunique()} events")
    print(f"  - Positive: {(test_df['label']==1).sum()} samples, {test_df[test_df['label']==1]['event_id'].nunique()} events")
    print(f"  - Negative: {(test_df['label']==0).sum()} samples, {test_df[test_df['label']==0]['event_id'].nunique()} events")

if __name__ == "__main__":
    main()
