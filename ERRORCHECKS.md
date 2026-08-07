# ERRORCHECKS.md
### LainDain (Land10) — Pre-Launch Security & Production Readiness Tracker

**Repo:** laindaininterns/laindaindev
**Live:** https://laindainstore.vercel.app/ (domain going live soon)
**Branch:** `akif/securitychecks` (cut from latest `main`)

---

## 0. Workflow — read before starting any issue

1. `git checkout main && git pull origin main`
2. `git checkout -b akif/securitychecks`
3. Frontend dev works only inside `client/`. Backend dev works only inside `server/`.
4. **One issue = one commit.** Do not batch multiple issue IDs into one commit — this keeps the history reviewable and revertable.
5. For every issue, follow this exact loop:
   - **Verify** the issue actually exists (steps given per issue). If it does not reproduce, mark it `N/A — verified not present` in this file with the command/output that proves it, and skip to the next issue. Do not "fix" something that isn't broken.
   - **Fix** only the specific lines/files needed. No refactors, no renames, no dependency upgrades bundled in unless the issue explicitly requires it.
   - **Regression check** — re-run the full manual smoke test below for the affected area. Confirm the existing user flow (layout, cart, login, CRUD, checkout) behaves exactly as before, just without the vulnerability/defect.
   - **Commit** using the message format:
     `fix(FE-03): add OG tags to index.html — verified no layout/behavior change`
     `fix(BE-06): enforce ownership check on /api/orders/:id — verified existing valid requests still 200`
   - Check the box for that issue in this file and commit that checkbox update together with the fix.
6. **Baseline smoke test** (run before touching anything, and after every fix, on both `localhost` and the preview deployment):
   - [ ] Landing page loads, product grid renders, category filter works
   - [ ] Login works with a real (non-demo) test account
   - [ ] Register (buyer) works
   - [ ] Register (seller, 2-step) works, including file upload step
   - [ ] Add to cart, update quantity, remove from cart
   - [ ] Checkout / place order completes
   - [ ] Admin panel (if logged in as admin) loads and product CRUD works
   - [ ] No new console errors introduced
7. When **all Frontend issues** are checked off and smoke-tested → merge `akif/securitychecks` → `dev` (frontend portion) → full regression pass on `dev` → merge `dev` → `main`.
8. Same gate for **Backend issues**: all checked off → merge to `dev` → regression pass → `main`.
9. Do not merge to `main` if a single issue in this file is unchecked, unless it's explicitly marked `N/A`.

---

## PART A — FRONTEND (`client/`)

### FE-01 — Generic/duplicate page `<title>`
**Issue:** Every route shows the same browser tab title ("client" — the unedited Vite default), including the live production site.
**Verify:** Open `client/index.html`, check the `<title>` tag. View-source the live site and confirm the same title appears on every route (`/`, `/product/:id`, `/login`, etc.).
**Fix:**
- [x] Set a real default `<title>` in `client/index.html` (e.g. "Land10 — B2B Wholesale Marketplace")
- [x] Add per-route title updates (via `react-helmet-async`, or `useEffect(() => { document.title = ... }, [])` per page component if no library is added)
- [x] Confirm each major route (landing, product detail, category, checkout, login) shows a distinct, accurate title
**Regression check:** All routes still render and navigate identically; only the tab title text changed.

---

### FE-02 — No meta description
**Issue:** No `<meta name="description">` in `index.html`, so search/social previews show blank or fallback text.
**Verify:** `grep -i "meta name=\"description\"" client/index.html` — confirm it's missing or empty.
**Fix:**
- [x] Add a static default meta description to `index.html`
- [x] Add per-page overrides for product/category pages if using `react-helmet-async`
**Regression check:** No visible UI change; confirm via view-source only.

---

