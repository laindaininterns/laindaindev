# AI Matching Engine — Implementation Specification

> **Branch:** `haseeb/ai-matching-engine` (forked from `mohsin/backend-setup`)
> **Author:** Haseeb
> **Status:** Draft — awaiting team review before code implementation

---

## 1. Problem Statement

Without a curating layer, every buyer on Lain Dain sees an undifferentiated list of sellers with no way to judge who is actually reliable, cheap, or fast. A human dealer solves this with local knowledge; we solve it with a **heuristic scoring engine** that ranks sellers in real-time by price, reliability, delivery speed, proximity, and a controlled new-seller boost.

### Design Principles

| Principle | Rationale |
|---|---|
| **Heuristic scoring, not ML inference** | Zero cold-start latency. No GPU dependency. All logic runs inside Postgres or the Node.js service layer — deterministic, debuggable, and fast. |
| **Fair exposure for new sellers** | Inspired by marketplace ranking systems (Alibaba, AliExpress): new sellers receive a temporary, controlled visibility boost so the platform can collect impression data. The boost decays naturally as data accumulates. |
| **Computed at query time, cached aggressively** | The scoring formula runs as a Postgres RPC (stored function). Results are cached per-category in Upstash Redis for 5–10 minutes. |

---

## 2. Schema Changes

All changes are additive — no existing columns are modified or dropped.

### 2.1 Enable PostGIS Extension

