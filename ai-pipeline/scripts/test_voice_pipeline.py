#!/usr/bin/env python3
"""Manual end to end test harness for a saved voice recording.

Sends an audio file through the running service's /transcribe,
/translate, and /parse-intent endpoints in sequence and prints what
came back at each step. This is the terminal-based counterpart to the
browser mic recorder at /dev/voice-tester, use whichever is more
convenient. Recordings that turn out interesting (a mistranscription,
a misparsed intent) are worth saving into tests/fixtures/audio/ with
--save so they become part of the regression set over time.

Usage:
  python scripts/test_voice_pipeline.py path/to/recording.wav
  python scripts/test_voice_pipeline.py path/to/recording.wav --target-lang en
  python scripts/test_voice_pipeline.py path/to/recording.wav --save search_bike_ur

Requires the service to already be running (docker compose up, or
uvicorn app.main:app --reload) and SERVICE_API_KEY set in the
environment or passed with --service-key.
"""

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path

import httpx

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "audio"


def call(client: httpx.Client, method: str, url: str, **kwargs) -> tuple[dict, float]:
    start = time.monotonic()
    response = client.request(method, url, **kwargs)
    elapsed_ms = (time.monotonic() - start) * 1000
    response.raise_for_status()
    return response.json(), elapsed_ms


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("audio_path", type=Path, help="Path to a recorded audio file")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--service-key", default=os.environ.get("SERVICE_API_KEY", ""))
    parser.add_argument("--target-lang", default="ur", choices=["en", "ur"])
    parser.add_argument(
        "--save",
        metavar="CASE_NAME",
        help="Copy the audio into tests/fixtures/audio/<CASE_NAME><ext> for the regression suite",
    )
    args = parser.parse_args()

    if not args.audio_path.exists():
        print(f"Audio file not found: {args.audio_path}", file=sys.stderr)
        return 1

    if not args.service_key:
        print(
            "Warning: no service key given (--service-key or SERVICE_API_KEY env var), expect a 401.",
            file=sys.stderr,
        )

    headers = {"X-Service-Key": args.service_key}

    with httpx.Client(base_url=args.base_url, timeout=60.0) as client:
        print(f"Sending {args.audio_path.name} to /transcribe ...")
        with open(args.audio_path, "rb") as f:
            files = {"audio": (args.audio_path.name, f, "application/octet-stream")}
            transcribe_result, ms = call(client, "POST", "/transcribe", headers=headers, files=files)
        _print_step("1. Transcribe", transcribe_result, ms)

        print("Sending transcript to /translate ...")
        translate_result, ms = call(
            client,
            "POST",
            "/translate",
            headers=headers,
            json={
                "text": transcribe_result["transcript_english"],
                "source_lang": "en",
                "target_lang": args.target_lang,
            },
        )
        _print_step("2. Translate", translate_result, ms)

        print("Sending transcript to /parse-intent ...")
        intent_result, ms = call(
            client,
            "POST",
            "/parse-intent",
            headers=headers,
            json={"text": transcribe_result["transcript_english"]},
        )
        _print_step("3. Parse intent", intent_result, ms)

    if args.save:
        FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
        dest = FIXTURES_DIR / f"{args.save}{args.audio_path.suffix}"
        shutil.copy(args.audio_path, dest)
        expected_path = FIXTURES_DIR / f"{args.save}.expected.json"
        expected_path.write_text(
            json.dumps(
                {
                    "transcript_english": transcribe_result["transcript_english"],
                    "detected_lang": transcribe_result["detected_lang"],
                    "intent": intent_result["intent"],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        print(f"\nSaved as a regression fixture: {dest}")
        print(f"Recorded expected values in: {expected_path}")
        print("Review that .expected.json file, it's what the integration test will check future runs against.")

    return 0


def _print_step(title: str, data: dict, elapsed_ms: float) -> None:
    print(f"\n{title} ({elapsed_ms:.0f} ms)")
    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    raise SystemExit(main())
