# Granular Task Checklist

## Stage 1: Service Scaffolding
- [x] Set up FastAPI app structure (`app/api`, `app/services`, `app/models`, `app/utils`)
- [x] Config loader reading from environment variables (`app/config.py`)
- [x] Shared-secret auth dependency for internal calls (`app/api/deps.py`)
- [x] `.env.example` documenting every variable, no real secrets committed
- [x] `.gitignore` covering `.env`, Python, and Node artifacts
- [x] Health check endpoint

## Stage 2: Translation Layer
- [x] Azure Translator client (primary provider)
- [x] LibreTranslate client (fallback provider, self-hosted)
- [x] Redis-backed translation cache
- [x] Unicode-range based Urdu detection, no API call needed
- [x] `POST /translate` endpoint
- [x] Unit tests: same-language skip, cache hit, provider fallback, both-providers-fail error
- [x] Ran `pytest` and `ruff check` locally, both clean

## Stage 3: Speech to Text
- [x] `faster-whisper` wrapper, model loaded once at startup
- [x] Single audio pass producing both the original-language transcript and an English translation
- [x] `POST /transcribe` endpoint with a file size cap
- [ ] Real audio sample tests (Urdu, English, Roman Urdu, background noise), currently untested against actual audio, only unit-testable code paths are covered so far
- [ ] Latency benchmark on the target deployment hardware

## Stage 4: Intent Parsing, Tiers 1 and 2
- [x] Rule-based matcher for core intents (search, order status, create listing, negotiate price, complaint)
- [x] Single-shot LLM classifier with structured JSON output and a `requires_multi_step` flag
- [x] Escalation router (rules first, then LLM)
- [x] Unit tests for tier 1 matching and entity extraction
- [ ] Regression test set of real sample phrases per intent, including Roman Urdu and code-switched examples
- [ ] Tune the confidence threshold against real traffic once there is any

## Stage 5: Intent Parsing, Tier 3 Agent
- [x] Bounded loop scaffolding (step cap, timeout, whitelisted tool registry)
- [ ] Actual planning logic (the loop currently just enforces limits, it doesn't reason yet)
- [ ] Wire `search_listings` and `contact_seller` tools to real Node backend endpoints, once those exist
- [ ] Shadow-mode evaluation before trusting tier 3 output unsupervised

## Stage 6: Local Dev and CI
- [x] `docker-compose.yml` for Redis, LibreTranslate, and optional Ollama
- [x] `Dockerfile` for the service
- [x] GitHub Actions workflow, lint and test on every PR touching `ai-pipeline/`
- [x] README with full setup instructions from a clean clone

## Stage 7: Production Hardening (not started)
- [ ] Structured logging and tracing across the pipeline
- [ ] Usage tracking against the Azure free-tier cap, with a preemptive switch to LibreTranslate
- [ ] Circuit breaker on the Node side when this service is unreachable
- [ ] Load testing the Whisper path under realistic concurrency
- [ ] Deploy to Railway, configure production environment variables

## Stage 8: Integration with the Node backend (blocked on their schema)
- [ ] Coordinate with the backend branch once its auth and DB schema are merged
- [ ] Add Supabase migrations for `chat_messages`, `voice_notes`, and `translation_cache` (this service currently uses its own Redis cache, a persistent table may be worth adding for audit/history purposes)
- [ ] Confirm the final request and response contract with whoever owns the Node side, then lock `docs/api_contract.md` as v1