### FE-03 — No OG image / Open Graph / Twitter Card tags
**Issue:** Sharing any page link (WhatsApp, LinkedIn, etc.) shows no image/title/description preview.
**Verify:** Paste the live URL into a link-preview debugger (e.g. Facebook Sharing Debugger, or `curl -s https://laindainstore.vercel.app/ | grep og:`) — confirm no `og:*` or `twitter:*` tags returned.
**Fix:**
- [x] Add `og:title`, `og:description`, `og:image`, `og:url`, `og:type` to `index.html`
- [x] Add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- [x] Create/host a static 1200×630 share image at a stable URL
**Regression check:** No UI/behavior change; verify only via debugger tool re-scan.

---

### FE-04 — No structured data (JSON-LD)
**Issue:** No `Organization`/`Product`/`BreadcrumbList` schema — search engines can't build rich results.
**Verify:** Run the live URL through Google's Rich Results Test — confirm "no structured data found."
**Fix:**
- [x] Add `<script type="application/ld+json">` for `Organization` to base HTML or root layout
- [x] Add `Product` JSON-LD schema dynamically on product detail pages
- [x] Add `BreadcrumbList` if route hierarchy exists
**Regression check:** Confirm JSON-LD script tag doesn't break page render (check console for JSON syntax errors).

---

### FE-05 — Multiple / missing `<h1>` tags
**Issue:** Some pages have more than one `<h1>`, others have none — bad for accessibility and SEO hierarchy.
**Verify:** For each route, `document.querySelectorAll('h1').length` in devtools console — flag anything ≠ 1.
**Fix:**
- [x] Ensure exactly one `<h1>` per page/view
- [x] Change additional heading levels to follow `h1 -> h2 -> h3` sequence without skipping levels
**Regression check:** Confirm visual styling unchanged (adjust CSS selectors if any styling was tag-based rather than class-based).

---

### FE-06 — No canonical tag
**Issue:** No `<link rel="canonical">`, risking duplicate-content SEO issues (e.g. `?ref=` query params, trailing slashes).
**Verify:** `grep -i "canonical" client/index.html` and check rendered `<head>` in devtools on a live route.
**Fix:**
- [x] Add a canonical tag per route pointing to the clean production URL
**Regression check:** None expected — head-only change.

---

### FE-07 — No `llms.txt`
**Issue:** No file describing the site for AI crawlers/agents.
**Verify:** `curl -I https://laindainstore.vercel.app/llms.txt` — confirm 404.
**Fix:**
- [x] Add `client/public/llms.txt` with a short site/purpose description
**Priority:** Low — do this last, after all other FE issues are closed.

---

### FE-08 — `robots.txt` blocks AI crawlers / crawling misconfigured
**Issue:** Current `robots.txt` disallows crawling broadly (including AI user-agents), which may be unintentional and will suppress SEO indexing once the domain goes live.
**Verify:** `curl https://laindainstore.vercel.app/robots.txt` — review current `Disallow` rules and user-agent blocks.
**Fix:**
- [ ] Confirm with product owner (Akif) which crawlers/paths should actually be blocked (e.g. `/admin`, `/checkout`, `/cart`) vs. allowed (public product/category pages)
- [x] Configure `robots.txt` to allow indexing public pages while blocking private/auth routes
- [x] Add `Sitemap:` directive pointing to the new sitemap (FE-10)
**Regression check:** None — static file only.

---

### FE-09 — No favicon
**Issue:** No favicon/app icons served; browser tab and bookmarks show a blank/default icon.
**Verify:** `curl -I https://laindainstore.vercel.app/favicon.ico` — confirm 404.
**Fix:**
- [x] Add `favicon.ico`, `apple-touch-icon.png`, and a `site.webmanifest` to `client/public/`
- [x] Reference them correctly in `index.html`
**Regression check:** None.

---

