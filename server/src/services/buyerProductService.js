const supabase = require('../config/supabase');

/**
 * Service to handle Marketplace Product Catalog retrieval & filtering.
 */
class BuyerProductService {
  /**
   * Retrieve approved/active products with optional category and search filters
   * @param {Object} params
   * @param {string} [params.category] - Category ID or slug
   * @param {string} [params.search] - Search keyword for title or description
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Result limit
   * @returns {Promise<Object>} List of products and count
   */
  static async getApprovedProducts({ category, search, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug), seller_profiles(id, business_name)', { count: 'exact' });

    // Filter strictly by APPROVED or ACTIVE status
    query = query.in('status', ['APPROVED', 'ACTIVE']);

    // Category Filter: handles category ID or slug
    if (category) {
      // If valid UUID format, query by category_id directly, otherwise look up category by slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        query = query.eq('category_id', category);
      } else {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category.toLowerCase())
          .maybeSingle();

        if (catData) {
          query = query.eq('category_id', catData.id);
        } else {
          // If category slug does not exist, return empty set
          return { products: [], count: 0, page: pageNum, totalPages: 0 };
        }
      }
    }

    // Text Search Filter: matches title or description
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Sorting & Pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch marketplace products: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      products: data || [],
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  /**
   * Fetch full details and specifications for a single product
   * @param {string} productId - Product UUID
   * @returns {Promise<Object|null>}
   */
  static async getProductById(productId) {
    if (!productId) throw new Error('Product ID is required.');

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug), seller_profiles(id, business_name, business_address, current_status)')
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching product: ${error.message}`);
    }

    return data;
  }
}

module.exports = BuyerProductService;
