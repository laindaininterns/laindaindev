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

## Tool contract this service expects from the Node backend

This is the other direction: the tier 3 agent calls out to the Node backend to actually do something (search listings, message a seller). These endpoints don't exist on the Node side yet, so `mock_backend/` implements this exact contract with fixed fixture data, purely for local development and testing. `BACKEND_BASE_URL` points at `mock_backend` in dev, swap it to the real Node backend's internal API URL once these endpoints exist there, matching this contract exactly means no code changes on either side.

### POST /internal/search-listings

Request:
```json
{ "query": "bike", "max_price": 20000 }
```

`max_price` is optional. Response, 200:
```json
{ "results": [{ "id": "L1", "title": "Used mountain bike, good condition", "category": "bike", "price": 18000, "seller_id": "S1" }] }
```

An empty `results` list is a normal, valid response, it means no matches, not an error.

### POST /internal/contact-seller

Request:
```json
{ "seller_id": "S1", "message": "Is this still available?" }
```

Response, 200:
```json
{ "sent": true, "message_id": "MSG-S1-24", "error": null }
```

If the seller doesn't exist: `{ "sent": false, "message_id": null, "error": "unknown seller_id 'S1'" }`. The agent treats any non-2xx response or a network failure the same way it treats any other tool failure, it's recorded as an observation in the agent's trace and reasoned about on the next step, it doesn't crash the request.

### Why fixture data instead of waiting for the real backend

There are no real buyers or sellers on the platform yet, so testing against the real backend isn't possible regardless of whether it's built. Testing against `mock_backend`'s fixed data proves the full path (voice note in, transcription, translation, intent, agent tool call, structured result out) works correctly and gives a known-correct expected answer to check against, `tests/test_mock_backend.py` and `tests/test_tier3_tools.py` do exactly that. That correctness carries over unchanged once real data exists, because the contract, not the data, is what the agent's logic depends on.