### FE-10 — No `sitemap.xml`
**Issue:** No sitemap for search engines to discover routes.
**Verify:** `curl -I https://laindainstore.vercel.app/sitemap.xml` — confirm 404.
**Fix:**
- [x] Generate a static `sitemap.xml` covering landing, category, and static pages (product pages can be added later if they're server-rendered/dynamic)
- [x] Reference it in `robots.txt` (see FE-08)
**Regression check:** None.

---

### FE-11 — Missing `lang` attribute
**Issue:** `<html>` has no `lang="en"` — accessibility and SEO issue.
**Verify:** `grep "<html" client/index.html`
**Fix:**
- [x] Ensure `<html lang="en">` (or appropriate lang code) is set on `index.html` (verified already present)
**Regression check:** None — one-attribute change.

---

### FE-12 — Missing `alt` text on images
**Issue:** Product images, icons, and logos lack descriptive `alt` attributes.
**Verify:** Devtools console: `[...document.querySelectorAll('img')].filter(i => !i.alt)` — list every offender.
**Fix:**
- [x] Audit all `<img>` and visual elements across components for descriptive `alt`/`aria-label` text
- [x] Ensure decorative elements have `aria-hidden="true"` or empty `alt=""`
**Regression check:** No visual change; confirm with screen-reader spot check if possible.

---

### FE-13 — Source maps exposed in production build
**Issue:** `.map` files are being served publicly, letting anyone reconstruct original source from the deployed bundle.
**Verify:** Devtools → Sources tab on the live site, or `curl -I https://laindainstore.vercel.app/assets/<bundle>.js.map` — confirm 200 instead of 404.
**Fix:**
- [ ] In `client/vite.config.js`, set `build: { sourcemap: false }` for production builds (or route maps only to an internal error-tracking tool, never publicly servable)
- [ ] Rebuild and redeploy, re-verify `.map` requests now 404
**Regression check:** App behavior identical — this only affects debug tooling, not runtime.

---

### FE-14 — Console errors in production
**Issue:** Errors appear in the browser console on the live site.
**Verify:** Open devtools console on `https://laindainstore.vercel.app/`, reload, click through main flows (browse, cart, login, checkout). Log every distinct error/warning with the triggering action.
**Fix:**
- [ ] Triage each logged error individually — do not batch-fix. Create one sub-checkbox per distinct error found:
  - [ ] Error 1: ______________________ — root cause: ______________________
  - [ ] Error 2: ______________________ — root cause: ______________________
  - [ ] (add rows as discovered)
**Regression check:** Confirm the fixed flow still behaves identically, error is gone, no new errors introduced.

---

### FE-15 — Massive JS bundle size / no code splitting
**Issue:** Large single JS bundle slows first load.
**Verify:** `cd client && npm run build` then check `dist/assets/*.js` file sizes. Also check Network tab on live site for total JS transferred.
**Fix:**
- [ ] Convert modals/routes that aren't needed on first paint (auth modals, admin panel, checkout flow) to `React.lazy()` + `Suspense`
- [ ] Confirm Tailwind's content-purge config only scans real source paths (no unused CSS shipped)
- [ ] Re-run build, compare bundle size before/after
**Regression check:** Every lazy-loaded component still renders correctly on first interaction (test each modal/route explicitly — this is the highest-risk FE change for breaking something silently).

---

### FE-16 — No custom 404 page
**Issue:** Unknown routes show a blank screen or the default host error instead of a real "page not found" UI.
**Verify:** Visit `https://laindainstore.vercel.app/this-route-does-not-exist` — observe current behavior.
**Fix:**
- [ ] Add a catch-all route (`*`) in the router rendering a proper 404 component
- [ ] Confirm `client/vercel.json` rewrite rules still route unmatched paths into the SPA (not an actual HTTP 404 from Vercel) so the in-app 404 component can render
**Regression check:** All existing valid routes still resolve correctly; only truly unknown paths hit the new 404 UI.

---

### FE-17 — Empty view-source / no content for crawlers (CSR limitation)
**Issue:** `view-source:` on the live site shows an essentially empty `<div id="root">` — search engines and social-share bots that don't execute JS see nothing.
**Verify:** `curl -s https://laindainstore.vercel.app/ | head -50` — confirm body is near-empty aside from the root div and script tags.
**Fix (scope this as a team decision, not a silent change):**
- [ ] Discuss with Akif: full prerendering (e.g. `vite-plugin-ssg`) vs. accepting CSR limits for a B2B tool and just shipping the static `index.html` meta defaults from FE-01–FE-04
- [ ] If prerendering is approved, implement for landing + category pages only (not authenticated/dynamic pages)
**Regression check:** This is the highest-risk item — test thoroughly on a preview URL before merging; confirm client-side routing/hydration still works after any SSG/prerender change.

---

### FE-18 — Verify no secret keys leaked into client bundle
**Issue:** Vite bundles any env var prefixed `VITE_` into public JS. Need to confirm no service-role key, DB connection string, or other backend secret was ever exposed this way.
**Verify:** `cd client && npm run build`, then `grep -r "service_role\|SUPABASE_SERVICE\|DATABASE_URL" dist/` — confirm zero matches. Also review `client/src/**` for any `import.meta.env.VITE_*` usage and confirm only the Supabase **anon** key and URL are referenced client-side.
**Fix:**
- [ ] If anything sensitive is found in the bundle: remove the reference, rebuild, re-grep to confirm clean
- [ ] If found, **immediately notify backend dev to rotate that key** (see BE-02) — this is a coordination point between the two branches, do not silently fix only the frontend reference
**Regression check:** Confirm Supabase client-side calls (auth, public reads) still function after any key-reference cleanup.

---

### FE-19 — Review client-side auth token storage
**Issue:** Need to confirm where the JWT is stored client-side (localStorage vs. httpOnly cookie). `localStorage` is readable by any injected script (XSS risk).
**Verify:** Devtools → Application tab → Local Storage / Cookies, log in, check where the token lands.
**Fix:**
- [ ] Document current storage method in this file
- [ ] If `localStorage`/`sessionStorage`: flag as a joint FE+BE item — moving to httpOnly cookies requires backend changes too (see BE-05). Do not attempt this as an isolated frontend-only fix.
**Regression check:** N/A until fix is scoped with backend.

---

### FE-20 — Client-side route guards without confirmed server-side enforcement
**Issue:** Protected routes (admin panel, checkout, seller dashboard) may only be gated by a client-side `if (user) redirect`. This is a UX guard, not a security boundary, unless the backend independently rejects unauthorized requests.
**Verify:** With devtools open, try navigating directly to a protected route's URL while logged out, and check if any protected data is fetched/rendered before the redirect fires.
**Fix:**
- [ ] Confirm the guard is UX-only and correctly redirects with no data flash
- [ ] Cross-check with BE-06/BE-07 that the actual API calls are rejected server-side regardless of what the frontend does
**Regression check:** All authenticated flows still redirect/render exactly as before.

---

### FE-21 — Security headers via `client/vercel.json`
**Issue:** No `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` headers configured on the static frontend responses.
**Verify:** `curl -I https://laindainstore.vercel.app/` — review response headers.
**Fix:**
- [ ] Add a `headers` block to `client/vercel.json` setting the above headers
- [ ] Start with a conservative CSP (allow self + known CDNs/fonts already in use) — test thoroughly, an overly strict CSP can silently break font loading, images, or API calls
**Regression check:** Reload every page/modal/flow with devtools console open — CSP violations show up there immediately if something breaks.

---

## PART B — BACKEND (`server/`)

### BE-01 — Public demo credentials in README
**Issue:** `demo@laindain.pk` / `password123` is documented in the public GitHub README with unclear scope of privileges.
**Verify:** Log in with the demo account and enumerate exactly what it can do — read only? Can it place real orders, modify real product data, access admin routes?
**Fix:**
- [ ] Restrict the demo account server-side to read-only / sandboxed data (a dedicated demo dataset, not live inventory)
- [ ] If full restriction isn't feasible immediately, remove the credentials from the public README and share privately with reviewers only
**Regression check:** Confirm the demo account still logs in and can still demonstrate the intended flows, just without write access to real data.

---

### BE-02 — Confirm service role key is never exposed
**Issue:** Cross-check with FE-18. Need backend-side confirmation the service role key is only used in server contexts, never logged, never returned in an API response/error body.
**Verify:** `grep -r "SUPABASE_SERVICE_ROLE_KEY\|service_role" server/src/` — confirm it's only referenced in the Supabase admin client initializer, never in a response payload or `console.log`.
**Fix:**
- [ ] Remove any accidental logging of the key or the client object that contains it
- [ ] If FE-18 found a leak, rotate the key in Supabase dashboard now, update `server/.env` / Render env vars, redeploy
**Regression check:** All admin-only operations (product CRUD, seller approval) still function after any key rotation.

---

### BE-03 — CORS configuration
**Issue:** Need to confirm CORS is scoped to the exact production frontend domain, not `*` or leftover preview URLs.
**Verify:** Review the `cors()` middleware config in `server/src/server.js`. Test with `curl -H "Origin: https://evil-example.com" -I https://<render-backend-url>/api/products` — confirm the response does not include `Access-Control-Allow-Origin: https://evil-example.com` or `*`.
**Fix:**
- [ ] Set an explicit allow-list: production domain + local dev origin only
- [ ] Remove any wildcard or broad regex origin matching
**Regression check:** Confirm the live frontend can still call the API successfully (no new CORS errors in browser console) after tightening.

---

### BE-04 — JWT expiry & refresh strategy
**Issue:** Need to confirm access tokens have a reasonably short expiry and there's a working refresh mechanism, not a long-lived token issued once at login.
**Verify:** Decode a live-issued JWT (jwt.io or manually) and check the `exp` claim. Test what happens to an authenticated session after the token's expiry window passes.
**Fix:**
- [ ] If expiry is excessive (days/weeks) or refresh doesn't exist, implement short-lived access tokens + refresh token flow
**Regression check:** Confirm a logged-in user isn't unexpectedly logged out mid-session during normal use after the change; confirm expired tokens are correctly rejected.

---

### BE-05 — Token storage / cookie flags (joint with FE-19)
**Issue:** If JWTs are set via cookies, confirm `Secure`, `HttpOnly`, and `SameSite` are all set correctly.
**Verify:** Devtools → Application → Cookies after login — check flags on any auth cookie. If tokens are instead returned in the response body for client-side storage, note that here and coordinate with FE-19.
**Fix:**
- [ ] Set `Secure; HttpOnly; SameSite=Strict` (or `Lax` if cross-site redirect flows require it) on any auth cookie
**Regression check:** Login/logout/session-persistence still works exactly as before across a page refresh.

---

### BE-06 — Authorization / IDOR checks on user-owned resources
**Issue:** Need to confirm a logged-in user cannot access or modify another user's cart, orders, or seller profile by guessing/incrementing an ID.
**Verify:** As User A, note an order/cart ID. Log in as User B, attempt `GET`/`PUT`/`DELETE` on User A's resource ID via the API directly (Postman/curl with User B's token). Expect a 403/404, not success.
**Fix:**
- [ ] Add an ownership check (`resource.user_id === req.user.id`) in every controller that reads/writes a user-owned resource, before returning/mutating data
- [ ] Repeat the test above for every resource type (cart, orders, seller applications, addresses)
**Regression check:** Confirm each user can still fully access and modify their own resources normally; only cross-user access is now blocked.

