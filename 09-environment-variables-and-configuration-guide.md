# LainDain Environment Variables & Configuration Guide (MVP v1)

> **Configuration Management, Environment Specification & Deployment Guide**  
> **Version:** 1.0.0  
> **Status:** Production / MVP v1  
> **Target Environments:** Local Development (`localhost`), Staging/Preview (`Vercel/Render`), Production (`laindainstore.vercel.app`)  
> **Security Standards:** 12-Factor App Configuration, Strict Secret Isolation, Client-Side `VITE_` Public Scoping, Independent AI Quota Keys

---

## 1. Executive Summary & Configuration Architecture

### 1.1 Configuration Management Philosophy

**LainDain** strictly follows the **Twelve-Factor App methodology** for configuration management. All runtime behavior, service endpoints, database credentials, security secrets, and third-party API keys are injected via environment variables rather than hardcoded in the codebase.

The system enforces three core configuration rules:

1. **Strict Client/Server Security Boundary:** Frontend client variables must explicitly use the `VITE_` prefix to be bundled into the browser application. Any variable without the `VITE_` prefix remains strictly inaccessible to the client, preventing accidental secret leakage.
2. **Layered `.env` File Hierarchy:** The backend server (`server/src/server.js`) utilizes layered `dotenv` loading to support both localized component testing and root monorepo execution.
3. **Graceful Defaults & Local Mocks:** The codebase provides resilient fallback defaults for non-critical services (such as mock email logging, static sample catalog data, and browser-native speech synthesis) so developers can run the system locally without needing third-party API accounts.

```mermaid
flowchart TD
    subgraph Env_Files ["Environment File Hierarchy"]
        RootEnv[".env (Root Monorepo)"]
        ServerEnv["server/.env (Backend Service)"]
        ClientEnv["client/.env (Frontend SPA)"]
    end

    subgraph Loading_Engine ["Runtime Injection & Security Scope"]
        DotEnv["dotenv.config() Engine (server.js)"]
        ViteEngine["Vite Build Engine (import.meta.env)"]
    end

    subgraph Destination_Scopes ["Target Runtimes & Boundaries"]
        ServerRuntime["Node.js / Express Server (Private Secrets)"]
        BrowserBundle["Browser Client App (Public Variables Only)"]
    end

    ServerEnv -->|Layer 1: Highest Priority| DotEnv
    RootEnv -->|Layer 2: Monorepo Fallback| DotEnv
    DotEnv --> ServerRuntime

    ClientEnv -->|Filtered by VITE_ Prefix| ViteEngine
    ViteEngine --> BrowserBundle

    classDef secure fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef client fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    class ServerRuntime secure;
    class BrowserBundle client;
```

---

### 1.2 Environment File Locations & Purpose

| File Location | Target Application | Committed to Git? | Description & Contents |
| :--- | :--- | :--- | :--- |
| `server/.env` | Backend API Server (`/server`) | **No (in `.gitignore`)** | Contains database connection strings, Supabase service role secrets, JWT signing keys, Groq AI keys, and Resend email credentials. |
| `server/.env.example` | Backend API Server (`/server`) | **Yes** | Public template illustrating all required server environment variable keys with dummy values. |
| `client/.env` | Frontend Client (`/client`) | **No (in `.gitignore`)** | Contains public frontend configuration (e.g. `VITE_API_URL`, `VITE_POSTHOG_KEY`). |
| `client/.env.example` | Frontend Client (`/client`) | **Yes** | Public template illustrating public frontend variable configurations. |
| `.env` (Root) | Monorepo Root (`/`) | **No (in `.gitignore`)** | Optional unified configuration file supporting monorepo runner scripts. |

---

## 2. Master Environment Variable Reference Catalog

### 2.1 Complete Variable Matrix

The table below documents every environment variable utilized across the LainDain platform:

