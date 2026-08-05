# Voice regression fixtures

This folder holds real recordings used by the integration test
(`tests/integration/test_real_pipeline.py`), which is not run by CI
since it needs an actual downloaded Whisper model and real voices,
neither of which CI has. Run it locally with:

```
pytest -m integration
```

## Adding a fixture

The easiest way is through the CLI harness, which records the full
pipeline output and saves both files for you:

```
python scripts/test_voice_pipeline.py path/to/your_recording.wav --save search_bike_ur
```

That creates two files here:

- `search_bike_ur.wav`, the audio itself
- `search_bike_ur.expected.json`, the transcript, detected language, and
  parsed intent captured at save time

Review the `.expected.json` file before committing it, it's what future
runs get checked against. If the transcript or detected language in
there is wrong, fix it by hand, don't commit a fixture that bakes in a
mistake as the expected answer.

## Naming convention

`<intent-or-scenario>_<language>.<ext>`, for example:

- `search_bike_en.wav`, English, tier 1 search intent
- `search_bike_ur.wav`, the same request in Urdu
- `order_status_roman_ur.wav`, Roman Urdu, a known weak spot worth extra coverage
- `compound_search_and_contact_en.wav`, a genuinely multi-step request meant to exercise the tier 3 agent

A good fixture set covers each core intent in both English and Urdu, plus a few Roman Urdu and code-switched examples, since those are the cases most likely to silently regress.
