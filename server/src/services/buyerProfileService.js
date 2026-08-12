const supabase = require('../config/supabase');

/**
 * Service to handle Buyer Profile business logic and database interactions.
 */
class BuyerProfileService {
  /**
   * Retrieve buyer profile by user_id
   * @param {string} userId - UUID of logged in user
   * @returns {Promise<Object|null>}
   */
  static async getProfileByUserId(userId) {
    if (!userId) throw new Error('User ID is required.');

    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('*, users(email, role)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching buyer profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Initialize or create a new buyer profile for a logged-in user
   * @param {string} userId 
   * @param {Object} profileData 
   * @returns {Promise<Object>}
   */
  static async createProfile(userId, profileData = {}) {
    if (!userId) throw new Error('User ID is required to create buyer profile.');

    // Check if profile already exists
    const existing = await this.getProfileByUserId(userId);
    if (existing) {
      return existing;
    }

    const { phone_number, contact_number, shipping_address, billing_address, full_name } = profileData;
    const phone = phone_number || contact_number || null;

    const payload = {
      user_id: userId,
      phone_number: phone,
      contact_number: phone,
      shipping_address: shipping_address || null,
      billing_address: billing_address || null,
    };

    if (full_name) payload.full_name = full_name;

    const { data, error } = await supabase
      .from('buyer_profiles')
      .insert(payload)
      .select('*, users(email, role)')
      .single();

    if (error) {
      throw new Error(`Failed to create buyer profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Update existing buyer profile
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  static async updateProfile(userId, updates = {}) {
    if (!userId) throw new Error('User ID is required to update profile.');

    // Ensure buyer profile exists
    let profile = await this.getProfileByUserId(userId);
    if (!profile) {
      profile = await this.createProfile(userId, updates);
    }

    const allowedFields = ['phone_number', 'contact_number', 'shipping_address', 'billing_address', 'full_name'];
    const payload = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        payload[key] = updates[key];
      }
    }

    // Keep phone_number and contact_number in sync if either is updated
    if (updates.phone_number !== undefined && updates.contact_number === undefined) {
      payload.contact_number = updates.phone_number;
    } else if (updates.contact_number !== undefined && updates.phone_number === undefined) {
      payload.phone_number = updates.contact_number;
    }

    if (Object.keys(payload).length === 0) {
      return profile;
    }

    const { data, error } = await supabase
      .from('buyer_profiles')
      .update(payload)
      .eq('user_id', userId)
      .select('*, users(email, role)')
      .single();

    if (error) {
      throw new Error(`Failed to update buyer profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Helper to ensure buyer profile exists and return its UUID
   * @param {string} userId 
   * @returns {Promise<string>} buyer_profile_id
   */
  static async getOrCreateProfileId(userId) {
    let profile = await this.getProfileByUserId(userId);
    if (!profile) {
      profile = await this.createProfile(userId);
    }
    return profile.id;
  }
}

module.exports = BuyerProfileService;
