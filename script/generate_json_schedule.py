import datetime
import json
from pathlib import Path

START_DATE = datetime.date(2026, 9, 17)
V1_WEEK_COUNT = 12
REVIEW_OFFSETS = [1, 3, 7, 14, 28]
OUTPUT_PATH = Path(__file__).with_name("schedule.json")

schedule = {}

for week_num in range(1, V1_WEEK_COUNT + 1):
    learning_date = START_DATE + datetime.timedelta(days=week_num - 1)
    learning_date_str = learning_date.isoformat()
    schedule.setdefault(learning_date_str, {"new": [], "review": []})
    schedule[learning_date_str]["new"].append(f"{week_num:02d}")

    for offset in REVIEW_OFFSETS:
        review_date_str = (learning_date + datetime.timedelta(days=offset)).isoformat()
        schedule.setdefault(review_date_str, {"new": [], "review": []})
        schedule[review_date_str]["review"].append(f"{week_num:02d}")

schedule = dict(sorted(schedule.items()))

with OUTPUT_PATH.open("w", encoding="utf-8") as file:
    json.dump(schedule, file, indent=2, ensure_ascii=False)

print(f"schedule.json 생성 완료: {OUTPUT_PATH}")
