# make_combined_csv.py  — preserves dataTime strings, only uses a temp col to sort
import pandas as pd

def ensure_cols(df):
    # keep a consistent schema; t_idx is optional
    need = ["event_id","userId","dataTime","hr","o2Sat","label"]
    for c in need:
        if c not in df.columns:
            df[c] = None
    # keep any existing t_idx if present
    return df[need + ([c for c in df.columns if c == "t_idx"])]

def main():
    pos = pd.read_csv("osdb_seizures_long.csv")   # label=1 expected
    neg = pd.read_csv("osdb_false_long.csv")      # label=0 expected

    pos["label"] = 1
    neg["label"] = 0

    pos = ensure_cols(pos)
    neg = ensure_cols(neg)

    # Balance by downsampling negative EVENTS (not individual samples)
    ratio = 1.2  # 1.2x more negative events than positive events
    n_pos_events = pos["event_id"].nunique()
    n_neg_events = neg["event_id"].nunique()
    n_neg_events_target = int(n_pos_events * ratio)

    if n_neg_events > n_neg_events_target:
        print(f"⚖️  Balancing by events: {n_pos_events} positive, downsampling {n_neg_events} → {n_neg_events_target} negative events (1:{ratio} ratio)")
        # Randomly select negative events
        selected_neg_events = neg["event_id"].drop_duplicates().sample(n=n_neg_events_target, random_state=42)
        neg = neg[neg["event_id"].isin(selected_neg_events)]
        print(f"   Result: {len(pos)} positive samples, {len(neg)} negative samples")
    else:
        print(f"ℹ️  No downsampling needed: {n_neg_events} negative events already <= target {n_neg_events_target}")

    df = pd.concat([pos, neg], ignore_index=True)

    # ---- Sort WITHOUT overwriting the original dataTime strings ----
    # build a temporary parsed column to sort; keep strings intact
    parsed = pd.to_datetime(df["dataTime"], errors="coerce", dayfirst=True)
    # if you also carried t_idx from the converter, use it as a fallback for rows without timestamps
    if "t_idx" in df.columns:
        df["_parsed_order"] = parsed
        df = df.sort_values(["event_id", "_parsed_order", "t_idx"], kind="mergesort")
        df = df.drop(columns=["_parsed_order"])
    else:
        df["_parsed_order"] = parsed
        df = df.sort_values(["event_id", "_parsed_order"], kind="mergesort")
        df = df.drop(columns=["_parsed_order"])

    # DO NOT assign df["dataTime"] = parsed; we want to keep the original strings
    df.to_csv("osdb_combined_long.csv", index=False)

    print("✅ Wrote osdb_combined_long.csv")
    print("Rows:", len(df),
          "| Seizure rows:", (df["label"]==1).sum(),
          "| False-alarm rows:", (df["label"]==0).sum(),
          "| Unique events:", df["event_id"].nunique())

if __name__ == "__main__":
    main()
