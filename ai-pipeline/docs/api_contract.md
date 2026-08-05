# API Contract

This is the interface the Node backend should code against. It's the same shape enforced by `app/models/schemas.py`, if the two ever disagree, the code is right and this file needs updating.

Status: draft, v1 not yet locked. This hasn't been reviewed against the Node backend's actual needs yet, since that branch isn't merged. Treat field names as likely to shift slightly once that conversation happens, see `docs/checklist.md` Stage 8.

## Authentication

Every request must include:

```
X-Service-Key: <shared secret, from SERVICE_API_KEY>
```

Requests without a valid key get a 401. This is internal service-to-service auth only, it has nothing to do with end-user authentication, which stays entirely on the Node side.

## POST /translate

Request:
```json
{
  "text": "yeh kitne ka hai",
  "source_lang": "en",
  "target_lang": "ur"
}
```

`source_lang` is optional. If omitted, it's detected automatically (Urdu script vs. English, see the language detection note in `docs/system_architecture.md`).

Response, 200:
```json
{
  "translated_text": "یہ کتنے کا ہے",
  "source_lang": "en",
  "target_lang": "ur",
  "provider": "azure",
  "cached": false
}
```

`provider` is one of `azure`, `libretranslate`, `cache`, or `none` (when source and target language are the same, so nothing was actually translated).

Response, 503: both translation providers failed. The Node backend should deliver the original text rather than fail the message.

## POST /transcribe

Multipart form upload, field name `audio`. Accepts common audio formats (whatever ffmpeg can decode). Capped at roughly 15 MB, matching the `MAX_VOICE_NOTE_SECONDS` setting.

Response, 200:
```json
{
  "transcript_original": "یہ کتنے کا ہے",
  "transcript_english": "how much is this",
  "detected_lang": "ur",
  "duration_seconds": 1.8
}
```

Response, 413: audio file too large.

## POST /parse-intent

Request:
```json
{
  "text": "how much is this"
}
```

Text should already be in English, translate it first if it isn't (see the voice note flow in `docs/system_architecture.md`).

Response, 200:
```json
{
  "intent": "negotiate_price",
  "entities": [{"name": "price_limit", "value": "20000"}],
  "confidence": 0.85,
  "tier": "rules",
  "requires_confirmation": false
}
```

`tier` tells you which stage produced the result (`rules`, `llm`, or `agent`), mostly useful for logging and debugging accuracy issues. `requires_confirmation` is true when confidence is below the threshold, the Node backend or frontend should ask the user to confirm before acting on a low-confidence intent rather than executing it silently.

Known intent values as of this writing: `search_listing`, `order_status`, `create_listing`, `negotiate_price`, `complaint`, `other`. This list will grow, don't hardcode an exhaustive switch on it without a default `other` case.

## Error handling expectations for the Node side

None of these endpoints being unreachable should fail the underlying operation:

- A failed `/translate` call means deliver the original text.
- A failed `/transcribe` call means tell the user the voice note couldn't be processed and ask them to try again or type instead.
- A failed `/parse-intent` call means fall back to whatever the pre-AI flow was (manual search, typed commands), not a hard error.
