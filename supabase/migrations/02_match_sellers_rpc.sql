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
