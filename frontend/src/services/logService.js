import { supabase } from '../config/supabase.js'

/**
 * Log service for interacting with the logs table and views
 */
class LogService {
  /**
   * Create a new log entry
   * @param {Object} log - Log data
   * @returns {Promise<Object>} Created log
   */
  async createLog(log) {
    const { data, error } = await supabase
      .from('logs')
      .insert(log)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a log entry
   * @param {string} id - Log ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated log
   */
  async updateLog(id, updates) {
    const { data, error } = await supabase
      .from('logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a log entry
   * @param {string} id - Log ID
   */
  async deleteLog(id) {
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Get logs for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of logs with food data
   */
  async getLogsByDate(date) {
    const { data, error } = await supabase
      .from('logs')
      .select(`
        *,
        foods (*),
        food_servings (*)
      `)
      .eq('date', date)
      .order('time_logged', { ascending: true, nullsFirst: false })
    
    if (error) throw error
    return data
  }

  /**
   * Get daily summary for a date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} Daily summary
   */
  async getDailySummary(date) {
    const { data, error } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data
  }

  /**
   * Get meal time summary for a date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Meal time summaries
   */
  async getMealTimeSummary(date) {
    const { data, error } = await supabase
      .from('meal_time_summary')
      .select('*')
      .eq('date', date)
      .order('meal_time', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get logs grouped by meal time for a date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Logs grouped by meal time
   */
  async getLogsGroupedByMeal(date) {
    const logs = await this.getLogsByDate(date)
    
    const grouped = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
      Other: []
    }
    
    logs.forEach(log => {
      const mealTime = log.meal_time || 'Other'
      if (grouped[mealTime]) {
        grouped[mealTime].push(log)
      }
    })
    
    return grouped
  }

  /**
   * Get a single log by ID
   * @param {string} id - Log ID
   * @returns {Promise<Object>} Log with food data and serving info
   */
  async getLogById(id) {
    const { data, error } = await supabase
      .from('logs')
      .select(`
        *,
        foods (*),
        food_servings (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get a log with calculated nutrition values
   * @param {string} id - Log ID
   * @returns {Promise<Object>} Log with calculated nutrition
   */
  async getLogWithNutrition(id) {
    const { data, error } = await supabase
      .rpc('get_log_with_nutrition', { p_log_id: id })
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Calculate nutrition for a log entry based on servings and grams
   * @param {Object} log - Log entry with foods relation
   * @returns {Object} Calculated nutrition values
   */
  calculateNutrition(log) {
    const food = log.foods
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 }

    // Determine grams to use
    let grams = log.custom_serving_grams
    
    // If there's a food_serving, use its grams
    if (!grams && log.food_servings) {
      grams = log.food_servings.grams
    }
    
    // Fall back to food's default serving
    if (!grams && food.serving_grams) {
      grams = food.serving_grams
    }
    
    // If we have grams and per-100g values, calculate from those
    if (grams && food.calories_per_100g !== null) {
      const multiplier = (grams / 100) * log.servings_consumed
      return {
        calories: Math.round((food.calories_per_100g || 0) * multiplier),
        protein: Math.round((food.protein_per_100g || 0) * multiplier * 10) / 10,
        carbs: Math.round((food.carbs_per_100g || 0) * multiplier * 10) / 10,
        fat: Math.round((food.fat_per_100g || 0) * multiplier * 10) / 10,
        grams: grams * log.servings_consumed
      }
    }
    
    // Fall back to per-serving calculation
    return {
      calories: Math.round((food.calories || 0) * log.servings_consumed),
      protein: Math.round((food.protein || 0) * log.servings_consumed * 10) / 10,
      carbs: Math.round((food.carbs || 0) * log.servings_consumed * 10) / 10,
      fat: Math.round((food.fat || 0) * log.servings_consumed * 10) / 10,
      grams: null
    }
  }
}

export const logService = new LogService()
export default logService
