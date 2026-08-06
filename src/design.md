# Land10 — Design System Reference
### Extracted from the built `land10-v2.html` (as-shipped, source of truth)

> This supersedes the earlier `landdain-design.md` spec wherever the two disagree. The hero-search direction was rejected during build; v2 is a **navbar → sticky category strip → grid** structure with no hero. Breakpoints, type scale, and a few tokens also shifted slightly during implementation. Use this file, not the original spec, for building new screens.

---

## 1. Page Structure (top to bottom)

```
Navbar (sticky, top:0)
Category Bar (sticky, top:64px — stacks directly under navbar)
Main
  Intro strip (page title + result count — NOT a hero)
  Product Grid + Load More
Footer
```

Overlays (not in flow, triggered by state): Search Overlay · Cart Drawer · Register Modal (2-step + success) · Checkout Modal (form + success) · Toast.

**No hero section.** No large headline, no centered search bar, no imagery. The page goes straight from navbar to the category filter to product results — matching laindain.org's direct-to-grid pattern, not Alibaba's centerpiece-hero pattern.

---

## 2. Design Tokens (as implemented)

```css
/* COLOR */
--color-sage:        #A3C1BF   /* primary accent — buttons, active states, verified badge, focus border */
--color-sage-dark:   #85A6A3   /* hover/pressed sage */
--color-sage-tint:   #EEF3F2   /* light sage fill — product thumb bg, cart item thumb bg */
--color-off-white:   #F9F9F6   /* page background */
--color-surface:     #FFFFFF   /* cards, navbar (unscrolled), modals, drawer */
--color-black:       #000000   /* primary text */
--color-text-muted:  #5B5B58   /* secondary text, labels, meta */
--color-border:      #E9E8E2   /* hairlines, input borders */

/* TYPE — Poppins, weights 400/500/600 only */
--text-xs:   13px
--text-sm:   15px
--text-base: 17px   /* body default */
--text-lg:   20px   /* card/modal titles */
--text-xl:   26px   /* page title (intro h1) — largest text on the page */

Note: v2 has no --text-2xl / hero headline size. 26px is the ceiling.
```

- Font: `'Poppins', sans-serif`, loaded via Google Fonts (400/500/600).
- Base body: 17px / line-height 1.55, font-weight 400.
- `font-smoothing: antialiased`.

```css
/* RADIUS */
--radius-sm:   10px  /* inputs, steppers, chips-as-tags */
--radius-md:   16px  /* buttons, search input */
--radius-lg:   24px  /* cards, modals, drawer edges */
--radius-full: 999px /* category pills, badges */

/* SHADOW */
--shadow-rest:   0 1px 2px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.04)
--shadow-raised: 0 8px 32px rgba(0,0,0,.10)   /* hover state, modals, drawer, dropdowns */

/* MOTION */
--ease: cubic-bezier(0.4, 0, 0.2, 1)
--duration-fast: 150ms   /* hover, button press, chip toggle */
--duration-base: 250ms   /* drawer/modal/overlay open, navbar blur transition */
--duration-slow: 350ms   /* reserved for larger reveals */
```

`prefers-reduced-motion: reduce` is respected globally (all animation/transition durations collapse to 0.01ms).

---

## 3. Layout Grid & Breakpoints

```
.wrap { max-width: 1240px; margin: 0 auto; padding: 0 32px; }
  → padding drops to 16px at ≤767px
```

**Breakpoints actually used in code** (not the original 768/1024/1440 spec):
| Breakpoint | Effect |
|---|---|
| `≤1023px` | Product grid: 4 → 3 columns |
| `≤767px` | Product grid: 3 → 2 columns; `.wrap` padding 32→16px; footer grid 4→2 columns |
| `≤640px` | Navbar collapses to hamburger; modals/search-overlay switch to bottom-sheet |
| `≤480px` | Product grid: 2 → 1 column; form field-rows stack |

---

## 4. Navbar

