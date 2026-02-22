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
}

export const store = new Store()
export default store
