import { supabase } from '../config/supabase.js'

/**
 * Settings service for interacting with the user_settings table
 * Handles all user preferences including theme, AI config, units, profile, and fitness
 */
class SettingsService {
  /**
   * Get all user settings
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

  // ==========================================
  // THEME SETTINGS
  // ==========================================

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

  // ==========================================
  // AI CONFIGURATION
  // ==========================================

  /**
   * Get AI configuration
   * @returns {Promise<Object|null>} AI config with provider, apiKey, modelName
   */
  async getAIConfig() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('ai_provider, ai_api_key, ai_model_name')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (!data || !data.ai_provider || !data.ai_api_key || !data.ai_model_name) {
      return null
    }
    
    return {
      provider: data.ai_provider,
      apiKey: data.ai_api_key,
      modelName: data.ai_model_name
    }
  }

  /**
   * Update AI configuration
   * @param {Object} config - AI configuration
   * @param {string} config.provider - AI provider
   * @param {string} config.apiKey - API key
   * @param {string} config.modelName - Model name
   * @returns {Promise<Object>} Updated settings
   */
  async updateAIConfig({ provider, apiKey, modelName }) {
    return this.updateSettings({
      ai_provider: provider,
      ai_api_key: apiKey,
      ai_model_name: modelName
    })
  }

  /**
   * Check if AI is configured
   * @returns {Promise<boolean>}
   */
  async isAIConfigured() {
    const config = await this.getAIConfig()
    return config !== null
  }

  // ==========================================
  // UNIT PREFERENCES
  // ==========================================

  /**
   * Get unit preferences
   * @returns {Promise<Object>} Unit preferences
   */
  async getUnitPreferences() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('weight_unit, height_unit, water_unit, distance_unit')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return {
      weight: data?.weight_unit || 'lbs',
      height: data?.height_unit || 'ft',
      water: data?.water_unit || 'oz',
      distance: data?.distance_unit || 'mi'
    }
  }

  /**
   * Update unit preferences
   * @param {Object} units - Unit preferences
   * @returns {Promise<Object>} Updated settings
   */
  async updateUnitPreferences(units) {
    const updates = {}
    if (units.weight) updates.weight_unit = units.weight
    if (units.height) updates.height_unit = units.height
    if (units.water) updates.water_unit = units.water
    if (units.distance) updates.distance_unit = units.distance
    
    return this.updateSettings(updates)
  }

  // ==========================================
  // QUICK WATER SIZES
  // ==========================================

  /**
   * Get quick water sizes (in ml)
   * @returns {Promise<Object>} Quick water sizes
   */
  async getQuickWaterSizes() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('quick_water_size_1, quick_water_size_2, quick_water_size_3, water_unit')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return {
      size1: data?.quick_water_size_1 || 236.588,  // 8oz default
      size2: data?.quick_water_size_2 || 473.176,  // 16oz default
      size3: data?.quick_water_size_3 || 709.765,  // 24oz default
      unit: data?.water_unit || 'oz'
    }
  }

  /**
   * Update quick water sizes (values in ml)
   * @param {Object} sizes - Water sizes in ml
   * @returns {Promise<Object>} Updated settings
   */
  async updateQuickWaterSizes({ size1, size2, size3 }) {
    const updates = {}
    if (size1 !== undefined) updates.quick_water_size_1 = size1
    if (size2 !== undefined) updates.quick_water_size_2 = size2
    if (size3 !== undefined) updates.quick_water_size_3 = size3
    
    return this.updateSettings(updates)
  }

  // ==========================================
  // USER PROFILE
  // ==========================================

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('birthday, sex, height_cm, height_unit')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return {
      birthday: data?.birthday || null,
      sex: data?.sex || null,
      heightCm: data?.height_cm || null,
      heightUnit: data?.height_unit || 'ft'
    }
  }

  /**
   * Update user profile
   * @param {Object} profile - Profile data
   * @returns {Promise<Object>} Updated settings
   */
  async updateProfile(profile) {
    const updates = {}
    if (profile.birthday !== undefined) updates.birthday = profile.birthday
    if (profile.sex !== undefined) updates.sex = profile.sex
    if (profile.heightCm !== undefined) updates.height_cm = profile.heightCm
    
    return this.updateSettings(updates)
  }

  // ==========================================
  // FITNESS EXPERIENCE
  // ==========================================

  /**
   * Get fitness experience levels
   * @returns {Promise<Object>} Fitness experience
   */
  async getFitnessExperience() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('cardio_experience, lifting_experience')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return {
      cardio: data?.cardio_experience || 'none',
      lifting: data?.lifting_experience || 'none'
    }
  }

  /**
   * Update fitness experience levels
   * @param {Object} experience - Experience levels
   * @returns {Promise<Object>} Updated settings
   */
  async updateFitnessExperience({ cardio, lifting }) {
    const updates = {}
    if (cardio !== undefined) updates.cardio_experience = cardio
    if (lifting !== undefined) updates.lifting_experience = lifting
    
    return this.updateSettings(updates)
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Convert height between units
   * @param {number} value - Height value
   * @param {string} fromUnit - Source unit (ft or cm)
   * @param {string} toUnit - Target unit (ft or cm)
   * @returns {Object} Converted value { cm, ft, in }
   */
  convertHeight(value, fromUnit, toUnit) {
    if (fromUnit === 'cm' && toUnit === 'ft') {
      // cm to ft/in
      const totalInches = value / 2.54
      const ft = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches % 12)
      return { cm: value, ft, in: inches }
    } else if (fromUnit === 'ft' && toUnit === 'cm') {
      // This expects value to be total inches or we need ft/in separately
      // For simplicity, assume value is in cm when converting from ft
      const cm = value * 2.54
      return { cm }
    }
    return { cm: value }
  }

  /**
   * Convert feet/inches to centimeters
   * @param {number} feet - Feet
   * @param {number} inches - Inches
   * @returns {number} Height in cm
   */
  ftInToCm(feet, inches) {
    const totalInches = (feet * 12) + inches
    return Math.round(totalInches * 2.54 * 10) / 10
  }

  /**
   * Convert centimeters to feet/inches
   * @param {number} cm - Height in centimeters
   * @returns {Object} { ft, in }
   */
  cmToFtIn(cm) {
    const totalInches = cm / 2.54
    const ft = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return { ft, in: inches }
  }

  /**
   * Convert water amount between units
   * @param {number} value - Water amount
   * @param {string} fromUnit - Source unit (oz or ml)
   * @param {string} toUnit - Target unit (oz or ml)
   * @returns {number} Converted value
   */
  convertWater(value, fromUnit, toUnit) {
    const ML_PER_OZ = 29.5735
    
    if (fromUnit === 'oz' && toUnit === 'ml') {
      return value * ML_PER_OZ
    } else if (fromUnit === 'ml' && toUnit === 'oz') {
      return value / ML_PER_OZ
    }
    return value
  }

  /**
   * Convert weight between units
   * @param {number} value - Weight value
   * @param {string} fromUnit - Source unit (lbs or kg)
   * @param {string} toUnit - Target unit (lbs or kg)
   * @returns {number} Converted value
   */
  convertWeight(value, fromUnit, toUnit) {
    const KG_PER_LB = 0.453592
    
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return value * KG_PER_LB
    } else if (fromUnit === 'kg' && toUnit === 'lbs') {
      return value / KG_PER_LB
    }
    return value
  }
}

export const settingsService = new SettingsService()
export default settingsService
