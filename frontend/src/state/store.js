/**
 * Central application state manager using publish/subscribe pattern
 */
class Store {
  constructor() {
    this.state = {
      user: null,
      selectedDate: new Date(),
      currentRoute: '/',
      theme: {
        mode: 'system',
        accentColor: '#10b981'
      },
      goals: {
        target_calories: 2000,
        target_protein: 150,
        target_carbs: 200,
        target_fat: 65
      },
      // User settings from backend
      userSettings: {
        // Theme
        themeMode: 'system',
        accentColor: '#10b981',
        // AI Configuration
        aiProvider: null,
        aiModelName: null,
        // Unit Preferences
        weightUnit: 'lbs',
        heightUnit: 'ft',
        waterUnit: 'oz',
        distanceUnit: 'mi',
        // Quick Water Sizes (in ml)
        quickWaterSize1: 236.588,
        quickWaterSize2: 473.176,
        quickWaterSize3: 709.765,
        // User Profile
        birthday: null,
        sex: null,
        heightCm: null,
        // Fitness Experience
        cardioExperience: 'none',
        liftingExperience: 'none'
      },
      dailySummary: null,
      mealTimeSummary: [],
      isLoading: false,
      error: null
    }
    
    this.listeners = new Map()
    this.listenerId = 0
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state }
  }

  /**
   * Update state and notify listeners
   * @param {Object} updates - Partial state updates
   */
  setState(updates) {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...updates }
    
    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener(this.state, prevState)
    })
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function
   * @returns {number} Listener ID for unsubscribing
   */
  subscribe(listener) {
    const id = this.listenerId++
    this.listeners.set(id, listener)
    return id
  }

  /**
   * Unsubscribe from state changes
   * @param {number} id - Listener ID
   */
  unsubscribe(id) {
    this.listeners.delete(id)
  }

  // Convenience methods for common state updates
  
  setUser(user) {
    this.setState({ user })
  }

  setSelectedDate(date) {
    this.setState({ selectedDate: date })
  }

  setRoute(route) {
    this.setState({ currentRoute: route })
  }

  setTheme(theme) {
    this.setState({ theme: { ...this.state.theme, ...theme } })
  }

  setGoals(goals) {
    this.setState({ goals: { ...this.state.goals, ...goals } })
  }

  /**
   * Update user settings
   * @param {Object} settings - Partial settings update
   */
  setUserSettings(settings) {
    this.setState({ 
      userSettings: { ...this.state.userSettings, ...settings } 
    })
  }

  /**
   * Get user settings
   * @returns {Object} User settings
   */
  getUserSettings() {
    return this.state.userSettings
  }

  setDailySummary(summary) {
    this.setState({ dailySummary: summary })
  }

  setMealTimeSummary(summary) {
    this.setState({ mealTimeSummary: summary })
  }

  setLoading(isLoading) {
    this.setState({ isLoading })
  }

  setError(error) {
    this.setState({ error })
  }

  clearError() {
    this.setState({ error: null })
  }

  /**
   * Get formatted date string for API queries
   * @returns {string} Date in YYYY-MM-DD format
   */
  getSelectedDateString() {
    const date = this.state.selectedDate
    return date.toISOString().split('T')[0]
  }

  /**
   * Get quick water sizes in user's preferred unit
   * @returns {Array} Array of { ml, display, unit }
   */
  getQuickWaterSizes() {
    const settings = this.state.userSettings
    const unit = settings.waterUnit
    const ML_PER_OZ = 29.5735
    
    return [
      { 
        ml: settings.quickWaterSize1, 
        display: unit === 'oz' 
          ? Math.round(settings.quickWaterSize1 / ML_PER_OZ) 
          : Math.round(settings.quickWaterSize1),
        unit 
      },
      { 
        ml: settings.quickWaterSize2, 
        display: unit === 'oz' 
          ? Math.round(settings.quickWaterSize2 / ML_PER_OZ) 
          : Math.round(settings.quickWaterSize2),
        unit 
      },
      { 
        ml: settings.quickWaterSize3, 
        display: unit === 'oz' 
          ? Math.round(settings.quickWaterSize3 / ML_PER_OZ) 
          : Math.round(settings.quickWaterSize3),
        unit 
      }
    ]
  }

  /**
   * Get user's height in their preferred unit format
   * @returns {Object} { cm, ft, in, unit } or null if not set
   */
  getHeightDisplay() {
    const settings = this.state.userSettings
    if (!settings.heightCm) return null
    
    const cm = settings.heightCm
    const totalInches = cm / 2.54
    const ft = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    
    return {
      cm,
      ft,
      in: inches,
      unit: settings.heightUnit
    }
  }
}

export const store = new Store()
export default store
