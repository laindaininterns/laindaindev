# System Architecture

## Scope

This service covers three related features for the marketplace:

1. Buyer and seller chat messages get translated automatically between Urdu and English, so each side reads the conversation in their own preferred language.
2. Voice notes get transcribed, in either language, into text.
3. That text, whether typed or transcribed, can be understood as a command (find a listing, check an order, list an item) and routed to the right backend action.

## Request flow, chat translation

```
Seller types a message
        |
        v
Node backend checks the buyer's preferred_language
        |
   same language? --- yes ---> store and deliver as-is, no call to this service
        |
        no
        v
POST /translate  (this service)
        |
        v
Check Redis cache (hash of text + target language)
        |
   cache hit? --- yes ---> return cached translation
        |
        no
        v
Try Azure Translator
        |
   failed? --- yes ---> try self-hosted LibreTranslate
        |
   both failed? --- yes ---> return an error, Node backend delivers the
        |                     original text rather than blocking the message
        no
        v
Store in cache, return translated text
```

The important property here is that a translation failure never blocks a message from being delivered. Worst case, the recipient sees the original language for that one message.

## Request flow, voice note to command

```
User records a voice note
        |
        v
POST /transcribe  (audio file)
        |
        v
Whisper, self-hosted, runs once:
  - transcript in the original language (kept for the record)
  - transcript translated to English (used for everything after this point)
        |
        v
POST /parse-intent  (English text)
        |
        v
Tier 1: rule/regex matching
        |
   confident match? --- yes ---> return intent, done
        |
        no
        v
Tier 2: single-shot LLM classification
        |
   flags requires_multi_step? --- no ---> return intent, done
        |
        yes
        v
Tier 3: bounded agent (max steps, hard timeout)
        |
   converges in budget? --- yes ---> return intent
        |
        no
        v
Fall back to the tier 2 result rather than fail the request
```

Why English-only for intent parsing: translating first and then parsing intent in a single language is simpler and more reliable than trying to build a bilingual command parser. It also means the rule-based tier and the LLM prompt only ever have to be good at one language.

Why three tiers instead of always using an LLM or always using an agent: most marketplace commands are single-intent ("find me a bike under 20,000", "where is my order"). Running those through a multi-step agent loop would add latency and variance for no benefit. The agent tier exists specifically for compound requests ("find a bike, and if there's nothing, check scooters too, and message the top sellers"), and is gated so it only runs on the traffic that actually needs it.

## Language detection

Urdu written in its own script is detected with a Unicode range check, not a model call, since the two scripts are trivially distinguishable. Roman Urdu (Urdu typed in Latin letters) is the one case this can't reliably catch, see `app/utils/lang_detect.py` for the heuristic used and its limits. When in doubt, the system should trust the user's saved `preferred_language` over an automatic guess.

## Failure handling, summarized

| Component fails | What happens |
|---|---|
| Azure Translator (quota or outage) | Falls back to self-hosted LibreTranslate automatically |
| Both translation providers | Node backend delivers the original text, no translation, message still goes through |
| Tier 2 LLM (Ollama or hosted) unreachable | Should be treated as tier 1's best guess if there was one, otherwise the request needs a manual retry, this isn't handled gracefully yet, see the "Known limitations" section in the README |
| Tier 3 agent times out or exceeds its step limit | Falls back to the tier 2 result |
| This whole service is down | The Node backend should treat translation and voice features as temporarily unavailable rather than fail the underlying chat or order operation, see `docs/api_contract.md` for the expected error shape |

## Deliberately out of scope for this service

- Authentication of end users. This service only verifies that the caller is the Node backend (via the shared `SERVICE_API_KEY`), it never sees a user's real identity or session.
- Any UI or UX decisions (loading states, confirmation dialogs, "see original" toggles). Those live on the frontend/product side.
- Executing backend actions directly. This service returns a structured intent, the Node backend decides what to actually do with it.
