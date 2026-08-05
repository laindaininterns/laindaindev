"""Integration test against real audio fixtures.

Unlike the rest of the suite, this exercises the actual Whisper model
and the real intent router, no mocking. It only runs against whatever
fixtures exist in tests/fixtures/audio, see the README there for how to
add more using your own voice.

Skipped entirely if no fixtures are present, and excluded from the
default CI run (see the integration marker in pyproject.toml and the
pytest invocation in .github/workflows/ai-pipeline-ci.yml), since CI has
neither a downloaded Whisper model nor real voices to test with. Run
this locally with:

  pytest -m integration
"""

import json
from pathlib import Path

import pytest

from app.services import stt
from app.services.intent.router import resolve_intent

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures" / "audio"


def _discover_cases() -> list[tuple[Path, dict]]:
    if not FIXTURES_DIR.exists():
        return []
    cases = []
    for expected_file in sorted(FIXTURES_DIR.glob("*.expected.json")):
        case_name = expected_file.name.removesuffix(".expected.json")
        audio_candidates = [p for p in FIXTURES_DIR.glob(f"{case_name}.*") if p.suffix != ".json"]
        if not audio_candidates:
            continue
        expected = json.loads(expected_file.read_text(encoding="utf-8"))
        cases.append((audio_candidates[0], expected))
    return cases


_CASES = _discover_cases()


@pytest.mark.integration
@pytest.mark.skipif(not _CASES, reason="no fixtures in tests/fixtures/audio, see the README there to add some")
@pytest.mark.parametrize("audio_path,expected", _CASES, ids=[c[0].stem for c in _CASES])
def test_transcription_matches_expected_language(audio_path: Path, expected: dict):
    result = stt.transcribe(str(audio_path))
    assert result["detected_lang"] == expected["detected_lang"], (
        f"Expected language {expected['detected_lang']!r} for {audio_path.name}, "
        f"got {result['detected_lang']!r}. Transcript was: {result['transcript_original']!r}"
    )
    # Exact transcript matching isn't realistic across ASR runs, this is a
    # sanity check that something real came out, not silence or garbage.
    assert len(result["transcript_english"].strip()) > 0


@pytest.mark.integration
@pytest.mark.skipif(not _CASES, reason="no fixtures in tests/fixtures/audio, see the README there to add some")
@pytest.mark.parametrize("audio_path,expected", _CASES, ids=[c[0].stem for c in _CASES])
async def test_intent_matches_expected(audio_path: Path, expected: dict):
    transcription = stt.transcribe(str(audio_path))
    result = await resolve_intent(transcription["transcript_english"])
    assert result["intent"] == expected["intent"], (
        f"Expected intent {expected['intent']!r} for {audio_path.name}, got {result['intent']!r}. "
        f"Transcript: {transcription['transcript_english']!r}"
    )
