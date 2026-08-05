# Lain Dain AI Pipeline

This service handles the bilingual (Urdu and English) parts of the marketplace: translating buyer and seller chat messages, transcribing voice notes, and turning a voice note into a structured command the backend can act on. It runs as its own process, separate from the main Node backend, and is called over a small internal HTTP API.

Everything in here is built to run on free tiers or fully self-hosted, on purpose, so there is no billing risk tied to this service. See "Cost model" below for what that actually means in practice.

If you are picking this up after Zuraiz has left the project, this file plus `docs/` should be enough to get the whole thing running again from a clean machine. If something here is wrong or missing, that's a bug in this README, please fix it rather than work around it.

## Why this is a separate service, not part of the Node monolith

The team's stated architecture (see the `mohsin/backend-setup` branch, `docs/planning.md`) is a modular monolith: one Node/TypeScript/Express app. This service breaks that rule on purpose, because the speech-to-text model (Whisper) and the self-hosted translation fallback (LibreTranslate) are Python tools with no good Node equivalent. Rather than quietly work around the rule, it's called out here explicitly. If the team decides this should be folded into the monolith some other way, that's a reasonable call to make, just make it deliberately rather than by accident.

The integration point is a small, versioned HTTP API (see `docs/api_contract.md`), so the two codebases stay decoupled. The Node side doesn't need to know Python, and this service doesn't need to know anything about the Node app's internals.

## Architecture overview

Three things this service does, each described in more detail in `docs/system_architecture.md`:

1. **Translation.** Chat messages get translated between Urdu and English on send, using Azure Translator as the primary provider (free tier, 2 million characters a month) and a self-hosted LibreTranslate container as an automatic fallback if Azure errors out or its quota runs low. Results are cached in Redis so repeated phrases never hit a provider twice.
2. **Speech to text.** Voice notes are transcribed with a self-hosted Whisper model (`faster-whisper`), which also detects the spoken language and can translate straight to English in the same pass.
3. **Intent parsing.** The English text (from a translated message or a transcribed voice note) is turned into a structured command through three escalating tiers: fast rule matching, then a single-shot LLM classification, then a bounded, tool-scoped agent for genuinely multi-step requests. Most traffic never needs to leave tier one.

## Cost model

Nothing in this service should ever generate a bill on its own:

- Translation and the LLM tiers use free-tier or self-hosted providers only, with a hard fallback to self-hosted options if a free tier is ever exhausted.
- Speech to text runs entirely on your own compute (Whisper, self-hosted), there is no per-call charge from a vendor.
- The one thing that does cost money is wherever this gets deployed (a Railway service, a VM, etc.), which is infrastructure the company already pays for regardless of this feature.

If a future teammate wants to swap in a paid provider for better quality, that's a config change (see `.env.example`), not a rewrite. The translation and LLM calls are both behind a single abstraction layer for exactly this reason.

## Prerequisites

- Docker and Docker Compose (this is the recommended way to run everything locally, it starts Redis and LibreTranslate for you)
- Python 3.11 or newer, only needed if you want to run the service outside Docker
- Access to the company's GitHub org and this repo
- An Azure Translator resource under the company account, if you want the higher-quality primary translation path. The service still works without it, it just falls back to LibreTranslate for every request.

## Getting started with Docker (recommended)

```
git clone https://github.com/laindaininterns/laindaindev.git
cd laindaindev/ai-pipeline
cp .env.example .env
```

Open `.env` and fill in `SERVICE_API_KEY` (generate one with `openssl rand -hex 32`) and, if you have them, the Azure Translator credentials. Everything else has a working default for local development.

```
docker compose up --build
```

This starts four containers: the service itself on port 8000, Redis on 6379, LibreTranslate on 5000, and `mock-backend` on 8001, a small fixture-data stand-in for the Node backend's not-yet-built endpoints (see "Why mock-backend exists" below). First boot downloads the Whisper model and the LibreTranslate language models, so it can take a few minutes. Once it's up:

```
curl http://localhost:8000/health
```

should return `{"status": "ok", "environment": "development"}`.

The tier 2 intent model (Ollama) is not started by default, since it's a large download most people won't need for basic testing. Bring it up with:

```
docker compose --profile llm up
```

then pull a model into it once, from another terminal:

```
docker compose exec ollama ollama pull qwen2.5:7b-instruct
```

## Getting started without Docker

Only do this if you have a specific reason not to use Docker, it's more setup for no real benefit otherwise.

```
cd ai-pipeline
python -m venv .venv
.venv\Scripts\activate        # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env
```

You'll need Redis and LibreTranslate running somewhere reachable (locally installed, or point `.env` at hosted instances). Then:

```
uvicorn app.main:app --reload
```

## Why mock-backend exists

There are no real buyers, sellers, or listings on the platform yet, and the Node backend doesn't have search or messaging endpoints built either. Without something to stand in for that, a voice command like "find me a bike under 20,000" would transcribe fine, get classified fine, and then hit silence: the tier 3 agent's tools would have nothing real to call, so there'd be no way to tell whether the whole pipeline actually works end to end, only whether the understanding part does.

`mock_backend/` is a small FastAPI app with fixed, deterministic fake data (a handful of listings and sellers, see `mock_backend/fixtures.py`) implementing the exact contract documented in `docs/api_contract.md` under "Tool contract this service expects from the Node backend". The agent's tools call `BACKEND_BASE_URL`, which points at `mock-backend` in dev. This means you can say "find me a bike under 20,000" for real, get a real (if fake) matching listing back, and check that against a known correct answer, proving the full path works. When the real Node backend gets these endpoints, changing `BACKEND_BASE_URL` to point at it is the only change needed, both sides just need to keep matching the documented contract.

