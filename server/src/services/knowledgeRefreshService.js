const { getCatalogSummary } = require('../data/knowledgeBase');

let cachedCatalog = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Knowledge Refresh Service (Section 6.2)
 * Ensures Rahi reads fresh catalog snapshots with a 60-second in-memory TTL.
 */
async function getFreshCatalogSummary(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedCatalog && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedCatalog;
  }

  try {
    const freshCatalog = await getCatalogSummary();
    cachedCatalog = freshCatalog;
    lastFetchTime = now;
    return freshCatalog;
  } catch (err) {
    console.warn('Knowledge refresh service fallback error:', err.message);
    if (cachedCatalog) return cachedCatalog;
    return [];
  }
}

module.exports = {
  getFreshCatalogSummary,
};
