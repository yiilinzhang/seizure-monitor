# save as osdb_to_long_csv_false.py
import json, csv, pathlib

def json_to_long_csv(json_path, out_csv, label=0):
    """
    Reads an OSDB JSON (array of events), writes a long CSV:
    columns: event_id, userId, dataTime, hr, o2Sat, label
    Skips rawData/simpleSpec to keep it light.
    """
    json_path = pathlib.Path(json_path)
    out_csv = pathlib.Path(out_csv)
    count_rows = 0

    with json_path.open('r', encoding='utf-8') as f, out_csv.open('w', newline='', encoding='utf-8') as g:
        w = csv.writer(g)
        w.writerow(['event_id', 'userId', 'dataTime', 'hr', 'o2Sat', 'label'])

        data = json.load(f)   # array of event objects
        for ev in data:
            event_id = ev.get('id') or ev.get('eventId')
            user_id = ev.get('userId')
            dps = ev.get('datapoints', [])
            for dp in dps:
                dt   = dp.get('dataTime')
                hr   = dp.get('hr')
                o2   = dp.get('o2Sat', -1)
                hr = dp.get('hr')
# skip if missing or invalid
                if hr is None or hr <= 0 or hr > 220:  
                    continue
                w.writerow([event_id, user_id, dt, hr, o2, label])
                count_rows += 1

    print(f"Wrote {count_rows} rows to {out_csv}")

if __name__ == "__main__":
    # False alarm file (label 0)
    json_to_long_csv("osdb_3min_falseAlarms.json", "osdb_false_long.csv", label=0)