- `position: sticky; top: 0; z-index: 200; height: 64px`
- **At rest:** solid `--color-off-white` background, transparent border.
- **On scroll** (`.scrolled`, triggered at `scrollY > 20`): background becomes `rgba(249,249,246,0.8)` + `backdrop-filter: blur(20px)`, plus a `1px solid --color-border` bottom hairline. Transition on background/blur/border is `--duration-base`.
- **Layout:** logo left (`Land10`, with a 26×26px sage rounded-square wordmark "L10") · right-aligned cluster only — **no center nav-link row** in the built version (Categories/Suppliers/How It Works links from the original spec were dropped in favor of the category bar doing that job).
- **Right cluster (desktop):** search icon → "Register as Seller" (primary button) → cart icon w/ count badge → (account icon not present in current build — only search/register/cart + hamburger placeholder).
- **Mobile (≤640px):** "Register as Seller" button hides; hamburger icon appears; search + cart icons remain.
- Icon buttons are `44×44px` (meets minimum touch-target), `radius-sm`, subtle `rgba(0,0,0,.04)` hover fill, `scale(0.96)` on press.
- Cart badge: small solid-black circle, white text, top-right of cart icon.

---

## 5. Category Bar (replaces the old hero's chip row)

- `position: sticky; top: 64px; z-index: 190` — sits directly beneath the navbar and stays pinned as the user scrolls, so filtering is always one tap away.
- Horizontal scroll strip, no visible scrollbar (`scrollbar-width: none`), bottom hairline border.
- Pills (`.cat-tab`): `38px` height, `radius-full`, `text-xs`/500 weight, transparent fill + `--color-border` outline at rest, `--color-text-muted` text.
- **Hover:** border → sage-dark, text → black.
- **Active:** solid sage fill, black text, sage border.
- 11 tabs total: "All Suppliers" + 10 category names, icon-mapped via emoji per category (used again on product thumbnails/cart).
- Selecting a pill live-filters the grid — no page navigation, no loading spinner.

---

## 6. Intro Strip (replaces hero headline)

- Plain flex row: page title (`<h1>`, `text-xl` / 26px / 600 weight) left, muted result count (`text-xs`) right.
- No subheadline, no CTA, no imagery. Purely a section label + live count. Padding `28px 0 8px`.

---

## 7. Product Grid & Card

**Grid:** `display:grid`, gap `16px` (12px on mobile).
- Desktop: 4 columns
- ≤1023px: 3 columns
- ≤767px: 2 columns, gap 12px
- ≤480px: 1 column

**Card (`.product-card`):**
- White surface, `radius-lg`, `shadow-rest` at rest.
- **Hover:** `shadow-raised` + `translateY(-4px)`, `--duration-fast` — the one lift/hover pattern used consistently for anything clickable (cards).
- Structure top→bottom:
  1. Square thumbnail (`aspect-ratio: 1/1`, sage-tint background, centered emoji icon as image placeholder)
  2. Body (16px padding, 8px gap): product/supplier name (15px/500) → verified badge (small check icon + sage-dark text) or "Unverified" label → one-line muted description (13px) → category tag (pill, off-white fill, 11px)
  3. Stepper row: "Min. Order" label + quantity stepper (−/input/+, bordered, 30px controls)
  4. Full-width primary "Add to Wholesale Cart" button (40px height)
- Adding to cart triggers a bottom-center toast confirmation (visibility-of-system-status pattern) rather than a silent state change.

**Load more:** centered secondary (outline) button below the grid.

---

## 8. Buttons

| Style | Look | Use |
|---|---|---|
| `.btn-primary` | Sage fill, black text | Main action — Register, Add to Cart, Continue, Submit, Place Order |
| `.btn-secondary` | Transparent, 1px black border | Secondary/back actions, Load more |
| `.btn-text` | No border, muted → black on hover | Low-emphasis text actions |
| `.btn:disabled` | Border-color fill, muted text, `not-allowed` cursor | e.g. Checkout button while cart is empty |

- Standard height 40px (48px for `.btn-block` full-width primary actions in drawers/modals).
- `radius-md` throughout.
- Press feedback: `scale(0.97)` on `:active`, 100–150ms — tactile but not bouncy.
- Never two equally-weighted buttons side by side except explicit Back/Continue pairs in multi-step flows, where primary is still visually dominant (fill vs. outline).

---

## 9. Overlays: Search / Cart Drawer / Modals

All overlays share one backdrop language: `rgba(0,0,0,.4)` + `backdrop-filter: blur(6–8px)`, fade in over `--duration-base`, and close on backdrop click or `Escape`. Only one overlay is ever open at a time (Escape closes all).

**Search overlay** — panel anchored near top (`10vh`) on desktop, becomes a bottom sheet on ≤640px. Auto-focused input, "Popular categories" quick-tap chips underneath.

