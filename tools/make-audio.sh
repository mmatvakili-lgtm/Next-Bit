#!/usr/bin/env bash
# تولید فایل صوتی حرفه‌ای با صدای عصبی فارسی (Microsoft Edge neural TTS) — روی سیستم خودتان با اینترنت اجرا کنید.
# پیش‌نیاز: pip install edge-tts
set -e
cd "$(dirname "$0")/.."
node build.mjs >/dev/null            # متن‌های تلفظ‌شده در content/issue-01/audio-src/*.txt ساخته می‌شود
mkdir -p content/issue-01/audio
VOICE="${VOICE:-fa-IR-DilaraNeural}"  # یا fa-IR-FaridNeural
RATE="${RATE:--5%}"
for f in content/issue-01/audio-src/*.txt; do
  s=$(basename "$f" .txt)
  echo "→ $s"
  edge-tts --voice "$VOICE" --rate="$RATE" -f "$f" --write-media "content/issue-01/audio/$s.mp3"
done
node build.mjs   # پخش‌کنندهٔ <audio> برای هر فایل خودکار اضافه می‌شود
