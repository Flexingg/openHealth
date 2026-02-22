import { supabase } from '../config/supabase.js'

/**
 * Weight service for interacting with the weight_logs table
 */
class WeightService {
  /**
   * Log body weight
   * @param {number} weightKg - Weight in kilograms
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Created log
   */
  async logWeight(weightKg, date, notes = null) {
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({
        weight_kg: weightKg,
        date,
        notes
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get weight log for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} Weight log or null
   */
  async getWeightByDate(date) {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  /**
   * Get weight history
   * @param {number} limit - Maximum number of entries
   * @returns {Promise<Array>} Array of weight logs
   */
  async getWeightHistory(limit = 30) {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  /**
   * Delete a weight log
   * @param {string} id - Log ID
   */
  async deleteWeightLog(id) {
    const { error } = await supabase
      .from('weight_logs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Convert kg to lbs
   * @param {number} kg - Kilograms
   * @returns {number} Pounds
   */
  kgToLbs(kg) {
    return kg * 2.20462
  }

  /**
   * Convert lbs to kg
   * @param {number} lbs - Pounds
   * @returns {number} Kilograms
   */
  lbsToKg(lbs) {
    return lbs * 0.453592
  }
}

export const weightService = new WeightService()
export default weightService
