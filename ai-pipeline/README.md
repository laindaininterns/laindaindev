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

This starts three containers: the service itself on port 8000, Redis on 6379, and LibreTranslate on 5000. First boot downloads the Whisper model and the LibreTranslate language models, so it can take a few minutes. Once it's up:

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

## Running tests and lint before committing anything

```
pytest tests/ -v
ruff check app tests
```

Both are also run automatically in CI on any pull request that touches `ai-pipeline/`, see `.github/workflows/ai-pipeline-ci.yml`. A PR shouldn't be opened with either of these failing.

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
    api/           request handlers and auth dependency
    services/       translation, speech to text, and the three intent tiers
    models/         request and response schemas
    utils/          small helpers (language detection)
    config.py        all environment variables, read once
    main.py          FastAPI app entrypoint
  tests/            pytest suite
  docker/           Dockerfile for the service
  docker-compose.yml  local dev stack (Redis, LibreTranslate, optional Ollama)
  docs/             architecture, planning, and API contract docs
```

## Deploying (Railway)

1. In Railway, add a new service from this GitHub repo, pointing at the branch that's ready to ship (after it's merged, not from a personal feature branch).
2. Set the service's root directory to `ai-pipeline` and its Dockerfile path to `docker/Dockerfile`.
3. Copy every variable from `.env.example` into the service's Variables tab with real values. Generate a fresh `SERVICE_API_KEY` for production, don't reuse the local dev one.
4. Redis and LibreTranslate need their own Railway services (or another host), pointed at by `REDIS_URL` and `LIBRETRANSLATE_URL`. They're cheap to self-host and covered by the same free-tier reasoning as local dev.
5. Give the Node backend the production `SERVICE_API_KEY` and this service's URL so it can call it.

## Known limitations, for whoever picks this up next

- The tier 3 agent (`app/services/intent/tier3_agent.py`) is scaffolded but its actual planning loop isn't implemented yet, it currently just enforces the step and timeout limits. See the `TODO` comments in that file.
- The agent's tools (`search_listings`, `contact_seller`) are stubs. They need to be wired up to real endpoints on the Node backend once those exist.
- Roman Urdu detection (`looks_like_roman_urdu` in `app/utils/lang_detect.py`) is a keyword heuristic, not a real classifier. It's a known weak spot, see `docs/planning.md` for the reasoning.
- No load testing has been done yet. The Whisper model runs on CPU by default, which is fine for occasional voice notes but will need attention if usage grows.

## Questions

Everything that isn't obvious from this README should be in `docs/`. If it genuinely isn't written down anywhere, that's worth fixing rather than routing around.