---

### BE-07 — Admin route role enforcement
**Issue:** Confirm `/api/admin/*` routes check a server-side role claim, not a client-supplied flag.
**Verify:** As a non-admin logged-in user, call an admin endpoint directly via curl/Postman with a valid non-admin token. Expect 403.
**Fix:**
- [ ] Add/confirm middleware that checks the authenticated user's role from the database/JWT claim (not from request body/query) before allowing admin controller logic to run
**Regression check:** Confirm a real admin account still has full access to every admin function after the check is added.

---

### BE-08 — Input validation & sanitization
**Issue:** Confirm all endpoints validate incoming data (types, required fields, length limits) before processing or hitting the database.
**Verify:** Send malformed requests to each major endpoint (missing fields, wrong types, oversized strings, obviously malicious strings like `<script>` or `' OR 1=1 --`) and confirm the API returns a clean 400 rather than a 500 or an unhandled exception.
**Fix:**
- [ ] Add a validation layer (e.g. `zod`, `joi`, or manual checks) on every route accepting user input: auth, product CRUD, orders, seller applications
**Regression check:** Confirm all previously-valid request shapes (from the actual frontend forms) still succeed unchanged; only malformed/malicious input is now rejected.

---

### BE-09 — Rate limiting on auth endpoints
**Issue:** Login, register, and forgot-password endpoints appear to have no rate limiting, making them crackable/spammable.
**Verify:** Script 20+ rapid requests to `/api/auth/login` with a bad password and confirm nothing throttles the attempts.
**Fix:**
- [ ] Add `express-rate-limit` (or equivalent) to auth routes specifically — start with a reasonable window (e.g. 5–10 attempts per 15 min per IP)
**Regression check:** Confirm normal login/register flow (a few attempts, real typos) is unaffected; only abusive volume is blocked.