**Cart drawer** — slides in from the right (`translateX`), full-height, `shadow-raised`. Header with close icon, scrollable item list (thumb + name + qty/subtotal + remove link), sticky footer with subtotal + primary checkout CTA (disabled state when empty, with an empty-state illustration/emoji + message rather than a blank panel).

**Register / Checkout modals** — centered card on desktop (`radius-lg` all corners, fade + `translateY(8px)→0` + `scale(.98→1)`); becomes a **bottom sheet** on ≤640px (`radius-lg` top corners only, slides up from `translateY(100%)`).
- Register is 2 steps with a persistent `"Step X of 2"` progress label, inline validation on blur (red border + one-line hint, not just on submit), and back-navigation that preserves entered data.
- Both flows end in a dedicated **success panel** (checkmark icon in sage circle + confirmation copy + single OK/Continue button) — every terminal action gets explicit confirmation, never a silent redirect.

---

## 10. Forms

- Inputs/selects: `46px` height, `radius-sm`, 1px `--color-border`, sage-dark border on focus (no default browser outline).
- Invalid state: red-ish border (`#C6564D`) + red hint text below the field.
- Two-column `field-row` on desktop, stacks to one column at ≤480px.
- Checkbox grid (2 columns) for multi-select options (e.g. sales channels).
- File upload shown as a dashed-border drop zone, not a native file input.

---

## 11. Footer

- 4-column grid on desktop: `1.3fr` (logo + one-line description) + 3× `1fr` (Categories / Company / Support link lists).
- Collapses to 2 columns at ≤767px.
- Column headers: 11px, 600 weight, muted, uppercase, letter-spacing.
- Link items: 13px, black, muted on hover.
- Bottom bar: hairline top border, copyright + "Made for Pakistani businesses 🇵🇰" tagline, space-between, wraps on small screens.
- Deliberately compact — no oversized multi-column sprawl.

---

## 12. Motion Summary (only where it communicates state)

| Interaction | Treatment |
|---|---|
| Card hover | Lift `-4px` + shadow increase, 150ms |
| Button press | Scale to 0.97, ~100–150ms |
| Icon button hover | Faint fill (`rgba(0,0,0,.04)`) |
| Category pill select | Background cross-fade, 150ms |
| Navbar scroll state | Background/blur/border fade, 250ms |
| Drawer open | Slide in from right, 250ms |
| Modal open (desktop) | Fade + slide-up 8px + scale .98→1, 250ms |
| Modal open (mobile) | Slide up from `translateY(100%)`, 250ms |
| Search/overlay open | Fade + slight vertical slide, 250ms |
| Toast | Fade + slide up 12px, 250ms, auto-dismiss ~2.4s |

No parallax, no auto-playing motion, nothing exceeding ~350ms on a primary element.

---

## 13. Notable Deviations from the Original `landdain-design.md` Spec

Use this file as the current source of truth; where these differ, the build below is what's live:

- **No hero section at all** — the spec's centered search bar + headline + subhead + trust line was dropped. The category bar now does the "scan and go" job the spec assigned to hero chips.
- **No center nav-link row** (Categories/Suppliers/How It Works/Sell on Land10) in the navbar — the sticky category bar replaces the "Categories" flyout entirely.
- **Type scale is smaller and simpler**: max size is 26px (page title), not the spec's 52px hero headline — consistent with "no hero."
- **Breakpoints differ**: build uses 1023 / 767 / 640 / 480px, not the spec's 768 / 1024 / 1440px system.
- **No account icon** in the current navbar build (search, register, cart, hamburger only).
- Category icons are implemented as emoji placeholders, not custom iconography yet.

---

## 14. Reuse Checklist for New Screens

When building additional pages (product detail, supplier profile, RFQ, order history, etc.), carry forward:
1. Same navbar (sticky, blur-on-scroll, same right-cluster order).
2. Same `.wrap` max-width/padding rules.
3. Same card shell (`radius-lg`, `shadow-rest` → `shadow-raised` + lift on hover) for any card-like content.
4. Same button hierarchy (one dominant primary sage button per screen/section).
5. Same modal/drawer/overlay backdrop + corner-radius + mobile-bottom-sheet convention for anything that interrupts the page.
6. Toast for any non-navigational confirmation (added, saved, removed) instead of silent updates.
7. Poppins-only, 400/500/600, no headline larger than ~26px unless a new screen explicitly needs a true page-title moment.
