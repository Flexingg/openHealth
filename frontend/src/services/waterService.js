import { supabase } from '../config/supabase.js'

/**
 * Water service for interacting with the water_logs table
 */
class WaterService {
  /**
   * Log water intake
   * @param {number} amountMl - Amount in milliliters
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Created log
   */
  async logWater(amountMl, date) {
    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        amount_ml: amountMl,
        date
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get water logs for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of water logs
   */
  async getWaterByDate(date) {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  /**
   * Get total water for a date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Total water in ml and oz
   */
  async getDailyWaterTotal(date) {
    const { data, error } = await supabase
      .from('daily_water_summary')
      .select('*')
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data || { total_ml: 0, total_oz: 0 }
  }

  /**
   * Delete a water log
   * @param {string} id - Log ID
   */
  async deleteWaterLog(id) {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Convert ml to oz
   * @param {number} ml - Milliliters
   * @returns {number} Ounces
   */
  mlToOz(ml) {
    return ml / 29.5735
  }

  /**
   * Convert oz to ml
   * @param {number} oz - Ounces
   * @returns {number} Milliliters
   */
  ozToMl(oz) {
    return oz * 29.5735
  }
}

export const waterService = new WaterService()
export default waterService
