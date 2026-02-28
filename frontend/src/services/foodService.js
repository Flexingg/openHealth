import { supabase } from '../config/supabase.js'
import { servingService } from './servingService.js'

/**
 * Food service for interacting with the foods table
 */
class FoodService {
  /**
   * Search for foods by name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of food items
   */
  async searchFoods(searchTerm, limit = 20) {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(limit)
    
    if (error) throw error
    return data
  }

  /**
   * Get a food by ID
   * @param {string} id - Food ID
   * @returns {Promise<Object>} Food item
   */
  async getFoodById(id) {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Create a new food with optional serving sizes
   * @param {Object} food - Food data
   * @param {Array} commonServings - Optional array of serving sizes
   * @returns {Promise<Object>} Created food
   */
  async createFood(food, commonServings = null) {
    // Extract serving sizes from food if present
    const servings = commonServings || food.common_servings || null
    
    // Remove common_servings from food object before insert
    const foodData = { ...food }
    delete foodData.common_servings
    
    // Calculate per-100g values if serving_grams is provided
    if (foodData.serving_grams && foodData.calories) {
      const multiplier = 100 / foodData.serving_grams
      foodData.calories_per_100g = Math.round(foodData.calories * multiplier * 10) / 10
      foodData.protein_per_100g = Math.round((foodData.protein || 0) * multiplier * 10) / 10
      foodData.carbs_per_100g = Math.round((foodData.carbs || 0) * multiplier * 10) / 10
      foodData.fat_per_100g = Math.round((foodData.fat || 0) * multiplier * 10) / 10
    }
    
    const { data, error } = await supabase
      .from('foods')
      .insert(foodData)
      .select()
      .single()
    
    if (error) throw error
    
    // Create serving sizes if provided
    if (servings && servings.length > 0 && data.id) {
      try {
        const servingRecords = servings.map((s, index) => ({
          food_id: data.id,
          name: s.name,
          grams: s.grams,
          is_default: index === 0
        }))
        
        await servingService.createServings(servingRecords)
      } catch (servingError) {
        console.error('Failed to create serving sizes:', servingError)
        // Don't throw - food was created successfully
      }
    }
    
    return data
  }

  /**
   * Get recent foods for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Recent foods
   */
  async getRecentFoods(userId, limit = 10) {
    const { data, error } = await supabase
      .from('logs')
      .select(`
        food_id,
        created_at,
        foods (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    // Deduplicate by food_id
    const seen = new Set()
    return data.filter(item => {
      if (seen.has(item.food_id)) return false
      seen.add(item.food_id)
      return true
    }).map(item => item.foods)
  }

  /**
   * Update an existing food
   * @param {string} id - Food ID
   * @param {Object} updates - Food updates
   * @returns {Promise<Object>} Updated food
   */
  async updateFood(id, updates) {
    const foodData = { ...updates }
    
    // Remove common_servings from updates if present
    delete foodData.common_servings
    
    // Calculate per-100g values if serving_grams is provided
    if (foodData.serving_grams && foodData.calories) {
      const multiplier = 100 / foodData.serving_grams
      foodData.calories_per_100g = Math.round(foodData.calories * multiplier * 10) / 10
      foodData.protein_per_100g = Math.round((foodData.protein || 0) * multiplier * 10) / 10
      foodData.carbs_per_100g = Math.round((foodData.carbs || 0) * multiplier * 10) / 10
      foodData.fat_per_100g = Math.round((foodData.fat || 0) * multiplier * 10) / 10
    }
    
    const { data, error } = await supabase
      .from('foods')
      .update(foodData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }
    return data
  }
}

export const foodService = new FoodService()
export default foodService
