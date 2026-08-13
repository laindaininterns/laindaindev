# VOICEASSISTANT.md
### LainDain (Land10) — Voice-Enabled Chatbot + Floating Voice Guide ("Rahi") Build

**Repo:** laindaininterns/laindaindev
**Live:** https://laindainstore.vercel.app/
**Branch:** `akif/voiceassistant`
**Depends on:** `ERRORCHECKS.md` (security floor — must not be reintroduced/broken) and `CHATBOTDEVELOPEMENT.md` (Laila's existing architecture — this build extends it, does not replace it)

---

## 0. Git Workflow — read before starting anything

You are currently on `akif/admin-dashboard` with dashboard work in progress and `main` has moved ahead (chatbot + security fixes merged). Do this exactly, in order:

```bash
# 1. Bring akif/admin-dashboard up to date with latest main
git checkout akif/admin-dashboard
git pull origin akif/admin-dashboard
git fetch origin
git merge origin/main
# resolve any conflicts, re-run the app locally, confirm dashboards + existing
# chatbot + security fixes all still work together
git push origin akif/admin-dashboard

# 2. Cut the new working branch from that fully-merged state
git checkout -b akif/voiceassistant
git push -u origin akif/voiceassistant
```

From this point, **all voice-feature work happens only on `akif/voiceassistant`.** Do not touch `akif/admin-dashboard` or `main` again until this branch is fully built, tested, and signed off.

Rules carried over from `CHATBOTDEVELOPEMENT.md` (unchanged, apply here too):
- One task = one commit. Task IDs (`BE-VA-01`, `FE-VA-01`, etc.) map 1:1 to commits.
- Frontend work only inside `client/`. Backend work only inside `server/`. No changes outside those plus `.env.example` and this file.
- Loop per task: **Build → Manual test → Security self-check (Section 9) → Commit.**
- Commit format:
  `feat(BE-VA-02): add whisper STT proxy route with rate limiting`
  `feat(FE-VA-05): add floating draggable Rahi avatar with idle animation`
- Do not modify existing components (`ChatWidget.jsx`, `App.jsx` layout, `marketplaceData.js` structure, design tokens, Laila's existing text-chat code path) beyond the minimal integration points explicitly listed in Sections 5–7. **This is additive on top of an already-shipped feature — Laila's existing text chat must work identically, untouched, if voice is disabled or fails.**
- Merge path when fully done: `akif/voiceassistant` → `akif/admin-dashboard` (or directly to `dev` if dashboards have already merged separately — confirm with Akif at that time) → regression pass → `main`. Do not merge with any unchecked box in Section 9.

---

## 1. What We're Building — Two Distinct Features

This branch delivers **two separate voice surfaces** that must stay architecturally independent (separate API keys, separate rate limits, separate failure domains) even though they share some plumbing:

### Feature A — Voice I/O added to the existing Laila chat widget
The chat panel that already exists (`ChatWidget.jsx` from `CHATBOTDEVELOPEMENT.md`) gets a microphone button next to the text input. User can speak instead of type; Laila's reply can optionally be read aloud. This is Laila's existing brain (Groq text model, existing `knowledgeBase.js`, existing scope-lock system prompt) — we are only adding ears and a mouth to it. No change to Laila's reasoning, refusal template, or navigation-action logic.

### Feature B — "Rahi": a floating, draggable, voice-first guide character
A new, separate on-screen character — a small 3D-style delivery-person figure (see Section 8 for the icon brief) that:
- Is **draggable/movable** by the user anywhere on the viewport (persists position for the session, like a picture-in-picture widget).
- **Greets new visitors by voice** on first visit only, with a 1–2 line bilingual-aware intro to LainDain (never on repeat visits or for a signed-in/returning user — see Section 6.4 for exact "is this a new visitor" logic).
- Runs a **full spoken conversation loop**: listens → understands intent (browse category / compare products / get a recommendation / go to a specific product) → speaks a short, summarized answer → **navigates the actual page underneath it** (category filter, product detail modal, etc.) while it talks, so the user sees the page change in sync with what Rahi is saying.
- **Barge-in support**: if the user starts speaking while Rahi is talking, Rahi stops immediately and listens (no talking over the user).
- Is a **guide/decision-assistant**, not a search box — e.g. user says "I want to buy cement," Rahi doesn't just search; it offers to either (a) list the cement suppliers/categories with a short spoken comparison angle (price / rating / verified status), or (b) ask a clarifying question, and only navigates to a product detail page once the user confirms a specific choice.

Both features are **bilingual (English + Urdu, including Roman Urdu)**, detect the user's spoken language automatically, and reply in the same language/script family the user used — consistent with Laila's existing language-mirroring rule in `CHATBOTDEVELOPEMENT.md` §5.

### Non-Goals (explicitly out of scope for this branch)
- No voice-based checkout, payment, or account changes (same hard boundary as Laila's text chat).
- No storing raw audio server-side beyond the transient buffer needed to transcribe a single utterance. Audio is never persisted to disk or DB.
- No custom-trained voice/wake-word model in v1 — use existing free/low-cost STT/TTS APIs (Section 4).
- No always-listening/"hey Rahi" wake word in v1 — activation is an explicit tap on the mic/avatar (always-on mic raises privacy and cost concerns; revisit as a v2 task only after this ships and is stable).
- Rahi does not replace Laila's existing text widget — both exist side by side; a user can use either.

---

## 2. Architecture Overview

```
Browser (client/)
  ┌─────────────────────────────┐        ┌───────────────────────────────────┐
  │ Feature A: ChatWidget (existing)      │ Feature B: RahiAssistant (new)     │
  │  + new mic button + optional TTS      │  floating draggable avatar         │
  │  useChatVoice.js (new hook)           │  useRahiVoice.js (new hook)        │
  └───────────────┬───────────────┘        └───────────────┬─────────────────┘
                  │ POST /api/chatbot/message                │ POST /api/rahi/message
                  │ (existing, unchanged)                    │ (new, separate route)
                  ▼                                          ▼
        chatbotController.js (existing)          rahiController.js (new)
        chatbotService.js (existing, Groq #1)    rahiService.js (new, Groq #2 or
                                                   alternate model — separate key)
                  │                                          │
                  └──────────────┬───────────────────────────┘
                                 ▼
                   knowledgeBaseService.js (shared, refreshed)
                     - live category list
                     - live product catalog summary (capped fields, same
                       over-fetch discipline as BE-20)
                     - stock/availability flags
                     - pulled fresh from Supabase at the START of every new
                       voice/chat session, not cached indefinitely (Section 6)

  STT (speech → text)                         TTS (text → speech)
  ┌───────────────────────────┐               ┌───────────────────────────┐
  │ Primary: browser Web Speech│               │ Primary: browser           │
  │ Recognition API (free,     │               │ SpeechSynthesis API (free, │
  │ client-side, no server hop)│               │ client-side, no server hop)│
  │                             │               │                             │
  │ Fallback (when browser STT │               │ Fallback (needed for       │
  │ unsupported/unreliable,    │               │ reliable Urdu voice        │
  │ e.g. Urdu accuracy, Safari)│               │ quality — browser Urdu     │
  │ → POST /api/voice/transcribe│              │ voices are inconsistent)   │
  │   → Groq Whisper            │               │ → POST /api/voice/speak    │
  │   (whisper-large-v3, free   │               │   → cloud TTS provider     │
  │   tier via GROQ_API_KEY_STT)│               │   (Section 4, separate key)│
  └───────────────┬─────────────┘               └───────────────┬────────────┘
                  ▼                                              ▼
          server/src/routes/voiceRoutes.js (new, shared by both features,
          rate-limited independently of the chat/rahi message routes)
```

**Key architectural decisions**

1. **Client never talks to any STT/TTS/LLM provider directly.** Every server call is proxied through `server/`, exactly like Laila's existing pattern (`FE-18`/`BE-02` discipline from `ERRORCHECKS.md`). No key of any kind ever ships in the client bundle.
2. **Two separate LLM credentials, on purpose:**
   - `GROQ_API_KEY` (existing) + `GROQ_MODEL` → keeps powering **Laila's existing text chat**, untouched.
   - `GROQ_API_KEY_RAHI` (new, separate Groq project/key) + `RAHI_MODEL` → powers **Rahi's** conversational reasoning.
   - Reasoning: separate keys mean separate rate limits/quotas, separate cost tracking, and if one gets throttled or revoked the other feature keeps working. Also lets you swap Rahi to a different provider later without touching Laila's code path at all.
3. **STT/TTS keys are also separate from both chat keys** (`Section 4`) — a transcription/speech outage should never take down text-based Laila chat, and vice versa.
4. **Browser-native APIs are the default, cloud APIs are the fallback.** This keeps cost near-zero for the common case and only spends API quota when the browser can't do the job itself (older Safari, poor Urdu recognition, etc.).
5. **Context freshness**: both features pull a fresh knowledge-base snapshot from Supabase at the start of each session (not per-message — that would be wasteful) and also silently re-check for material changes (new/removed product, out-of-stock flip) every few turns within a long session. See Section 6.

---

## 3. Naming & Persona

Proposed name: **"Rahi"** (راہی — Urdu/Urdu-Persian for "traveler / guide / one who accompanies you on the way"). It's short, easy to say in both English and Urdu, gender-neutral-leaning, and semantically fits a delivery/guide character without borrowing a generic "bot" name.

- Full label in UI: **"Rahi — your LainDain guide"**
- Laila stays Laila (text-first FAQ/product assistant). Rahi is voice-first and page-navigating. Keeping the names distinct avoids user confusion about which one does what — surface this distinction gently in Rahi's own greeting ("I'm Rahi, I can guide you by voice — Laila's still here in the chat bubble if you'd rather type.").
- Confirm the final name with Akif/co-founder before locking it into copy, TTS prompts, and the icon (Section 8) — treat as a placeholder pending sign-off, same as any other product-facing copy decision.

---

## 4. Free / Low-Cost API Options (STT & TTS) — pick and lock before Section 5 tasks start

| Layer | Primary (free, no key) | Fallback (free-tier key) | Notes |
|---|---|---|---|
| **STT (speech→text)** | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) — runs in Chrome/Edge/most Android browsers, zero server cost | **Groq Whisper** (`whisper-large-v3` or `whisper-large-v3-turbo`) via `GROQ_API_KEY_STT` — Groq's free/low-cost tier, already integrated pattern from Laila | Web Speech API has weak/no Urdu support on some platforms and no support at all in Safari/iOS — Whisper fallback is what makes Urdu voice input actually reliable. Whisper also gives us language auto-detection for free. |
| **TTS (text→speech)** | Browser `SpeechSynthesis` API — zero cost, but Urdu voice availability/quality is inconsistent across OS/browser | Cloud TTS with confirmed Urdu voices — evaluate at implementation time between: (a) **ElevenLabs free tier** (multilingual voices, generous enough free monthly character quota for MVP traffic), (b) **Microsoft Azure Speech free tier** (has explicit `ur-PK` Urdu-Pakistan voices, good fit), (c) **Google Cloud TTS free tier** (has Urdu `ur-IN`, close enough) | Decision point for Akif: pick ONE fallback provider before `BE-VA-04` starts, based on actual Urdu voice quality tested live — don't build both. Document the choice + the exact voice ID used in `server/.env.example`. |

**Language detection strategy**: Whisper's response includes a detected language code — use that as the source of truth for "was this English or Urdu" rather than trying to sniff it from transcribed text. For browser-native STT, pass the recognizer a `lang` hint based on the user's last-used language (stored client-side) and let them toggle it manually if wrong.

**Cost control, both layers**: same discipline as `BE-CHAT-04` — cap utterance length server-side (reject audio blobs over a sane duration/size before sending to Whisper), cap TTS text length per reply (Rahi's replies are supposed to be short summaries anyway, Section 6.3), and rate-limit every voice route independently.

---

## 5. Environment Variables (new, additive to existing `.env.example`)

```env
# --- Existing (Laila text chat) — do not touch ---
GROQ_API_KEY=<existing>
GROQ_MODEL=<existing>

# --- New: Rahi's own model/key (separate quota) ---
GROQ_API_KEY_RAHI=<new, separate Groq key/project>
RAHI_MODEL=<pick current Groq model at build time — verify at console.groq.com/docs/models>
RAHI_MAX_TOKENS=250
RAHI_RATE_LIMIT_PER_MIN=15

# --- New: STT (shared by both voice surfaces) ---
GROQ_API_KEY_STT=<new, separate Groq key/project — keeps STT quota isolated from both chat models>
STT_MODEL=whisper-large-v3-turbo
STT_MAX_AUDIO_SECONDS=20
STT_RATE_LIMIT_PER_MIN=20

# --- New: TTS fallback provider (pick ONE per Section 4 decision) ---
TTS_PROVIDER=azure   # or elevenlabs / google — whichever gets picked
TTS_API_KEY=<new, separate key for the chosen provider>
TTS_VOICE_ID_EN=<confirmed English voice id>
TTS_VOICE_ID_UR=<confirmed Urdu voice id>
TTS_RATE_LIMIT_PER_MIN=20
TTS_MAX_CHARS=350
```

Every new key is **separate from every existing key** — this is intentional (Section 2, point 2/3). Document each in `server/.env.example` with placeholder values only, same as `CHATBOTDEVELOPEMENT.md` §3 already established. Never commit real values.

---

## 6. Shared Knowledge & Context Freshness

### 6.1 Reuse, don't duplicate
Both Feature A and Feature B read from the **same** `knowledgeBase.js` / `getCatalogSummary()` groundwork already specified in `CHATBOTDEVELOPEMENT.md` §4. Do not fork a second copy of category/product data logic.

### 6.2 New: a lightweight refresh layer
- `server/src/services/knowledgeRefreshService.js` (new) wraps the existing `getCatalogSummary()` with a short-lived in-memory cache (e.g. 60–120 seconds TTL) so a burst of voice turns in one conversation doesn't hammer Supabase on every single utterance, while still staying close to real-time for stock/price/category changes.
- Optional (only if Akif wants it, flag as a stretch task): a small `assistant_context_snapshot` table that a scheduled job or product-CRUD hook updates whenever a product/category changes, so the assistant reads a pre-computed summary instead of recomputing on the fly. Start with the simple in-memory TTL cache first; only build this table if the simple version proves too slow/expensive in testing.
- **No PII, no internal fields** (seller_id, stock internals, admin data) ever enter this layer or get sent to any model — same rule as `CHATBOTDEVELOPEMENT.md` §4, cross-checked against `BE-20`.

### 6.3 Reply shape (Rahi-specific)
Rahi's replies must stay short enough to sound natural spoken aloud AND drive navigation. Extend the same structured-JSON contract pattern Laila already uses:
```json
{
  "reply": "string — short, spoken-style, 1-3 sentences max",
  "language": "en | ur",
  "suggested_actions": [
    { "type": "navigate_category", "category": "Paints & Chemicals" }
  ],
  "comparison_mode": false,
  "quick_replies": ["Show me the cheapest", "Compare by rating instead"]
}
```
Same validation discipline as `CHATBOTDEVELOPEMENT.md` §5 BE-CHAT-02 point 6 — malformed output never reaches the client raw; a generic spoken fallback plays instead ("Sorry, could you say that again?").

### 6.4 "New visitor" greeting logic (exact rule, implement precisely)
- Trigger the one-time spoken greeting **only** when both are true: (a) no existing auth session/token for this browser (i.e., not a signed-in returning user), **and** (b) no `rahi_greeted` flag present in `sessionStorage` (and optionally a longer-lived `localStorage` flag if the intent is "once per device," not "once per tab" — confirm which with Akif before building; default to `localStorage` so a refresh doesn't re-trigger it, but keep it non-sensitive/easily clearable).
- Signed-in users never get the intro greeting, regardless of flags — check auth state first, short-circuit before touching storage flags at all.
- The greeting is spoken automatically (TTS) but Rahi does **not** open the mic automatically afterward — wait for an explicit user tap, consistent with the "no always-listening" non-goal in Section 1.

---

## 7. Task Breakdown

### 7A. Backend — Feature A (voice added to existing Laila chat) `BE-VA-A-xx`

- **BE-VA-A-01** — Add `server/src/routes/voiceRoutes.js` with two endpoints: `POST /api/voice/transcribe` (audio in, text out) and `POST /api/voice/speak` (text in, audio out). Shared by Feature A and B.
- **BE-VA-A-02** — `server/src/controllers/voiceController.js`: validates uploaded audio (max duration/size per `STT_MAX_AUDIO_SECONDS`, allowed mime types only — reject anything else with a clean 400), calls Whisper via `GROQ_API_KEY_STT`, returns `{ text, language }`.
- **BE-VA-A-03** — Same controller: `speak` action validates text length (`TTS_MAX_CHARS`), strips any markdown/HTML before sending to the TTS provider, calls the chosen provider (Section 4) with the correct voice ID for the detected language, streams/returns audio (e.g. `audio/mpeg`) to the client. Never accept raw HTML/script content — this is text that ultimately came from either the user's own transcribed speech or Laila's own generated reply, but treat it as untrusted input regardless.
- **BE-VA-A-04** — Rate limiting: dedicated `voiceLimiter` (per `STT_RATE_LIMIT_PER_MIN` / `TTS_RATE_LIMIT_PER_MIN`), applied only to `/api/voice/*`, independent of the existing `chatbotLimiter`.
- **BE-VA-A-05** — No change to `chatbotController.js`/`chatbotService.js` reasoning logic. The only integration point: the existing `/api/chatbot/message` request/response shape is reused as-is; voice is purely a client-side transcribe-then-send / receive-then-speak wrapper around the existing text endpoint.

### 7B. Frontend — Feature A (voice added to existing Laila chat) `FE-VA-A-xx`

- **FE-VA-A-01** — New hook `client/src/components/chatbot/useChatVoice.js`. Handles: mic permission request, recording (MediaRecorder), silence-detection auto-stop, sending the blob to `/api/voice/transcribe`, and — for output — sending Laila's `reply` text to `/api/voice/speak` (only when the user has voice-output toggled on) and playing the returned audio.
- **FE-VA-A-02** — Add a mic button + a "speaker on/off" toggle to `ChatPanel.jsx` — **this and the hook wiring are the only edits to existing chatbot files**; no changes to `ChatMessage.jsx` rendering logic, no changes to `ChatWidget.jsx`'s core open/close state machine.
- **FE-VA-A-03** — Visual mic states (idle / listening / transcribing / error), matching existing design tokens (`sage` active state, same as every other active/selected control in `design.md`).
- **FE-VA-A-04** — Graceful degradation: if `MediaRecorder`/mic permission is unavailable or denied, the mic button disables itself with a one-line tooltip — text chat keeps working exactly as before, zero regression risk to the shipped feature.
- **FE-VA-A-05** — Respect `prefers-reduced-motion` and existing a11y patterns (`aria-live` region announcing transcription/listening state changes for screen reader users).

### 7C. Backend — Feature B (Rahi, the floating voice guide) `BE-VA-B-xx`

- **BE-VA-B-01** — `server/src/config/groqRahi.js` — second Groq client wrapper, reads `GROQ_API_KEY_RAHI`/`RAHI_MODEL`, mirrors the existing warning-not-crash pattern from `groq.js`/`supabase.js`. Never shares a client instance with Laila's `groq.js`.
- **BE-VA-B-02** — `server/src/services/rahiService.js` — exported `getRahiResponse({ message, history, locale, currentPageContext })`. System prompt (hardcoded server-side) enforces, in priority order:
  1. **Identity**: "You are Rahi, LainDain's voice guide. You help visitors choose categories/products, compare options (price, rating, verified status), and confirm before navigating anywhere. You only know LainDain's real catalog/categories as provided in context."
  2. **Guide behavior, not pure Q&A**: when a request is broad (e.g. "I want cement"), Rahi should either offer a short spoken menu of relevant categories/suppliers, or ask one clarifying question ("Should I summarize all cement suppliers by price and rating, or do you already have one in mind?") — never dump a long list verbally.
  3. **Confirm-before-navigate**: Rahi proposes a `suggested_actions` navigation entry, but the **client only executes it after the user's next affirmative turn** (or an explicit "yes/go there/ٹھیک ہے" style confirmation) — same non-silent-redirect principle as Laila's existing `suggested_actions` pattern in `CHATBOTDEVELOPEMENT.md` §6 FE-CHAT-04, extended here to voice.
  4. **Same fixed-wording refusal template** as Laila for off-topic/prompt-injection attempts (reuse the exact EN/UR strings already defined in `CHATBOTDEVELOPEMENT.md` §5, don't invent new wording — consistency across both assistants matters).
  5. **Brevity for speech**: 1–3 short sentences per turn, since this is read aloud, not read on screen.
  6. **Language mirroring** (EN / UR / Roman Urdu), same rule as Laila.
- **BE-VA-B-03** — `server/src/routes/rahiRoutes.js` → `POST /api/rahi/message`, `server/src/controllers/rahiController.js` — same validation discipline as `chatbotController.js` (max message length, max history turns, clean 400s on malformed input, generic non-leaking error fallback on any provider failure).
- **BE-VA-B-04** — Dedicated `rahiLimiter` (`RAHI_RATE_LIMIT_PER_MIN`), fully independent of both `chatbotLimiter` and `voiceLimiter`.
- **BE-VA-B-05** — Wire the knowledge-refresh layer (Section 6.2) into `rahiService.js` so every new Rahi session starts with a fresh catalog snapshot.
- **BE-VA-B-06** — Register in `server.js`: `app.use('/api/rahi', rahiRoutes); app.use('/api/voice', voiceRoutes);` — these two lines plus the existing chatbot mount line are the **only** edits to `server.js`.

### 7D. Frontend — Feature B (Rahi character) `FE-VA-B-xx`

```
client/src/components/rahi/
  RahiAssistant.jsx        // top-level: owns position, open/listening state
  RahiAvatar.jsx            // the draggable floating figure + idle animation
  RahiSpeechBubble.jsx      // small caption/subtitle bubble showing what's being said (accessibility + noisy-environment fallback)
  RahiListeningIndicator.jsx
  useRahiVoice.js            // mic capture, STT call, TTS playback, barge-in logic
  useRahiConversation.js     // message state, session id, navigation confirm flow
  useDraggable.js             // generic drag/reposition hook (position persisted to sessionStorage)
```
Mirror the existing lazy-loading pattern: `const RahiAssistant = lazy(() => import("./components/rahi/RahiAssistant"))` in `App.jsx`, in the same `<Suspense fallback={null}>` block already used for `ChatWidget`. **This plus the navigation callback wiring is the only edit to `App.jsx`.**

- **FE-VA-B-01** — `RahiAvatar.jsx`: renders the generated icon (Section 8) as a small fixed-position element, draggable via `useDraggable.js` (pointer events, clamps to viewport bounds, persists last position in `sessionStorage` so it doesn't jump around between page navigations within the same session).
- **FE-VA-B-02** — Idle/listening/speaking animation states — subtle (a soft bob/breathing loop at idle, a brighter pulse while listening, a small mouth/sound-wave cue while speaking), respecting `prefers-reduced-motion` exactly like every other animation in the codebase.
- **FE-VA-B-03** — First-visit greeting logic exactly per Section 6.4 — implement as its own small utility (`shouldGreetNewVisitor()`), unit-testable in isolation.
- **FE-VA-B-04** — Tap-to-talk interaction: tap avatar → mic opens → user speaks → on silence-detection or a second tap, recording stops → sent to `/api/voice/transcribe` → transcript sent to `/api/rahi/message` → reply sent to `/api/voice/speak` → audio plays **while** any confirmed `suggested_actions` navigation fires in sync (Section 7D FE-VA-B-06 below covers the sync detail).
- **FE-VA-B-05** — **Barge-in**: while `RahiAvatar` is in "speaking" state, keep a lightweight voice-activity listener running; the instant the user's mic picks up speech, immediately stop TTS playback and switch to "listening." This is the single most important UX requirement in the brief — treat it as a blocking acceptance criterion, not a nice-to-have.
- **FE-VA-B-06** — Navigation sync: when a `suggested_actions` entry is confirmed, call the **same existing state setters** already wired for Laila (`setActiveCategory`, `setSelectedProduct` via `PRODUCTS` lookup) — reuse `App.jsx`'s existing callback plumbing from `CHATBOTDEVELOPEMENT.md` §6 FE-CHAT-04 rather than building a second navigation path. Rahi's spoken summary and the visible page change should feel like one motion — trigger the navigation as soon as the confirmation is received, not only after the audio finishes playing, so the user sees the product/category appear while Rahi is still summarizing it.
- **FE-VA-B-07** — `RahiSpeechBubble.jsx`: always show a small text caption of what Rahi is currently saying/hearing, even though this is voice-first — required for accessibility (deaf/hard-of-hearing users, noisy environments, muted devices) and doubles as a debug aid during testing.
- **FE-VA-B-08** — Close/dismiss control: a small "×" or minimize affordance so a user who doesn't want the assistant can shrink it to a small corner icon without losing the ability to reopen it (never force it to be permanently visible/undismissable — same "user control" principle already established for modals in `landdain-design.md` §7).
- **FE-VA-B-09** — `aria-label`s throughout, `role="dialog"`/`aria-live` for the speech bubble, keyboard-operable drag alternative (arrow keys to nudge position) for users who can't use pointer drag.

---

## 8. Icon Generation Brief — for Antigravity

**Context for Antigravity:** this generates the visual asset for **Rahi**, LainDain's floating voice-guide character. The co-founder's reference image (attached) shows a small, realistic 3D miniature figurine of a man in a green blazer, white shirt, red tie, and brown trousers, standing on a glossy tablet surface with a soft reflection — a "tiny person on your screen" aesthetic. Use that as the stylistic anchor: **realistic 3D-rendered miniature figure, toy/figurine-like material and lighting, not a flat cartoon or emoji.**

**Prompt to give Antigravity:**

> Generate a small, realistic 3D-rendered miniature figurine of a friendly South Asian delivery/courier person, in the exact photographic-miniature style of the reference image (tilt-shift-style realism, soft studio lighting, subtle ground reflection, shallow depth of field). The figure should read clearly as approachable and helpful — a warm, slight smile, open posture, one hand gesturing forward as if pointing the way or presenting something, not a stiff standing pose. Outfit: a clean short-sleeve collared shirt in LainDain's sage-green brand color (#A3C1BF) or a light jacket in that tone, simple dark trousers, comfortable shoes — avoid a full formal suit-and-tie look (too corporate for a friendly guide character) and avoid any real-world delivery-brand uniform, logos, or trademarked color schemes. No text, no logos, no barcode/parcel props unless it's a single small neutral courier bag as a subtle accessory. Background: fully transparent (PNG with alpha channel), no ground plane, no shadow baked into a background — keep only a soft contact shadow directly under the feet so it can be composited onto any page. Render at a square aspect ratio, centered, generous padding around the figure so it can be scaled down to roughly 56–72px on screen while staying legible. Produce 3 pose variants: (1) idle/neutral standing pose for the default state, (2) a "listening" pose with a hand near the ear or leaning slightly forward, (3) a "speaking/explaining" pose with one hand gesturing outward. Style consistency across all three: same character, same outfit, same lighting, same camera angle.

**Naming for delivered assets:** `rahi-idle.png`, `rahi-listening.png`, `rahi-speaking.png`, saved to `client/src/assets/rahi/`.

**Design-system tie-in:** the figure's outfit accent color should use `--color-sage` (`#A3C1BF`) so it visually belongs to LainDain's existing palette per `design.md` §2, even though the asset itself is a photorealistic render rather than a flat-color icon.

---

## 9. Security & Production-Readiness Checklist (pre-merge gate)

Extends `ERRORCHECKS.md` and `CHATBOTDEVELOPEMENT.md` §8 — treat as `SEC-VA-xx`, check off before merging out of `akif/voiceassistant`:

**Keys & isolation**
- [ ] `GROQ_API_KEY_RAHI`, `GROQ_API_KEY_STT`, `TTS_API_KEY` never appear in any client bundle (`cd client && npm run build && grep -riE "groq|elevenlabs|azure|GOOGLE_TTS" dist/` → zero matches beyond expected public strings)
- [ ] None of the new keys are logged, returned in any API response, or shared between Feature A/B/Laila's existing key
- [ ] Confirm Laila's existing `GROQ_API_KEY` usage is completely unmodified by this branch (diff `chatbotService.js`/`chatbotController.js` against `main` — should show zero changes)

**Rate limiting & abuse**
- [ ] `/api/voice/transcribe`, `/api/voice/speak`, `/api/rahi/message` each rate-limited independently — verify with a burst script per route
- [ ] Audio upload size/duration capped server-side (`STT_MAX_AUDIO_SECONDS`) — test with an oversized file, expect clean 400
- [ ] TTS input text capped server-side (`TTS_MAX_CHARS`) — test with an oversized string, expect clean 400
- [ ] Message/history length caps on `/api/rahi/message` mirror the same discipline as `BE-CHAT-03`

**Input handling**
- [ ] Audio mime-type allow-list enforced server-side (reject anything not an expected audio format)
- [ ] TTS text is stripped of markdown/HTML before being sent to the provider and before ever reaching any client-side render — confirm by sending `<script>alert(1)</script>` as a transcript and verifying it's inert everywhere (speech bubble text, chat log)
- [ ] Malformed/non-JSON Rahi model output never reaches the client raw — same fallback-on-parse-failure pattern as Laila

**Privacy**
- [ ] Confirm no raw audio is written to disk or a DB table anywhere in the pipeline — transcription happens in-memory/stream only
- [ ] Confirm the "new visitor" greeting flag stored client-side contains no PII (just a boolean/timestamp)
- [ ] Confirm `knowledgeBase`/context sent to either model contains zero PII and zero internal-only fields (re-run the same spot-check as `CHATBOTDEVELOPEMENT.md` §8 against the new Rahi context payload specifically, not just Laila's)

**Regression (must not break what already shipped)**
- [ ] Full baseline smoke test from `ERRORCHECKS.md` §0.6 passes with both Laila's voice mic and Rahi present on the page
- [ ] Laila's **existing text-only** flow (no mic used) behaves byte-for-byte identically to pre-branch `main` — this is the single most important regression check on this branch
- [ ] Chatbot-specific checklist from `CHATBOTDEVELOPEMENT.md` §8 re-run in full and still passes
- [ ] Mic permission denial / unsupported browser does not break either the chat widget or the rest of the page (Section 7B FE-VA-A-04)
- [ ] Rahi's drag/reposition never traps focus or blocks any existing interactive element (cart, checkout, nav) underneath it
- [ ] No new console errors anywhere in the app, with both voice widgets open and closed, across a full click-through

**Dependency & infra hygiene**
- [ ] `npm audit` clean on `server/` after adding any new SDKs (Whisper client, chosen TTS provider SDK)
- [ ] CORS on `/api/voice/*` and `/api/rahi/*` inherits the existing allow-list from `BE-03` — verify it does not accidentally get a wildcard because it's a new route file
- [ ] Generic, non-leaking error responses on every new route (no stack traces, no provider error bodies passed through) — same pattern as `BE-12`

---

## 10. Testing & QA

**Functional — Feature A (voice-enabled Laila)**
- [ ] Tap mic, speak an English question → correct transcription → correct Laila reply → (if voice-output on) reply is spoken
- [ ] Same in Urdu and Roman Urdu
- [ ] Deny mic permission → mic button disables gracefully, text chat still fully usable
- [ ] Speak a very long/rambling message → server-side cap kicks in cleanly, no crash

**Functional — Feature B (Rahi)**
- [ ] First-ever visit, not signed in → greeting plays once, spoken, 1–2 lines, correct language based on browser/OS locale default
- [ ] Refresh the page in the same session → greeting does not replay
- [ ] Sign in → greeting never plays for that session
- [ ] Say "I want to buy cement" → Rahi offers categories/comparison choice rather than immediately redirecting
- [ ] Confirm a specific supplier/product verbally → page navigates to the correct product detail modal in sync with Rahi's spoken summary
- [ ] **Interrupt Rahi mid-sentence by speaking** → playback stops immediately, mic starts listening (this is a hard acceptance criterion, test on at least two devices/browsers)
- [ ] Drag Rahi's avatar to a different corner → position holds across a page-internal navigation (category change, product open) within the same session
- [ ] Minimize/dismiss Rahi → reopen from the minimized state without losing the current session's conversational context
- [ ] Ask Rahi something off-topic / a prompt-injection attempt → same fixed refusal template as Laila, spoken

**Cross-cutting**
- [ ] Both features usable simultaneously without interfering with each other (e.g. talking to Rahi doesn't leave Laila's widget in a stuck "listening" state)
- [ ] Full regression pass of `ERRORCHECKS.md` §0.6 baseline smoke test
- [ ] Bundle size check — confirm both new feature chunks are lazy-loaded, main bundle size delta reviewed and reported before merge (same FE-15 discipline)
- [ ] Mobile Android + iOS Safari specifically tested for STT/TTS support gaps (this is the most likely place browser-native APIs fall short — confirms whether the Whisper/cloud-TTS fallback path is actually exercised, not just present in code)

---

## 11. Rollout Checklist

- [ ] Section 4 TTS provider decision made and documented (with the actual chosen provider + voice IDs) before backend TTS tasks begin
- [ ] Rahi's final name/persona copy signed off by Akif/co-founder before locking into UI strings and system prompts
- [ ] Icon assets (Section 8) generated, reviewed against the reference image for style match, approved, and placed in `client/src/assets/rahi/`
- [ ] All tasks in Sections 7A–7D complete and committed individually
- [ ] Section 9 security checklist fully checked
- [ ] Section 10 testing checklist fully checked
- [ ] `npm run build` succeeds clean on `client/`, bundle-size delta reviewed
- [ ] `npm audit` clean on `server/`
- [ ] Merge `akif/voiceassistant` → `akif/admin-dashboard` (or `dev`, confirm target with Akif at merge time) → full regression pass
- [ ] Merge onward to `main` per the same gated process as `ERRORCHECKS.md`/`CHATBOTDEVELOPEMENT.md`
- [ ] Post-deploy: verify both features live, re-run the barge-in and new-visitor-greeting tests once more against production (these are the two behaviors most likely to differ between local/dev and production due to browser/OS/network variance)

---

## 12. File Structure Summary (net-new files)

```
server/
  src/
    config/groqRahi.js
    services/rahiService.js
    services/knowledgeRefreshService.js
    controllers/rahiController.js
    controllers/voiceController.js
    routes/rahiRoutes.js
    routes/voiceRoutes.js
    middleware/rahiRateLimit.js
    middleware/voiceRateLimit.js

client/
  src/
    components/chatbot/
      useChatVoice.js                 (new — additive to existing chatbot/ folder)
    components/rahi/
      RahiAssistant.jsx
      RahiAvatar.jsx
      RahiSpeechBubble.jsx
      RahiListeningIndicator.jsx
      useRahiVoice.js
      useRahiConversation.js
      useDraggable.js
    assets/rahi/
      rahi-idle.png
      rahi-listening.png
      rahi-speaking.png

Edited (minimal, additive only):
  server/src/server.js          (+2 lines: mount rahiRoutes + voiceRoutes)
  server/.env.example           (+documented new vars, no real values)
  client/src/App.jsx             (+lazy import for RahiAssistant, +1 JSX line, +nav callbacks reused from Laila's existing wiring)
  client/src/components/chatbot/ChatPanel.jsx   (+mic button, +speaker toggle only)
```

---

## 13. Open Decisions to Confirm With Akif Before Building

1. Final TTS provider (ElevenLabs vs Azure vs Google) — pick based on a live Urdu-voice quality test, not spec alone.
2. Rahi's final name (this doc proposes "Rahi" as a placeholder, same convention `landdain-design.md` used for its own placeholder assumptions).
3. Greeting flag scope: once per **device** (`localStorage`) vs once per **tab session** (`sessionStorage`) — Section 6.4 defaults to device-level, confirm that's actually wanted.
4. Whether the optional `assistant_context_snapshot` DB table (Section 6.2) is worth building now or deferred until the simple in-memory cache proves insufficient.
5. Target merge branch after `akif/voiceassistant` is done — `akif/admin-dashboard` first or straight to `dev` — depends on where the dashboard branch stands at that time.
