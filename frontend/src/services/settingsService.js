import { supabase } from '../config/supabase.js'

/**
 * Settings service for interacting with the user_settings table
 */
class SettingsService {
  /**
   * Get user settings
   * @returns {Promise<Object|null>} User settings
   */
  async getSettings() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Update user settings (upsert)
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update theme settings
   * @param {string} themeMode - Theme mode
   * @param {string} accentColor - Accent color hex
   * @returns {Promise<Object>} Updated settings
   */
  async updateTheme(themeMode, accentColor) {
    return this.updateSettings({
      theme_mode: themeMode,
      accent_color: accentColor
    })
  }
}

export const settingsService = new SettingsService()
export default settingsService