## Testing with your own voice

Two ways to run real audio through the pipeline once the service is up (Docker or not):

**In the browser**, with `ENVIRONMENT=development` (the default), open `http://localhost:8000/dev/voice-tester`. Paste in your `SERVICE_API_KEY`, hit record, say something, hit stop. It chains through `/transcribe`, `/translate`, and `/parse-intent` and shows you all three results with timing. This route only exists in development, it's not mounted when `ENVIRONMENT=production`.

**From the terminal**, with a saved recording:

```
python scripts/test_voice_pipeline.py path/to/recording.wav --service-key <your key>
```

Add `--save some_case_name` to keep a recording that's worth turning into a regression test, it copies the file into `tests/fixtures/audio/` alongside a `.expected.json` capturing what the pipeline returned. Review that file before committing it, since it becomes the expected answer for future runs, see `tests/fixtures/audio/README.md` for the full workflow and naming convention.

## Running tests and lint before committing anything

```
pytest tests/ -v -m "not integration"
ruff check app tests scripts
```

The `integration` marker covers tests that need a downloaded Whisper model and real audio fixtures, neither of which CI has, so CI runs with `-m "not integration"` too (see `.github/workflows/ai-pipeline-ci.yml`). Once you've saved some fixtures with the CLI harness above, run them locally with:

```
pytest -m integration
```

Both the standard suite and lint run automatically in CI on any pull request that touches `ai-pipeline/`. A PR shouldn't be opened with either failing.

## Environment variables

Every variable the service reads is listed with a comment in `.env.example`. A few worth calling out:

- `SERVICE_API_KEY` is the shared secret the Node backend must send as the `X-Service-Key` header on every request. Generate a real one for each environment, never reuse the placeholder.
- In production (Railway), these are set directly in the service's Variables tab, not committed anywhere. The `.env` file is only ever for local development and is gitignored at the repo root.

## API surface

Three endpoints, all requiring the `X-Service-Key` header:

- `POST /translate`
- `POST /transcribe`
- `POST /parse-intent`

Full request and response shapes are in `docs/api_contract.md` and in `app/models/schemas.py`, which is the actual source of truth since it's what the code enforces.

## Folder structure

```
ai-pipeline/
  app/
    api/           request handlers, auth dependency, and dev-only routes
    services/       translation, speech to text, and the three intent tiers
    models/         request and response schemas
    utils/          small helpers (language detection)
    static/          the /dev/voice-tester page
    config.py        all environment variables, read once
    main.py          FastAPI app entrypoint
  mock_backend/     dev-only stand-in for the Node backend's not-yet-built endpoints
  tests/            pytest suite, plus tests/integration and tests/fixtures/audio
  scripts/          test_voice_pipeline.py, the CLI voice testing harness
  docker/           Dockerfile for the service
  docker-compose.yml  local dev stack (Redis, LibreTranslate, mock-backend, optional Ollama)
  docs/             architecture, planning, and API contract docs
```

## Deploying (Railway)

1. In Railway, add a new service from this GitHub repo, pointing at the branch that's ready to ship (after it's merged, not from a personal feature branch).
2. Set the service's root directory to `ai-pipeline` and its Dockerfile path to `docker/Dockerfile`.
3. Copy every variable from `.env.example` into the service's Variables tab with real values. Generate a fresh `SERVICE_API_KEY` for production, don't reuse the local dev one.
4. Redis and LibreTranslate need their own Railway services (or another host), pointed at by `REDIS_URL` and `LIBRETRANSLATE_URL`. They're cheap to self-host and covered by the same free-tier reasoning as local dev.
5. Set `BACKEND_BASE_URL` to the real Node backend's internal API URL, not `mock-backend`. `mock-backend` is dev-only fixture data, it should never be deployed or pointed at in production, see "Why mock-backend exists" above.
6. Give the Node backend the production `SERVICE_API_KEY` and this service's URL so it can call it.

## Known limitations, for whoever picks this up next

- The tier 3 agent (`app/services/intent/tier3_agent.py`) has a real planning loop (propose a tool call or finish, strict JSON each turn, bounded by step count and a timeout), and its tools call a real backend (`mock-backend`'s fixture data, see "Why mock-backend exists" above). What's still missing is the real Node backend itself, `mock-backend` needs swapping out for it once those endpoints exist there, which is a one-line config change, not a rewrite.
- No real audio has been tested yet, only mocked STT and real-but-fake backend calls. The tooling to do this exists (`/dev/voice-tester`, `scripts/test_voice_pipeline.py`, the `integration` test marker), it just hasn't been exercised with real recordings and turned into a fixture set. That's the next concrete step, not a someday item.
- Roman Urdu detection (`looks_like_roman_urdu` in `app/utils/lang_detect.py`) is a keyword heuristic, not a real classifier. It's a known weak spot, worth deliberately over-representing in the fixture set once real recordings start getting added.
- No load testing has been done yet. The Whisper model runs on CPU by default, which is fine for occasional voice notes but will need attention if usage grows.

## Questions

Everything that isn't obvious from this README should be in `docs/`. If it genuinely isn't written down anywhere, that's worth fixing rather than routing around.
