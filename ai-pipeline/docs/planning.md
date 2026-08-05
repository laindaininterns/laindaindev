# Detailed Execution Plan

## Project philosophy and rules for this service

- **Free by default.** Every provider used here has a free tier or is fully self-hosted. If a paid provider is ever introduced, it should be an explicit, discussed decision, not a default.
- **Never block on translation or voice processing.** A failure in this service should degrade the user's experience (original text shown, a retry prompt), it should never fail the underlying chat message, order, or listing operation.
- **Escalate tiers, don't default to the expensive one.** Rule matching before an LLM call, an LLM call before an agent loop. This keeps latency and cost down for the majority of traffic that doesn't need heavy reasoning.
- **English-only for command understanding.** Translate first, then parse intent. Don't build bilingual command logic.
- **Confirm before executing anything irreversible.** Any parsed intent that would create a listing, place an order, or send a message on the user's behalf should come back with `requires_confirmation` set when confidence is low, rather than being executed blind. The actual confirmation UX is the frontend team's call, this service's job is just to surface the signal honestly.
- **Deviating from the stated Node monolith architecture is acknowledged, not hidden.** This is a separate Python service because Whisper and LibreTranslate need Python. See the README for the full reasoning. If the team wants this folded in differently later, that's a fair conversation to have.

## Phase breakdown

### Phase 1: Service scaffolding and translation layer
- FastAPI app with a health check and shared-secret auth on every route.
- Translation provider abstraction: Azure primary, LibreTranslate fallback, Redis cache.
- Unicode-based Urdu detection, no API call needed for the common case.
- Docker Compose for local dev (Redis, LibreTranslate, optional Ollama).
- Unit tests for translation fallback behavior and language detection.

### Phase 2: Speech to text
- Self-hosted Whisper (`faster-whisper`), warmed up at process start.
- `/transcribe` endpoint: original-language transcript plus an English translation in the same pass.
- Voice note length cap to keep CPU load predictable.

### Phase 3: Intent parsing, tiers 1 and 2
- Rule-based matcher for the core marketplace intents (search, order status, create listing, negotiate price, complaint).
- Single-shot LLM classification for anything the rules don't confidently match, with a `requires_multi_step` flag as the escalation signal.
- Regression test set of real sample phrases per intent, including Roman Urdu and code-switched examples, to catch accuracy drift over time.

### Phase 4: Intent parsing, tier 3 agent
- Bounded agent loop (step cap, timeout) for compound requests.
- Whitelisted tool registry, wired up to real Node backend endpoints once they exist (currently stubbed, see `app/services/intent/tier3_agent.py`).
- Shadow-mode evaluation before this tier is trusted to run against real traffic unsupervised: log its decisions against tier 2's, don't act on tier 3 output until the divergence is reviewed and acceptable.

### Phase 5: Production hardening
- Circuit breaker behavior on the Node side when this service is unreachable (Node backend's responsibility, tracked here since it affects this service's contract).
- Observability: structured logs per pipeline stage, cache hit rate, per-tier usage split, latency against the budget in `docs/system_architecture.md`.
- Usage tracking against the Azure free-tier cap, with an automatic switch to LibreTranslate before the cap is hit rather than after a failed request.
- Load testing the Whisper path under realistic concurrency.

## Where things currently stand

Phases 1 through 3 are scaffolded with working code and passing tests. Phase 4's agent loop is stubbed but not implemented. Phase 5 hasn't been started. See `docs/checklist.md` for the granular, up to date task list.