---

### BE-10 — Missing security headers on API responses
**Issue:** No `helmet`-equivalent headers set on Express responses.
**Verify:** `curl -I https://<render-backend-url>/api/health` — review headers returned.
**Fix:**
- [ ] Add `helmet` middleware to `server/src/server.js` with sane defaults
**Regression check:** Confirm all API calls from the live frontend still succeed (check for any CORS/CSP interplay with FE-21).

---

### BE-11 — `.env` git history check
**Issue:** Need to confirm no real `.env` file was ever committed to git history, even if later removed.
**Verify:** `git log --all --full-history -- "*.env" "server/.env" ".env"` — check for any historical commits.
**Fix:**
- [ ] If found: treat every key in that historical file as compromised — rotate all of them (Supabase keys, DB password, any third-party API keys) regardless of whether the file was later deleted
- [ ] Optionally scrub history with `git filter-repo` if the exposure is severe (coordinate with the team before rewriting shared history)
**Regression check:** After rotation, confirm the app still connects to Supabase/DB with the new keys in all environments (local, Render, Vercel).

---

### BE-12 — Verbose error messages / stack traces in API responses
**Issue:** Confirm production error responses don't leak stack traces, file paths, or internal query details to the client.
**Verify:** Trigger a deliberate server error (e.g. malformed request causing an unhandled exception) and inspect the JSON response body.
**Fix:**
- [ ] Add/confirm a global error-handling middleware in Express that returns a generic message in production and logs the full detail server-side only
**Regression check:** Confirm legitimate error responses (e.g. "invalid credentials", "product not found") still return the correct user-facing message, just without internal detail.