```sql
-- Run once in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2.2 Add Location Columns

```sql
-- sellers: where the seller ships from
ALTER TABLE sellers
  ADD COLUMN latitude  DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION,
  ADD COLUMN location  geography(Point, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED;

CREATE INDEX idx_sellers_location ON sellers USING GIST (location);

-- retailers: where the buyer wants delivery
ALTER TABLE retailers
  ADD COLUMN latitude  DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION,
  ADD COLUMN location  geography(Point, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED;

CREATE INDEX idx_retailers_location ON retailers USING GIST (location);
```

**How we collect lat/lng:**
- Frontend calls the browser Geolocation API or Google Maps Places Autocomplete.
- On seller registration (`POST /api/sellers/profile`) and retailer signup, the frontend sends `{ latitude, longitude }` alongside existing payload fields.
- For guest checkout, the guest address form includes a location picker; the `orders` table already has `guest_address` — we add `guest_latitude` and `guest_longitude` columns.

```sql
ALTER TABLE orders
  ADD COLUMN guest_latitude  DOUBLE PRECISION,
  ADD COLUMN guest_longitude DOUBLE PRECISION;
```

### 2.3 Seller Performance Metrics Table

Instead of a materialized view (which requires manual `REFRESH`), we use a dedicated table updated by a lightweight cron job (Supabase pg_cron or a scheduled Node.js task).

```sql
CREATE TABLE seller_metrics (
  seller_id          UUID PRIMARY KEY REFERENCES sellers(id),
  avg_rating         NUMERIC(3,2)  DEFAULT 0,       -- from reviews table
  total_reviews      INTEGER       DEFAULT 0,
  fulfillment_hours  NUMERIC(8,2)  DEFAULT NULL,     -- avg hours: placed → shipped
  completion_rate    NUMERIC(5,4)  DEFAULT 0,        -- delivered / (delivered + cancelled)
  total_orders       INTEGER       DEFAULT 0,
  total_impressions  INTEGER       DEFAULT 0,        -- how many times shown in results
  total_clicks       INTEGER       DEFAULT 0,        -- how many times retailer clicked
  updated_at         TIMESTAMPTZ   DEFAULT now()
);
```

### 2.4 New-Seller Boost Tracking

```sql
CREATE TABLE seller_boost (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES sellers(id) UNIQUE,
  category_id     UUID REFERENCES categories(id),       -- boost is per-category
  boost_score     NUMERIC(4,2) DEFAULT 15.0,             -- initial boost points (out of 100)
  impressions_cap INTEGER      DEFAULT 500,              -- max impressions before boost expires
  impressions_used INTEGER     DEFAULT 0,
  started_at      TIMESTAMPTZ  DEFAULT now(),
  expires_at      TIMESTAMPTZ  DEFAULT now() + INTERVAL '14 days',
  is_active       BOOLEAN      DEFAULT true
);

-- Only 1-2 boosted sellers per category at a time
-- Enforced in application logic, not a DB constraint
CREATE INDEX idx_seller_boost_active ON seller_boost (category_id) WHERE is_active = true;
```

---

## 3. Ranking Algorithm

### 3.1 Scoring Formula

Every seller-product pair visible for a query gets a **Total Score** (0–100 scale):

```
Total Score =
    (W_price    × Price Score)          -- lower price = higher score
  + (W_rating   × Rating Score)         -- avg review rating normalized
  + (W_speed    × Speed Score)          -- faster fulfillment = higher score
  + (W_complete × Completion Score)     -- higher delivery success rate = higher
  + (W_distance × Distance Score)      -- closer to buyer = higher score
  + Boost Bonus                         -- new-seller boost (decays)
```

### 3.2 Default Weights

| Factor | Weight | Notes |
|---|---|---|
| `W_price` | **0.30** | Price competitiveness is king in B2B |
| `W_rating` | **0.20** | Social proof / quality signal |
| `W_speed` | **0.20** | How fast they ship — critical for retailers restocking |
| `W_complete` | **0.15** | Track record of not cancelling orders |
| `W_distance` | **0.15** | Geographic proximity for shipping cost/time |

> Weights are stored in `platform_settings` so admin can tune without a redeploy:
> `setting_key = 'matching_weight_price'`, `value = '0.30'`, etc.

### 3.3 Sub-Score Calculations

#### Price Score (0–100)
```
price_min = cheapest product price in this category
price_max = most expensive product price in this category

Price Score = 100 × (1 - (this_price - price_min) / (price_max - price_min + 0.01))
```
If all prices are equal, everyone gets 100.

#### Rating Score (0–100)
```
Rating Score = (avg_rating / 5.0) × 100

-- With a minimum-review damping:
-- If total_reviews < 5, apply a confidence penalty:
--   Rating Score = Rating Score × (total_reviews / 5)
```

#### Speed Score (0–100)
```
fastest = MIN(fulfillment_hours) across all sellers in category
slowest = MAX(fulfillment_hours) across all sellers in category

Speed Score = 100 × (1 - (this_hours - fastest) / (slowest - fastest + 0.01))
```
If a seller has no order history (`fulfillment_hours IS NULL`), assign a neutral score of 50.

#### Completion Score (0–100)
```
Completion Score = completion_rate × 100
```
New sellers with 0 orders get a neutral 70 (slight benefit of the doubt).

#### Distance Score (0–100)
```
distance_km = ST_Distance(seller.location, buyer.location) / 1000

-- Cap at 500 km for normalization
Distance Score = 100 × (1 - LEAST(distance_km, 500) / 500)
```
A seller 0 km away scores 100. A seller 500+ km away scores 0.

### 3.4 New-Seller Boost System

**Inspired by Alibaba's new-merchant exposure program and AliExpress's cold-start ranking.**

The goal: give new sellers *just enough* visibility to gather data (impressions, clicks, first orders), then let their organic metrics determine their rank.

#### How It Works

1. **On seller KYC approval**, the system auto-creates a `seller_boost` row for the seller's primary category.
2. **Boost score starts at 15 points** (on the 0–100 Total Score scale). This is significant enough to push a new seller into the top 3–5 results, but not enough to permanently outrank a verified seller with a 4.8★ rating and 200 orders.
3. **Boost decays linearly** based on impressions consumed:
   ```
   effective_boost = boost_score × (1 - impressions_used / impressions_cap)
   ```
   After 500 impressions, effective_boost = 0 regardless.
4. **Hard expiry**: Boost auto-expires after 14 days even if the impression cap wasn't reached.
5. **Category slot limit**: At most **2 boosted sellers per category** are active at any time. When a slot opens (previous seller's boost expired), the next-in-queue new seller gets activated. This prevents flooding the top results with all-new sellers.
6. **After boost expires**, the seller competes purely on organic metrics. If they didn't get orders/reviews during the boost window, they naturally rank lower.

#### Boost Queue Logic (Application Layer)

```
On seller approval:
  1. Check active boosts for seller's category
  2. If active_count < 2:
       → Create seller_boost with is_active = true
  3. Else:
       → Create seller_boost with is_active = false (queued)
       → A cron job checks every hour: if a slot opens, activate next queued seller (FIFO by created_at)
```

---

## 4. Postgres RPC — `match_sellers`

The core engine runs as a Postgres function called from the Node.js backend.

```sql
CREATE OR REPLACE FUNCTION match_sellers(
  p_category_id    UUID,
  p_buyer_lat      DOUBLE PRECISION,
  p_buyer_lng      DOUBLE PRECISION,
  p_search_query   TEXT              DEFAULT NULL,
  p_query_embedding vector(1536)     DEFAULT NULL,   -- pgvector: pre-computed by Node.js
  p_limit          INTEGER           DEFAULT 20,
  p_offset         INTEGER           DEFAULT 0,
  -- Weights (fetched from platform_settings or passed directly)
  p_w_price        NUMERIC           DEFAULT 0.25,
  p_w_rating       NUMERIC           DEFAULT 0.20,
  p_w_speed        NUMERIC           DEFAULT 0.15,
  p_w_complete     NUMERIC           DEFAULT 0.10,
  p_w_distance     NUMERIC           DEFAULT 0.15,
  p_w_relevance    NUMERIC           DEFAULT 0.15    -- semantic search relevance
)
RETURNS TABLE (
  product_id        UUID,
  product_name      TEXT,
  seller_id         UUID,
  store_name        TEXT,
  base_price        NUMERIC,
  avg_rating        NUMERIC,
  total_reviews     INTEGER,
  fulfillment_hours NUMERIC,
  completion_rate   NUMERIC,
  distance_km       NUMERIC,
  semantic_similarity NUMERIC,       -- cosine similarity (0–1)
  total_score       NUMERIC,
  is_boosted        BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
  v_buyer_location geography;
  v_price_min      NUMERIC;
  v_price_max      NUMERIC;
  v_speed_min      NUMERIC;
  v_speed_max      NUMERIC;
BEGIN
  -- Build buyer location point
  v_buyer_location := ST_SetSRID(ST_MakePoint(p_buyer_lng, p_buyer_lat), 4326)::geography;

  -- Get price range for normalization within category
  SELECT MIN(p.base_price), MAX(p.base_price)
    INTO v_price_min, v_price_max
    FROM products p
   WHERE p.category_id = p_category_id
     AND p.status = 'active';

  -- Get speed range for normalization
  SELECT MIN(sm.fulfillment_hours), MAX(sm.fulfillment_hours)
    INTO v_speed_min, v_speed_max
    FROM seller_metrics sm
    JOIN products p ON p.seller_id = sm.seller_id
   WHERE p.category_id = p_category_id
     AND sm.fulfillment_hours IS NOT NULL;

  RETURN QUERY
  SELECT
    p.id                                          AS product_id,
    p.name                                        AS product_name,
    s.id                                          AS seller_id,
    s.store_name                                  AS store_name,
    p.base_price                                  AS base_price,
    COALESCE(sm.avg_rating, 0)                    AS avg_rating,
    COALESCE(sm.total_reviews, 0)                 AS total_reviews,
    sm.fulfillment_hours                          AS fulfillment_hours,
    COALESCE(sm.completion_rate, 0)               AS completion_rate,
    ROUND((ST_Distance(s.location, v_buyer_location) / 1000)::NUMERIC, 2)
                                                  AS distance_km,

    -- Semantic similarity score (exposed for debugging / future use)
    CASE WHEN p_query_embedding IS NOT NULL AND p.embedding IS NOT NULL
         THEN ROUND((1.0 - (p.embedding <=> p_query_embedding))::NUMERIC, 4)
         ELSE NULL
    END                                           AS semantic_similarity,

    -- === TOTAL SCORE ===
    ROUND((
      -- Price Score
      p_w_price * (100.0 * (1.0 - (p.base_price - v_price_min)
                    / GREATEST(v_price_max - v_price_min, 0.01)))

      -- Rating Score (with review-count damping)
      + p_w_rating * (
          (COALESCE(sm.avg_rating, 0) / 5.0) * 100.0
          * CASE WHEN COALESCE(sm.total_reviews, 0) < 5
                 THEN COALESCE(sm.total_reviews, 0)::NUMERIC / 5.0
                 ELSE 1.0
            END
        )

      -- Speed Score
      + p_w_speed * (
          CASE WHEN sm.fulfillment_hours IS NULL THEN 50.0
               ELSE 100.0 * (1.0 - (sm.fulfillment_hours - COALESCE(v_speed_min, 0))
                    / GREATEST(COALESCE(v_speed_max, 1) - COALESCE(v_speed_min, 0), 0.01))
          END
        )

      -- Completion Score
      + p_w_complete * (
          CASE WHEN COALESCE(sm.total_orders, 0) = 0 THEN 70.0
               ELSE COALESCE(sm.completion_rate, 0) * 100.0
          END
        )

      -- Distance Score
      + p_w_distance * (
          100.0 * (1.0 - LEAST(
            ST_Distance(s.location, v_buyer_location) / 1000.0, 500.0
          ) / 500.0)
        )

      -- New Seller Boost
      + COALESCE(
          (SELECT sb.boost_score * (1.0 - sb.impressions_used::NUMERIC / sb.impressions_cap)
             FROM seller_boost sb
            WHERE sb.seller_id = s.id
              AND sb.category_id = p_category_id
              AND sb.is_active = true
              AND sb.expires_at > now()
              AND sb.impressions_used < sb.impressions_cap
          ), 0
        )

    -- Semantic Relevance Score (pgvector cosine similarity)
    + p_w_relevance * (
        CASE WHEN p_query_embedding IS NOT NULL AND p.embedding IS NOT NULL
             THEN (1.0 - (p.embedding <=> p_query_embedding)) * 100.0
             ELSE 50.0  -- neutral score when no embedding available
        END
      )

    ), 2)                                         AS total_score,

    -- Flag if this result is boosted
    EXISTS (
      SELECT 1 FROM seller_boost sb
       WHERE sb.seller_id = s.id
         AND sb.category_id = p_category_id
         AND sb.is_active = true
         AND sb.expires_at > now()
    )                                             AS is_boosted

  FROM products p
  JOIN sellers s    ON s.id = p.seller_id
  LEFT JOIN seller_metrics sm ON sm.seller_id = s.id

  WHERE p.category_id = p_category_id
    AND p.status = 'active'
    AND s.kyc_status = 'approved'
    AND s.account_status = 'active'
    AND s.location IS NOT NULL

    -- Hybrid search: pgvector semantic similarity + keyword ILIKE fallback
    AND (
      p_search_query IS NULL
      OR (
        -- If we have embeddings, use cosine distance threshold (< 0.4 = relevant)
        (p_query_embedding IS NOT NULL AND p.embedding IS NOT NULL
         AND (p.embedding <=> p_query_embedding) < 0.4)
        -- Always include keyword matches as fallback
        OR p.name ILIKE '%' || p_search_query || '%'
      )
    )

  ORDER BY total_score DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;
```

---

## 5. New API Endpoints

### 5.1 `GET /api/recommendations`

**Purpose:** Returns ranked products/sellers for a buyer in a category.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category_id` | UUID (query) | Yes | Which product category to rank |
| `latitude` | number (query) | Yes | Buyer's latitude |
| `longitude` | number (query) | Yes | Buyer's longitude |
| `search` | string (query) | No | Text search filter |
| `limit` | number (query) | No | Page size (default 20) |
| `offset` | number (query) | No | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "product_id": "...",
      "product_name": "Industrial Cotton Fabric 50m",
      "seller_id": "...",
      "store_name": "Karachi Textiles Ltd",
      "base_price": 2500.00,
      "avg_rating": 4.6,
      "total_reviews": 38,
      "fulfillment_hours": 18.5,
      "completion_rate": 0.97,
      "distance_km": 12.4,
      "total_score": 82.35,
      "is_boosted": false
    }
  ],
  "meta": {
    "weights": { "price": 0.30, "rating": 0.20, "speed": 0.20, "completion": 0.15, "distance": 0.15 },
    "total_results": 47,
    "limit": 20,
    "offset": 0
  }
}
```

### 5.2 `POST /api/recommendations/impression` _(async, fire-and-forget)_

**Purpose:** Called by the frontend when recommendation results are rendered. Increments `seller_boost.impressions_used` and `seller_metrics.total_impressions` for each seller shown.

> **Async implementation:** The frontend sends this request and does **not** await a response. The backend accepts with `202 Accepted` immediately and processes the DB updates in the background via `setImmediate()` / a microtask. This ensures zero impact on UI responsiveness.

**Payload:**
```json
{
  "seller_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "category_id": "..."
}
```

**Response:** `202 Accepted` (empty body, no waiting)

### 5.3 `POST /api/recommendations/click` _(async, fire-and-forget)_

**Purpose:** Called when a retailer clicks on a specific seller/product from the recommendation list. Increments `seller_metrics.total_clicks`. Same async pattern as impressions.

**Payload:**
```json
{
  "seller_id": "...",
  "product_id": "..."
}
```

**Response:** `202 Accepted` (empty body, no waiting)

### 5.4 `GET /api/admin/matching/weights` & `PUT /api/admin/matching/weights`

**Purpose:** Admin endpoints to view and adjust the ranking weights in `platform_settings` without a code redeploy. The `total_score` itself is **never exposed** to the admin dashboard or any public API — it is purely an internal ranking signal.

---

## 6. Backend Service Architecture

Following the existing modular monolith pattern (`/src/controllers`, `/src/services`, `/src/routes`):

```
src/
├── config/
│   └── googleMaps.js                 -- Google Maps Geocoding client (API key from env)
├── routes/
│   └── recommendationRoutes.js       -- Express router
├── controllers/
│   └── recommendationController.js   -- Request handling, validation
├── services/
│   ├── matchingEngine.js             -- Core: calls Supabase RPC, applies caching
│   ├── embeddingService.js           -- Generates query embeddings via OpenAI text-embedding-3-small
│   ├── boostManager.js               -- Boost lifecycle: activate, queue, decay, expire
│   ├── impressionTracker.js          -- Async fire-and-forget impression/click recording
│   └── metricsAggregator.js          -- Cron job: recompute seller_metrics from orders/reviews
```

### Embedding Pipeline (pgvector)

The `products.embedding` column (`vector(1536)`) already exists in the schema. Here's the full flow:

1. **Product creation / update** → `embeddingService.js` calls OpenAI `text-embedding-3-small` with the product name + description → stores the resulting 1536-dim vector in `products.embedding`.
2. **Search query** → `matchingEngine.js` calls `embeddingService.generateQueryEmbedding(searchText)` → passes the vector as `p_query_embedding` to the `match_sellers()` RPC.
3. **Inside Postgres** → cosine distance (`<=>`) computes semantic similarity. Products with `embedding <=> query_embedding < 0.4` are considered relevant. The similarity score also contributes 15% to the total ranking score.
4. **Fallback** → If a product has no embedding yet (legacy data), the function falls back to keyword `ILIKE` matching and assigns a neutral 50 for the relevance sub-score.

### Google Maps Geocoding

- API key stored in `.env` as `GOOGLE_MAPS_API_KEY`
- Used as a **backend geocoding fallback** when the frontend cannot provide lat/lng directly (e.g., seller enters a text address during registration)
- `src/config/googleMaps.js` exports a `geocodeAddress(addressString)` → `{ latitude, longitude }` helper
- Primary flow: frontend uses browser Geolocation API or Google Places Autocomplete and sends coords directly

### Async Impression & Click Tracking

`impressionTracker.js` handles the fire-and-forget pattern:

```javascript
// In the controller:
res.status(202).send(); // Respond immediately

