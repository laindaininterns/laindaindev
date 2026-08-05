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
- [x] `faster-whisper` wrapper, model loaded once at startup, imported lazily so the rest of the test suite doesn't need it installed
- [x] Single audio pass producing both the original-language transcript and an English translation
- [x] `POST /transcribe` endpoint with a file size cap
- [ ] Real audio sample tests (Urdu, English, Roman Urdu, background noise). Tooling for this now exists (`/dev/voice-tester`, `scripts/test_voice_pipeline.py`, `tests/integration/test_real_pipeline.py`), but no actual recordings have been captured yet, see `tests/fixtures/audio/README.md`
- [ ] Latency benchmark on the target deployment hardware

## Stage 4: Intent Parsing, Tiers 1 and 2
- [x] Rule-based matcher for core intents (search, order status, create listing, negotiate price, complaint)
- [x] Single-shot LLM classifier with structured JSON output and a `requires_multi_step` flag
- [x] Escalation router (rules first, then LLM)
- [x] Unit tests for tier 1, tier 2, and the router's escalation logic
- [ ] Regression test set of real sample phrases per intent, including Roman Urdu and code-switched examples, once real recordings exist
- [ ] Tune the confidence threshold against real traffic once there is any

## Stage 5: Intent Parsing, Tier 3 Agent
- [x] Bounded loop scaffolding (step cap, timeout, whitelisted tool registry)
- [x] Real planning loop: the model proposes a tool call or finishes, each turn is strict JSON, never freeform text
- [x] Unit tests covering finishing immediately, calling a tool then finishing, hitting the step limit, an unknown tool name, and an LLM failure
- [x] `search_listings` and `contact_seller` tools call a real backend (`mock-backend`'s fixture data) instead of returning nothing, see Stage 5b
- [ ] Swap `BACKEND_BASE_URL` to the real Node backend once its search and messaging endpoints exist, matching the contract in `docs/api_contract.md`
- [ ] Shadow-mode evaluation before trusting tier 3 output unsupervised, against real compound requests once there's real traffic

## Stage 5b: Mock Backend (stand-in for the Node backend's not-yet-built endpoints)
- [x] `mock_backend/`, a small FastAPI app with fixed, deterministic fixture data (`mock_backend/fixtures.py`)
- [x] `POST /internal/search-listings` and `POST /internal/contact-seller`, matching the contract documented in `docs/api_contract.md`
- [x] Unit tests for the mock backend itself (`tests/test_mock_backend.py`): keyword search, price filtering, empty results, known and unknown sellers
- [x] Unit tests proving the agent's tools call it correctly and parse the response (`tests/test_tier3_tools.py`), routed in-process via `httpx.ASGITransport`, no real network needed
- [x] `docker-compose.yml` service, `mock-backend` on port 8001
- [x] Documented explicitly in the README that this is dev-only and must never be pointed at from production

## Stage 6: Local Dev, Testing Tools, and CI
- [x] `docker-compose.yml` for Redis, LibreTranslate, mock-backend, and optional Ollama
- [x] `Dockerfile` for the service
- [x] GitHub Actions workflow, lint and test on every PR touching `ai-pipeline/`, integration tests excluded (`-m "not integration"`) since CI has neither a downloaded model nor real audio
- [x] README with full setup instructions from a clean clone
- [x] `/dev/voice-tester`, a browser page (mic recording, dev environment only) that chains through transcribe, translate, and parse-intent so you can test with your own voice
- [x] `scripts/test_voice_pipeline.py`, a CLI harness for the same chain against a saved recording, with `--save` to capture it as a regression fixture
- [x] `tests/integration/test_real_pipeline.py`, runs against whatever real fixtures exist in `tests/fixtures/audio`, skips cleanly when there are none

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