| Variable Name | Environment Scope | Required / Optional | Default Value | Sensitivity Level | Description & Functional Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | Server | Optional | `5000` | Public | HTTP port on which the Express REST API listens. |
| `NODE_ENV` | Server | Optional | `development` | Public | Application execution mode (`development` or `production`). Enables verbose error stacks in dev. |
| `CLIENT_URL` | Server | Optional | `http://localhost:5173` | Public | Primary frontend origin for CORS whitelist resolution. |
| `FRONTEND_URL` | Server | Optional | `http://localhost:5173` | Public | Base frontend URL used when generating password reset links dispatched via email. |
| `SUPABASE_URL` | Server | **Required** | None | Restricted | HTTP API URL of the Supabase project (`https://xyz.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | **Required** | None | **Critical Secret** | Supabase service role key granting superuser administrative database access. Bypasses RLS. |
| `SUPABASE_ANON_KEY` | Server | Optional | None | Restricted | Public Supabase anon key used as a fallback if the service role key is omitted. |
| `DATABASE_URL` | Server | **Required** | None | **Critical Secret** | Direct PostgreSQL connection string for Prisma ORM (`postgres://postgres:...@host:5432/postgres`). |
| `DIRECT_URL` | Server | Optional | None | **Critical Secret** | Direct non-pooled PostgreSQL URI used for running raw database migrations without pooler session locks. |
| `JWT_SECRET` | Server | **Required** | `'lain-dain-jwt-secret...'` | **Critical Secret** | HMAC-SHA256 secret string used to sign and verify session JWTs and password reset tokens. |
| `GROQ_API_KEY` | Server | Optional | None | **Critical Secret** | Fallback Groq API key used for the Laila text customer service chatbot. |
| `GROQ_MODEL` | Server | Optional | `llama-3.3-70b-versatile` | Public | Model ID used for Laila chatbot responses. |
| `CHATBOT_MAX_TOKENS` | Server | Optional | `400` | Public | Maximum token completion limit for Laila chatbot turns. |
| `CHATBOT_RATE_LIMIT_PER_MIN` | Server | Optional | `20` | Public | Max chatbot message requests allowed per minute per IP address. |
| `GROQ_API_KEY_RAHI` | Server | **Required (AI)** | None | **Critical Secret** | Dedicated Groq API key for the Rahi multilingual voice assistant. Prevents quota conflicts. |
| `RAHI_MODEL` | Server | Optional | `llama-3.3-70b-versatile` | Public | Model ID used for Rahi conversational intent and action processing. |
| `RAHI_MAX_TOKENS` | Server | Optional | `250` | Public | Maximum token completion limit for Rahi voice assistant responses. |
| `RAHI_RATE_LIMIT_PER_MIN` | Server | Optional | `30` | Public | Max Rahi message requests allowed per minute per IP address. |
| `GROQ_API_KEY_STT` | Server | **Required (Voice)**| None | **Critical Secret** | Dedicated Groq API key for Whisper speech-to-text audio transcription. |
| `STT_MODEL` | Server | Optional | `whisper-large-v3-turbo` | Public | Model ID used for speech-to-text audio transcription (`whisper-large-v3-turbo` or `whisper-large-v3`). |
| `STT_MAX_AUDIO_SECONDS` | Server | Optional | `20` | Public | Maximum allowed duration in seconds for uploaded voice recordings. |
| `STT_RATE_LIMIT_PER_MIN` | Server | Optional | `20` | Public | Max audio transcription requests allowed per minute per IP address. |
| `TTS_PROVIDER` | Server | Optional | `gtts` | Public | Text-to-speech provider (`gtts` for Google stream, `elevenlabs` for neural synthesis). |
| `TTS_API_KEY` | Server | Optional | None | **Critical Secret** | API key for ElevenLabs neural voice synthesis. |
| `TTS_VOICE_ID_EN` | Server | Optional | `eleven_monolingual_v1` | Public | Voice identifier for English speech synthesis in ElevenLabs. |
| `TTS_VOICE_ID_UR` | Server | Optional | `eleven_multilingual_v2` | Public | Voice identifier for Urdu speech synthesis in ElevenLabs. |
| `TTS_RATE_LIMIT_PER_MIN` | Server | Optional | `20` | Public | Max speech synthesis requests allowed per minute per IP address. |
| `TTS_MAX_CHARS` | Server | Optional | `350` | Public | Character count ceiling for synthesized audio generation. |
| `RESEND_API_KEY` | Server | Optional | None | **Critical Secret** | API key for Resend transactional email delivery service. |
| `EMAIL_FROM` | Server | Optional | `LainDain Support <support@...>` | Public | Verified sender email address used in transactional email headers. |
| `FROM_EMAIL` | Server | Optional | `LainDain Support <support@...>` | Public | Alias fallback for `EMAIL_FROM`. |
| `VITE_API_URL` | Client | Optional | `http://localhost:5000/api` | Public | Target base REST API URL for frontend fetch calls (`https://api.domain.com/api`). |
| `VITE_POSTHOG_KEY` | Client | Optional | None | Public | PostHog public project token for client analytics. |
| `VITE_POSTHOG_HOST` | Client | Optional | `https://us.i.posthog.com` | Public | Ingestion host endpoint for PostHog telemetry data. |

---

## 3. Step-by-Step Environment Setup Guides

### 3.1 Local Development Quick-Start

To run the complete LainDain stack locally on a development machine:

#### Step 1: Configure Backend Environment
Create `server/.env` by copying `server/.env.example`:

```bash
# In directory: server/
cp .env.example .env
```

Populate `server/.env` with your credentials:

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Supabase Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL="postgres://postgres:your-db-password@db.your-project.supabase.co:5432/postgres"

# Security
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars

# AI & Voice Engine (Groq Cloud)
GROQ_API_KEY_RAHI=gsk_your_rahi_groq_key
GROQ_API_KEY_STT=gsk_your_stt_groq_key
GROQ_API_KEY=gsk_your_chatbot_groq_key

# Transactional Email (Optional in local dev - will log to console if missing)
RESEND_API_KEY=re_your_resend_key
EMAIL_FROM="LainDain Support <onboarding@resend.dev>"
```

#### Step 2: Configure Frontend Environment
Create `client/.env` by copying `client/.env.example`:

```bash
# In directory: client/
cp .env.example .env
```

Populate `client/.env`:

```ini
# Local backend proxy target
VITE_API_URL=http://localhost:5000/api

# PostHog Analytics (Optional - mock wrapper active if omitted)
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

#### Step 3: Initialize Database & Run Seed Script
```bash
# Run database migrations and seed administrative superuser
cd server
npm install
npm run seed:admin
```

#### Step 4: Start Applications
```bash
# Terminal 1: Start Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend Client (Port 5173)
cd client
npm run dev
```

---

### 3.2 Supabase PostgreSQL Provisioning Guide

1. **Create Supabase Project:** Log in to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. **Retrieve API Keys:**
   * Go to **Project Settings** -> **API**.
   * Copy `Project URL` -> set as `SUPABASE_URL`.
   * Copy `service_role` secret key (reveal hidden key) -> set as `SUPABASE_SERVICE_ROLE_KEY`.
3. **Retrieve Database Connection String:**
   * Go to **Project Settings** -> **Database** -> **Connection string** -> **URI**.
   * Select **Transaction Pooler** (Port 6543) or **Direct** (Port 5432).
   * Replace `[YOUR-PASSWORD]` with your database password -> set as `DATABASE_URL`.
4. **Apply Database Migrations:**
   * Open Supabase SQL Editor and run the SQL migration files sequentially from `server/supabase/migrations/`:
     * `01_auth_system.sql`
     * `02_products_crud.sql`
     * `03_email_verification.sql`
     * `04_add_profile_columns.sql`
     * `05_buyer_workflow.sql`
     * `06_guest_checkout_merge.sql`
     * `07_multivendor_fulfillment.sql`
     * `08_seller_dashboard_fields.sql`
     * `09_admin_dashboard_alignment.sql`
     * `10_checkout_flow_alignment.sql`

---

### 3.3 Groq Cloud AI Keys Provisioning Guide

To prevent quota starvation between voice transcription and chat completion:

1. Create an account at [Groq Cloud Console](https://console.groq.com/).
2. Navigate to **API Keys** and generate **three separate API keys**:
   * Key 1: Label as `LainDain-Voice-STT` -> set as `GROQ_API_KEY_STT`.
   * Key 2: Label as `LainDain-Rahi-Voice` -> set as `GROQ_API_KEY_RAHI`.
   * Key 3: Label as `LainDain-Laila-Chatbot` -> set as `GROQ_API_KEY`.
3. This configuration ensures that intensive speech transcription workloads do not exhaust the token quota needed for customer service chat responses.

---

### 3.4 Resend Transactional Email Provisioning Guide

1. Sign up at [Resend Dashboard](https://resend.com/).
2. Navigate to **API Keys** -> **Create API Key** -> set as `RESEND_API_KEY`.
3. **Domain Verification (Production):**
   * Navigate to **Domains** -> **Add Domain** (`laindain.org`).
   * Add the required `SPF`, `DKIM`, and `DMARC` DNS records at your domain registrar.
   * Set `EMAIL_FROM="LainDain Support <support@laindain.org>"`.
4. **Sandbox / Development Testing:**
   * If testing before DNS propagation, set `EMAIL_FROM="LainDain <onboarding@resend.dev>"`.
   * Resend permits delivery to the account owner's email address in sandbox mode.

---

## 4. Production Deployment & Cloud Platform Configuration

### 4.1 Render Backend Web Service Configuration (`render.yaml`)

The backend is deployed on Render as a managed Node.js Web Service.

```yaml
services:
  - type: web
    name: lain-dain-backend
    env: node
    rootDir: server
    buildCommand: npm install
    startCommand: node src/server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
```

#### Configuring Environment Variables in Render Dashboard:
Navigate to **Render Dashboard** -> **Your Service** -> **Environment**:

| Key | Value Example / Reference |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render binds automatically) |
| `CLIENT_URL` | `https://laindainstore.vercel.app` |
| `FRONTEND_URL` | `https://laindainstore.vercel.app` |
| `SUPABASE_URL` | `https://your-production-id.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` *(Secret Key)* |
| `DATABASE_URL` | `postgres://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | *(64-character high entropy random hex string)* |
| `GROQ_API_KEY_RAHI` | `gsk_...` |
| `GROQ_API_KEY_STT` | `gsk_...` |
| `GROQ_API_KEY` | `gsk_...` |
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `LainDain Support <support@laindain.org>` |

---

### 4.2 Vercel Frontend Edge Deployment Configuration

The React single-page application is deployed on Vercel Edge Network.

#### Configuring Environment Variables in Vercel Dashboard:
Navigate to **Vercel Project** -> **Settings** -> **Environment Variables**:

| Key | Environment | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Production | `https://laindaindev.onrender.com/api` |
| `VITE_API_URL` | Preview / Staging | `https://laindaindev-preview.onrender.com/api` |
| `VITE_POSTHOG_KEY` | Production | `phc_your_production_key` |
| `VITE_POSTHOG_HOST` | Production | `https://us.i.posthog.com` |

---

### 4.3 Administrative Superuser Account Provisioning Script

LainDain includes an automated administrative provisioning script (`server/scripts/seed-admin.js`) that creates or updates the master administrator account:

```bash
# Execute provisioning script
cd server
npm run seed:admin
```

**Script Actions:**
1. Generates a salted `bcryptjs` password hash (10 rounds).
2. Performs an upsert on the `users` table for email `laindaininterns@gmail.com` with `role = 'ADMIN'` and `is_email_verified = true`.
3. Ensures a linked `admin_profiles` record exists for the account.
4. Validates password hash comparison to guarantee successful login capability.

---

## 5. Security Best Practices & Key Rotation Protocols

### 5.1 Secret Hygiene & Repository Safeguards

1. **Gitignore Auditing:** Verify that `.env`, `server/.env`, `client/.env`, and all `.env.local` variants are strictly tracked in `.gitignore`.
2. **Zero Plaintext Credentials in Commits:** Never commit API keys, connection strings, or JWT secrets to source control.
3. **Automated Secret Scanning:** Maintain repository push protections to detect accidentally committed tokens.

---

### 5.2 Key Rotation Procedures

#### 5.2.1 Rotating `JWT_SECRET`
> [!WARNING]
> Rotating `JWT_SECRET` invalidates all existing active user sessions and outstanding password reset links, requiring users to log in again.

1. Generate a new high-entropy cryptographic secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` in the Render environment variables dashboard.
3. Trigger a zero-downtime rolling restart of the backend service.

#### 5.2.2 Rotating Groq / Resend API Keys
1. Generate a replacement API key in the provider console (Groq or Resend).
2. Update the corresponding variable (`GROQ_API_KEY_RAHI`, `RESEND_API_KEY`) in the Render Dashboard.
3. Verify functionality via the respective test endpoints (`/api/rahi/message`, `/api/auth/register`).
4. Revoke the old API key in the provider console.

---

## 6. Troubleshooting & Misconfiguration Resolution Matrix

The table below outlines diagnostic steps and solutions for common configuration issues:

| Error Symptom / Log Output | Underlying Root Cause | Verification Step | Resolution Action |
| :--- | :--- | :--- | :--- |
| `CORS policy violation: Origin not allowed.` | Request origin is not listed in `allowedOrigins` whitelist in `server.js`. | Check the `Origin` header sent by browser and compare against `server.js` whitelist. | Set `CLIENT_URL` or `FRONTEND_URL` in `server/.env` to match the exact frontend URL (including port, without trailing slash). |
| `Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing` | Database credentials not loaded or missing from environment. | Verify that `server/.env` exists and contains valid `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. | Copy `server/.env.example` to `server/.env` and supply valid Supabase credentials. |
| `Port 5000 is already in use by another process (EADDRINUSE)` | A previous Node.js instance is already listening on port 5000. | Run `netstat -ano \| findstr :5000` (Windows) to identify the conflicting process PID. | Terminate the existing process via Task Manager or `taskkill /F /PID <PID>`, or set `PORT=5001`. |
| `STT service key unavailable on server` (HTTP 503) | `GROQ_API_KEY_STT` is missing or empty in the server environment. | Check server console logs for `Warning: GROQ_API_KEY_STT is missing`. | Add a valid Groq API key to `GROQ_API_KEY_STT` in `server/.env`. |
| `[Resend Email Error] domain not verified` | Custom domain DNS records are not yet verified in Resend. | Check Resend Dashboard -> Domains status. | The built-in fail-safe will auto-retry via `onboarding@resend.dev`. For production, complete DNS verification in Resend. |
| `VITE_API_URL` is undefined in browser bundle | Variable in `client/.env` is missing the required `VITE_` prefix. | Inspect `import.meta.env` in browser developer console. | Ensure the client variable is explicitly named `VITE_API_URL` and rebuild the client (`npm run build`). |
| `Invalid credentials` when attempting Admin login | Master admin user not provisioned in database. | Query `SELECT * FROM users WHERE role = 'ADMIN'` in Supabase SQL editor. | Execute `npm run seed:admin` from the `server/` directory to provision the default admin account. |
