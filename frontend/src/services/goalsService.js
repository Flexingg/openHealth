import { supabase } from '../config/supabase.js'

/**
 * Goals service for interacting with the user_goals table
 */
class GoalsService {
  /**
   * Get user goals for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} User goals
   */
  async getGoals(date) {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Get the most recent user goals
   * @returns {Promise<Object|null>} Most recent goals
   */
  async getLatestGoals() {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Set user goals for a date (upsert)
   * @param {Object} goals - Goals data
   * @returns {Promise<Object>} Created/updated goals
   */
  async setGoals(goals) {
    const { data, error } = await supabase
      .from('user_goals')
      .upsert(goals, { onConflict: 'user_id,date' })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update goals for today
   * @param {Object} updates - Goal updates
   * @returns {Promise<Object>} Updated goals
   */
  async updateTodayGoals(updates) {
    const today = new Date().toISOString().split('T')[0]
    return this.setGoals({
      date: today,
      ...updates
    })
  }
}

export const goalsService = new GoalsService()
export default goalsService
