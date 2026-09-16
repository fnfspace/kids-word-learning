import datetime
import json
import os
from pathlib import Path

import requests


BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
BASE_DIR = Path(__file__).resolve().parent
SCHEDULE_PATH = BASE_DIR / "schedule_v1.json"
CARD_DIR = BASE_DIR.parent / "card_v1"
MAX_MEDIA_GROUP_SIZE = 10


def card_paths(lessons):
    paths = []
    for lesson in lessons:
        week_directory = CARD_DIR / f"Week{lesson}"
        week_cards = sorted(week_directory.glob(f"v1_Week{lesson}_*.png"))
        if not week_cards:
            raise FileNotFoundError(f"카드 이미지를 찾을 수 없습니다: {week_directory}")
        paths.extend(week_cards)
    return paths


def send_card_album(image_paths, caption):
    for start_index in range(0, len(image_paths), MAX_MEDIA_GROUP_SIZE):
        image_group = image_paths[start_index : start_index + MAX_MEDIA_GROUP_SIZE]
        media = []
        files = {}
        for index, image_path in enumerate(image_group):
            attachment_name = f"photo{index}"
            item = {"type": "photo", "media": f"attach://{attachment_name}"}
            if start_index == 0 and index == 0:
                item["caption"] = caption
            media.append(item)
            files[attachment_name] = (image_path.name, image_path.open("rb"), "image/png")

        try:
            response = requests.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMediaGroup",
                data={"chat_id": CHAT_ID, "media": json.dumps(media)},
                files=files,
                timeout=60,
            )
            response.raise_for_status()
            if not response.json().get("ok"):
                raise RuntimeError(f"Telegram API error: {response.text}")
        finally:
            for _, file_handle, _ in files.values():
                file_handle.close()


def send_lessons(lessons, label):
    for lesson in lessons:
        send_card_album(card_paths([lesson]), f"{label}\nWeek{lesson}")


def main():
    if not BOT_TOKEN or not CHAT_ID:
        raise RuntimeError("TELEGRAM_BOT_TOKEN 및 TELEGRAM_CHAT_ID 환경 변수가 필요합니다.")

    kst = datetime.timezone(datetime.timedelta(hours=9))
    today = datetime.datetime.now(kst).date().isoformat()
    slot = os.getenv("SLOT", "all")

    with SCHEDULE_PATH.open(encoding="utf-8") as file:
        schedule = json.load(file)

    today_schedule = schedule.get(today)
    if not today_schedule:
        print("오늘은 발송할 메시지가 없습니다.")
        return

    if slot in ("new_words", "all"):
        send_lessons(today_schedule.get("new", []), "신규 학습")

    if slot in ("review_words", "all"):
        send_lessons(today_schedule.get("review", []), "복습")


if __name__ == "__main__":
    main()