---

### BE-13 — Dependency vulnerability audit
**Issue:** Unknown current state of known vulnerabilities in `server/` dependencies.
**Verify:** `cd server && npm audit` — review output for High/Critical findings.
**Fix:**
- [ ] Patch/upgrade flagged packages where a fix is available without breaking API compatibility
- [ ] For anything without a clean fix, document the risk and mitigation in this file rather than force-upgrading blindly
**Regression check:** Run the full backend test suite (or manual API smoke test) after any dependency bump — version bumps are the most likely category to silently break something.

---

### BE-14 — Health check endpoint information disclosure
**Issue:** Confirm `/api/health` doesn't return internal details (DB connection strings, versions, stack info) beyond a simple status.
**Verify:** `curl https://<render-backend-url>/api/health` — review response body.
**Fix:**
- [ ] Trim the response to a minimal `{ status: "ok" }` (or similar) if it currently returns more
**Regression check:** Confirm Render's health check configuration (in `render.yaml`) still passes against the trimmed response.

---

### BE-15 — File upload validation (seller CNIC/NTN documents)
**Issue:** Seller registration includes a document upload step — confirm file type, size, and content are validated server-side, and storage location isn't publicly readable without authorization.
**Verify:** Attempt to upload a non-document file (e.g. `.exe` renamed to `.pdf`, or an oversized file) through the seller registration API directly. Also check whether uploaded file URLs are guessable/public.
**Fix:**
- [ ] Enforce file type allow-list and max size server-side (not just in the frontend `accept` attribute)
- [ ] Confirm uploaded documents are stored in a private Supabase bucket with signed URLs / access control, not a public bucket
**Regression check:** Confirm legitimate PDF/JPG uploads at normal sizes still succeed through the real seller registration flow.