// Process in background (non-blocking)
setImmediate(async () => {
  await impressionTracker.recordImpressions(sellerIds, categoryId);
  // Updates seller_metrics.total_impressions
  // Updates seller_boost.impressions_used (for boosted sellers)
});
```

This ensures the frontend never waits for analytics writes.

### How the Backend Team Calls the AI Engine

Your Node.js endpoints don't need to do any heavy lifting. The `matchingEngine.js` service just calls the database RPC using the Supabase JavaScript client:

```javascript
// src/services/matchingEngine.js
import { supabase } from '../config/supabaseClient.js';
import { generateQueryEmbedding } from './embeddingService.js';

export async function getRecommendations(categoryId, lat, lng, searchQuery = null) {
  // 1. Generate embedding if search query exists
  let queryEmbedding = null;
  if (searchQuery) {
    queryEmbedding = await generateQueryEmbedding(searchQuery);
  }

  // 2. Call the AI Engine in Postgres
  const { data, error } = await supabase.rpc('match_sellers', {
    p_category_id: categoryId,
    p_buyer_lat: lat,
    p_buyer_lng: lng,
    p_search_query: searchQuery,
    p_query_embedding: queryEmbedding
    // Weights use the defaults defined in SQL unless you override them here
  });

  if (error) throw error;
  return data; // Perfect, ranked list of sellers!
}
```

### Caching Strategy (Upstash Redis)

- **Cache key:** `matching:cat:{category_id}:loc:{lat_rounded}:{lng_rounded}`
- **TTL:** 5 minutes for category-level results
- **Invalidation:** On new order placed, new review, or seller status change → delete matching keys for affected categories
- Location is rounded to 1 decimal (~11 km precision) for cache hit rate

### Metrics Aggregation Cron

Runs every **30 minutes** (via `node-cron` or Supabase `pg_cron`):

1. Recompute `avg_rating` and `total_reviews` from `reviews` table
2. Recompute `fulfillment_hours` from `order_status_history` (avg time between `placed` and `shipped`)
3. Recompute `completion_rate` from `orders` (delivered vs cancelled)
4. Update `seller_metrics.updated_at`

### Boost Manager Cron

Runs every **1 hour**:

1. Expire any `seller_boost` rows past `expires_at` or over `impressions_cap` → set `is_active = false`
2. For each category with fewer than 2 active boosts, activate the next queued seller (FIFO)

---

## 7. File Changes Summary

| Action | File / Table | Description |
|---|---|---|
| **ALTER** | `sellers` table | Add `latitude`, `longitude`, `location` columns |
| **ALTER** | `retailers` table | Add `latitude`, `longitude`, `location` columns |
| **ALTER** | `orders` table | Add `guest_latitude`, `guest_longitude` columns |
| **CREATE** | `seller_metrics` table | Aggregated performance data |
| **CREATE** | `seller_boost` table | New-seller boost tracking |
| **CREATE** | `match_sellers()` function | Postgres RPC for hybrid ranking |
| **NEW** | `src/config/googleMaps.js` | Google Maps Geocoding client |
| **NEW** | `src/routes/recommendationRoutes.js` | Express router |
| **NEW** | `src/controllers/recommendationController.js` | Request handler |
| **NEW** | `src/services/matchingEngine.js` | Core ranking service |
| **NEW** | `src/services/embeddingService.js` | OpenAI embedding generation for queries & products |
| **NEW** | `src/services/boostManager.js` | Boost lifecycle manager |
| **NEW** | `src/services/impressionTracker.js` | Async fire-and-forget impression/click tracking |
| **NEW** | `src/services/metricsAggregator.js` | Periodic metrics recomputation |
| **UPDATE** | `docs/database-schema.md` | Add new tables/columns documentation |
| **UPDATE** | `docs/api_endpoints.md` | Add recommendation endpoints |
| **UPDATE** | `docs/checklist.md` | Add Stage 7 for matching engine tasks |

---

## 8. Verification Plan

### Automated Tests

```bash
# Unit test: scoring formula with known inputs
npm test -- --grep "matching engine"

