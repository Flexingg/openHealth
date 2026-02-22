import { supabase } from '../config/supabase.js'

/**
 * Serving service for managing food-specific serving sizes
 */
class ServingService {
  /**
   * Get all serving sizes for a specific food
   * @param {string} foodId - Food ID
   * @returns {Promise<Array>} Array of serving sizes
   */
  async getServingsForFood(foodId) {
    const { data, error } = await supabase
      .from('food_servings')
      .select('*')
      .eq('food_id', foodId)
      .order('grams', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get a single serving by ID
   * @param {string} id - Serving ID
   * @returns {Promise<Object>} Serving data
   */
  async getServingById(id) {
    const { data, error } = await supabase
      .from('food_servings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Create a new serving size for a food
   * @param {Object} serving - Serving data
   * @returns {Promise<Object>} Created serving
   */
  async createServing(serving) {
    const { data, error } = await supabase
      .from('food_servings')
      .insert(serving)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Create multiple serving sizes for a food
   * @param {Array} servings - Array of serving data
   * @returns {Promise<Array>} Created servings
   */
  async createServings(servings) {
    const { data, error } = await supabase
      .from('food_servings')
      .insert(servings)
      .select()
    
    if (error) throw error
    return data
  }

  /**
   * Update a serving size
   * @param {string} id - Serving ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated serving
   */
  async updateServing(id, updates) {
    const { data, error } = await supabase
      .from('food_servings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a serving size
   * @param {string} id - Serving ID
   */
  async deleteServing(id) {
    const { error } = await supabase
      .from('food_servings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Set a serving as the default for a food
   * @param {string} foodId - Food ID
   * @param {string} servingId - Serving ID to set as default
   * @returns {Promise<Object>} Updated serving
   */
  async setDefaultServing(foodId, servingId) {
    // First, remove default from all servings for this food
    await supabase
      .from('food_servings')
      .update({ is_default: false })
      .eq('food_id', foodId)
    
    // Then set the new default
    return this.updateServing(servingId, { is_default: true })
  }

  /**
   * Get the default serving for a food
   * @param {string} foodId - Food ID
   * @returns {Promise<Object|null>} Default serving or null
   */
  async getDefaultServing(foodId) {
    const { data, error } = await supabase
      .from('food_servings')
      .select('*')
      .eq('food_id', foodId)
      .eq('is_default', true)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data
  }

  /**
   * Common serving size templates for different food categories
   * These can be used to auto-populate servings for new foods
   */
  getCommonServings(category) {
    const templates = {
      produce: [
        { name: 'small', grams: 100 },
        { name: 'medium', grams: 150, is_default: true },
        { name: 'large', grams: 200 },
        { name: 'cup', grams: 150 },
        { name: 'piece', grams: 150 }
      ],
      dairy: [
        { name: 'cup', grams: 244, is_default: true },
        { name: 'tbsp', grams: 15 },
        { name: 'oz', grams: 28 },
        { name: 'slice', grams: 28 }
      ],
      meat: [
        { name: 'oz', grams: 28, is_default: true },
        { name: 'g', grams: 1 },
        { name: 'lb', grams: 454 },
        { name: 'piece', grams: 100 }
      ],
      grains: [
        { name: 'cup', grams: 200, is_default: true },
        { name: 'serving', grams: 50 },
        { name: 'piece', grams: 30 }
      ],
      beverages: [
        { name: 'cup', grams: 240, is_default: true },
        { name: 'fl oz', grams: 30 },
        { name: 'ml', grams: 1 },
        { name: 'liter', grams: 1000 }
      ],
      default: [
        { name: 'serving', grams: 100, is_default: true },
        { name: 'g', grams: 1 },
        { name: 'oz', grams: 28 },
        { name: 'cup', grams: 240 }
      ]
    }
    
    return templates[category] || templates.default
  }

  /**
   * Calculate grams from a serving size
   * @param {number} size - Size value
   * @param {string} unit - Unit name
   * @param {string} foodId - Food ID (for food-specific servings)
   * @returns {Promise<number>} Grams equivalent
   */
  async calculateGrams(size, unit, foodId) {
    // First try to find a food-specific serving
    if (foodId) {
      const { data, error } = await supabase
        .from('food_servings')
        .select('grams')
        .eq('food_id', foodId)
        .eq('name', unit)
        .single()
      
      if (data) {
        return data.grams * size
      }
    }
    
    // Fall back to common conversions
    const commonConversions = {
      'g': 1,
      'gram': 1,
      'grams': 1,
      'oz': 28.35,
      'ounce': 28.35,
      'ounces': 28.35,
      'lb': 453.59,
      'pound': 453.59,
      'pounds': 453.59,
      'cup': 240,
      'cups': 240,
      'tbsp': 15,
      'tablespoon': 15,
      'tsp': 5,
      'teaspoon': 5,
      'ml': 1,
      'milliliter': 1,
      'liter': 1000,
      'l': 1000,
      'fl oz': 29.57,
      'fluid ounce': 29.57,
      'small': 100,
      'medium': 150,
      'large': 200,
      'piece': 100,
      'slice': 30,
      'serving': 100
    }
    
    const gramsPerUnit = commonConversions[unit.toLowerCase()] || 100
    return gramsPerUnit * size
  }
}

export const servingService = new ServingService()
export default servingService