---

### BE-16 — Query construction review (SQLi surface)
**Issue:** Confirm no endpoint builds a raw SQL string from unsanitized user input.
**Verify:** `grep -rn "query(\`\|+ req\.\|\${req\." server/src/` — review any matches for string-concatenated queries.
**Fix:**
- [ ] Confirm all Supabase calls use the client's parameterized query builder (`.eq()`, `.match()`, etc.), not raw interpolated SQL
- [ ] If any raw query is found, convert to parameterized form
**Regression check:** Confirm the affected endpoint returns identical data for identical valid input after the change.

---

### BE-17 — Password handling
**Issue:** Confirm passwords are hashed with a modern algorithm (bcrypt/argon2) at an adequate cost factor, never stored or logged in plaintext.
**Verify:** Check the auth controller's registration/login logic and the `users` table schema. `grep -rn "console.log.*password" server/src/` to catch accidental logging.
**Fix:**
- [ ] Confirm bcrypt (or equivalent) with cost factor ≥ 10 is used
- [ ] Remove any logging statement that could print raw password/token values
**Regression check:** Confirm existing user accounts can still log in (don't invalidate existing hashes) and new registrations still work.

---

### BE-18 — Sensitive data in logs
**Issue:** Confirm server logs don't capture tokens, passwords, or full user objects.
**Verify:** Trigger login/register/checkout locally with verbose logging on, review console/log output.
**Fix:**
- [ ] Strip sensitive fields from any request/response logging middleware
**Regression check:** Confirm logging still captures enough for debugging (method, path, status, timing) without sensitive payloads.

---

### BE-19 — HTTPS enforcement
**Issue:** Confirm the backend (Render) and frontend (Vercel) both force HTTPS and don't serve mixed content.
**Verify:** `curl -I http://<render-backend-url>/api/health` — confirm a redirect to `https://`, not a plain 200 over HTTP.
**Fix:**
- [ ] Confirm Render's HTTPS enforcement is on (usually default) — if not, add a redirect middleware
**Regression check:** Confirm the frontend's API calls (which should already be HTTPS) are unaffected.

---

### BE-20 — API response over-fetching
**Issue:** Confirm endpoints don't return more fields than the frontend needs — e.g. a `/api/auth/me` or product/user endpoint accidentally including password hashes, internal flags, or other users' data in a list response.
**Verify:** Call each major GET endpoint with devtools/Postman and inspect the full response body for anything sensitive that isn't used by the UI.
**Fix:**
- [ ] Add explicit field selection (`.select('id, name, ...')`) on each query instead of returning full rows
**Regression check:** Confirm the frontend still receives every field it actually consumes — cross-check against FE component usage before trimming.

---

## Sign-off checklist (before merging `dev` → `main`)

- [ ] All FE-01 through FE-21 checked off or marked `N/A` with justification
- [ ] All BE-01 through BE-20 checked off or marked `N/A` with justification
- [ ] Full baseline smoke test (Section 0.6) passed on `dev`
- [ ] `npm audit` clean (or documented exceptions) on both `client/` and `server/`
- [ ] No console errors on a full click-through of `dev`
- [ ] Rotated any keys that were found exposed, confirmed new keys work in all environments
- [ ] README demo credentials updated/removed
- [ ] Final review by both frontend and backend developer of each other's changes before merge to `main`