# Integration test: recommendation endpoint
npm test -- --grep "GET /api/recommendations"
```

### Manual Test Scenarios

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Seed 5 sellers at varying distances, prices, ratings. Query as a buyer. | Cheapest + closest + highest-rated seller ranks #1 |
| 2 | Register a brand-new seller in a category with 2+ existing sellers | New seller appears in top 3–5 due to boost |
| 3 | Simulate 500 impressions for the boosted seller | Boost decays to 0; seller drops to organic rank |
| 4 | Register 5 new sellers at once in the same category | Only 2 receive active boost; other 3 are queued |
| 5 | Admin changes `matching_weight_price` from 0.30 to 0.50 | Price becomes dominant factor; cheapest seller rises |
| 6 | Seller with 0 reviews but 15-point boost vs. seller with 4.8★ and 200 orders | Established seller still ranks higher (boost alone ≈ 15 points, established seller organic ≈ 70–85 points) |

---

## 9. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | **Google Maps API key** | Backend-provisioned via `GOOGLE_MAPS_API_KEY` env variable. Used as geocoding fallback when the frontend can't send coords directly. |
| 2 | **Impression tracking** | **Async, fire-and-forget.** Backend responds `202 Accepted` immediately; DB writes happen via `setImmediate()` in the background. Zero UI blocking. |
| 3 | **pgvector semantic search** | **Integrated now.** Uses OpenAI `text-embedding-3-small` (1536-dim) for both product embeddings and query embeddings. Hybrid search: cosine similarity + keyword ILIKE fallback. Relevance contributes 15% to the total score. |
| 4 | **Admin dashboard visibility** | **Internal ranking only.** `total_score` is never exposed to the admin panel or any public-facing API. Admin can only tune the weights via `PUT /api/admin/matching/weights`. |
