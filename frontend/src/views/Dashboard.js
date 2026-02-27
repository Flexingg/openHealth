import { store } from '../state/store.js'
import { logService } from '../services/logService.js'
import { goalsService } from '../services/goalsService.js'
import { waterService } from '../services/waterService.js'
import { weightService } from '../services/weightService.js'
import { router } from '../router/router.js'

/**
 * Dashboard view with hero macros and meal cards
 */
class Dashboard {
  constructor() {
    this.loading = true
    this.goals = null
    this.dailySummary = null
    this.mealTimeSummary = []
    this.logsByMeal = {}
    this.expandedMeals = new Set()
    this.waterTotal = { total_ml: 0, total_oz: 0 }
    this.currentWeight = null
    this.swipeState = {
      startX: 0,
      currentX: 0,
      isDragging: false,
      activeItem: null
    }
    this.eventListenersAttached = false
  }

  async fetchData() {
    const date = store.getSelectedDateString()
    store.setLoading(true)
    
    try {
      const [goals, dailySummary, mealTimeSummary, logsByMeal, waterTotal] = await Promise.all([
        goalsService.getGoals(date).catch(() => goalsService.getLatestGoals()),
        logService.getDailySummary(date).catch(() => null),
        logService.getMealTimeSummary(date).catch(() => []),
        logService.getLogsGroupedByMeal(date).catch(() => ({})),
        waterService.getDailyWaterTotal(date).catch(() => ({ total_ml: 0, total_oz: 0 }))
      ])
      
      this.goals = goals
      this.dailySummary = dailySummary
      this.mealTimeSummary = mealTimeSummary
      this.logsByMeal = logsByMeal
      this.waterTotal = waterTotal
      
      // Fetch current weight for the selected date
      const weightData = await weightService.getWeightByDate(date).catch(() => null)
      this.currentWeight = weightData?.weight_kg || null
      
      if (goals) {
        store.setGoals({
          target_calories: goals.target_calories,
          target_protein: goals.target_protein,
          target_carbs: goals.target_carbs,
          target_fat: goals.target_fat
        })
      }
      store.setDailySummary(dailySummary)
      store.setMealTimeSummary(mealTimeSummary)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      store.setError('Failed to load data')
    } finally {
      store.setLoading(false)
      this.loading = false
    }
  }

  render() {
    if (this.loading) {
      return `
        <div class="main-content">
          <div class="text-center mt-md">
            <div class="spinner"></div>
            <p class="text-secondary mt-sm">Loading...</p>
          </div>
        </div>
      `
    }

    const goals = store.getState().goals
    const summary = this.dailySummary || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
    const remaining = Math.max(0, goals.target_calories - summary.total_calories)

    return `
      <div class="main-content">
        <!-- Hero Macros Section -->
        <section class="hero-macros">
          <div class="hero-calories">
            <div>
              <div class="hero-cal-value">${Math.round(summary.total_calories).toLocaleString()}</div>
              <div class="hero-cal-label">kcal eaten (${remaining} left)</div>
            </div>
          </div>
          
          <div class="macro-progress">
            <div class="macro-header">
              <span class="macro-label">Protein <span class="macro-current">${Math.round(summary.total_protein)}/${Math.round(goals.target_protein)}g</span></span>
              <span>${Math.round((summary.total_protein / goals.target_protein) * 100) || 0}%</span>
            </div>
            <div class="macro-bar">
              <div class="macro-fill protein" style="width: ${Math.min((summary.total_protein / goals.target_protein) * 100, 100) || 0}%"></div>
            </div>
          </div>
          
          <div class="macro-progress">
            <div class="macro-header">
              <span class="macro-label">Carbs <span class="macro-current">${Math.round(summary.total_carbs)}/${Math.round(goals.target_carbs)}g</span></span>
              <span>${Math.round((summary.total_carbs / goals.target_carbs) * 100) || 0}%</span>
            </div>
            <div class="macro-bar">
              <div class="macro-fill carbs" style="width: ${Math.min((summary.total_carbs / goals.target_carbs) * 100, 100) || 0}%"></div>
            </div>
          </div>
          
          <div class="macro-progress">
            <div class="macro-header">
              <span class="macro-label">Fat <span class="macro-current">${Math.round(summary.total_fat)}/${Math.round(goals.target_fat)}g</span></span>
              <span>${Math.round((summary.total_fat / goals.target_fat) * 100) || 0}%</span>
            </div>
            <div class="macro-bar">
              <div class="macro-fill fat" style="width: ${Math.min((summary.total_fat / goals.target_fat) * 100, 100) || 0}%"></div>
            </div>
          </div>
        </section>
        
        <!-- Quick Trackers (water/weight) -->
        <section class="quick-trackers">
          ${this.renderWaterCard()}
          ${this.renderWeightCard()}
        </section>
        
        <!-- Diary Section -->
        <section class="diary-section">
          <h3 class="diary-title">Diary</h3>
          ${this.renderMealCards()}
        </section>
      </div>
    `
  }

  renderMealCards() {
    const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
    const mealIcons = {
      Breakfast: '🌅',
      Lunch: '☀️',
      Dinner: '🌙',
      Snack: '🍎'
    }
    
    return mealOrder.map(mealTime => {
      const logs = this.logsByMeal[mealTime] || []
      const summary = this.mealTimeSummary.find(s => s.meal_time === mealTime)
      const calories = summary?.calories || 0
      const isExpanded = this.expandedMeals.has(mealTime)
      const hasItems = logs.length > 0
      
      return `
        <div class="meal-card" data-meal="${mealTime}">
          <div class="meal-card-header" data-toggle="${mealTime}">
            <div class="meal-card-title">
              <span>${mealIcons[mealTime] || '🍽️'}</span>
              <h4>${mealTime}</h4>
              ${hasItems ? `<span class="meal-card-cal">${Math.round(calories)} kcal</span>` : ''}
            </div>
            <div class="meal-card-meta">
              ${hasItems ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${isExpanded ? '180deg' : '0deg'}); transition: transform 0.2s;">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              ` : `
                <span class="text-secondary" style="font-size: 0.75rem;">Tap to add foods</span>
              `}
            </div>
          </div>
          ${isExpanded && hasItems ? `
            <div class="meal-card-content">
              ${logs.map(log => this.renderMealItem(log)).join('')}
            </div>
          ` : ''}
        </div>
      `
    }).join('')
  }

  renderMealItem(log) {
    const food = log.foods
    const nutrition = logService.calculateNutrition(log)
    
    // Build serving display text
    let servingText = ''
    if (log.food_servings) {
      servingText = `${log.servings_consumed} × ${log.food_servings.name}`
    } else if (log.custom_serving_grams) {
      servingText = `${log.servings_consumed} × ${log.custom_serving_grams}g`
    } else {
      servingText = `${log.servings_consumed} serving${log.servings_consumed !== 1 ? 's' : ''}`
    }
    
    return `
      <div class="meal-item-wrapper" data-log-id="${log.id}">
        <div class="meal-item-swipe-delete">
          <button class="swipe-delete-btn" data-delete-id="${log.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        <div class="meal-item" data-log-id="${log.id}">
          <div class="meal-item-content">
            <div class="meal-item-name">${food?.name || 'Unknown food'}</div>
            <div class="meal-item-meta">${servingText}</div>
          </div>
          <div class="meal-item-cal">${nutrition.calories} cal</div>
        </div>
      </div>
    `
  }

  renderWaterCard() {
    const userSettings = store.getState().userSettings
    const unit = userSettings.waterUnit || 'oz'
    const total = unit === 'oz' 
      ? Math.round(this.waterTotal?.total_oz || 0)
      : Math.round(this.waterTotal?.total_ml || 0)
    
    return `
      <div class="tracker-card water clickable" id="water-card">
        <div class="tracker-icon-bg">💧</div>
        <div class="tracker-header">
          <span class="tracker-icon">💧</span>
          <span class="tracker-label">Water</span>
        </div>
        <div class="tracker-value">${total} <span class="tracker-unit">${unit}</span></div>
        <div class="tracker-tap-hint">Tap to log</div>
      </div>
    `
  }

  renderWeightCard() {
    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'
    
    let displayWeight = '--'
    if (this.currentWeight) {
      const weight = unit === 'lbs' 
        ? weightService.kgToLbs(this.currentWeight)
        : this.currentWeight
      displayWeight = Math.round(weight * 10) / 10
    }
    
    return `
      <div class="tracker-card weight clickable" id="weight-card">
        <div class="tracker-icon-bg">⚖️</div>
        <div class="tracker-header">
          <span class="tracker-icon">⚖️</span>
          <span class="tracker-label">Weight</span>
        </div>
        <div class="tracker-value">${displayWeight} <span class="tracker-unit">${unit}</span></div>
        <div class="tracker-tap-hint">Tap to log</div>
      </div>
    `
  }

  mount(container) {
    this.addStyles()
    container.innerHTML = this.render()
    if (!this.eventListenersAttached) {
      this.attachEventListeners()
      this.eventListenersAttached = true
    }
  }

  addStyles() {
    if (!document.getElementById('dashboard-styles')) {
      const style = document.createElement('style')
      style.id = 'dashboard-styles'
      style.textContent = `
        .diary-section {
          margin-top: var(--md-spacing-lg);
        }
        .diary-title {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--md-text-secondary);
          padding-left: 8px;
          margin-bottom: 12px;
        }
        .meal-card {
          background: var(--md-surface);
          border-radius: 16px;
          margin-bottom: 12px;
          box-shadow: var(--md-elevation-1);
          overflow: hidden;
        }
        .meal-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          cursor: pointer;
          transition: background var(--md-motion-duration-short) var(--md-motion-easing);
        }
        .meal-card-header:hover {
          background: var(--md-surface-variant);
        }
        .meal-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .meal-card-title h4 {
          font-size: 1rem;
          font-weight: 700;
        }
        .meal-card-cal {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
          margin-left: 8px;
        }
        .meal-card-meta {
          display: flex;
          align-items: center;
          color: var(--md-text-secondary);
        }
        .meal-card-content {
          border-top: 1px solid var(--md-divider);
          padding: 16px;
        }
        .meal-item-wrapper {
          position: relative;
          overflow: hidden;
        }
        .meal-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--md-divider);
          cursor: pointer;
          background: var(--md-surface);
          position: relative;
          z-index: 1;
          transition: transform 0.2s ease;
        }
        .meal-item:last-child {
          border-bottom: none;
        }
        .meal-item-content {
          flex: 1;
        }
        .meal-item-name {
          font-size: 0.875rem;
          font-weight: 500;
        }
        .meal-item-meta {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        .meal-item-cal {
          font-size: 0.875rem;
          color: var(--md-text-secondary);
        }
        .meal-item-swipe-delete {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          background: var(--md-error);
          color: white;
          padding: 0 20px;
          transform: translateX(100%);
          transition: transform 0.2s ease;
        }
        .meal-item-wrapper.swiped .meal-item-swipe-delete {
          transform: translateX(0);
        }
        .meal-item-wrapper.swiped .meal-item {
          transform: translateX(-80px);
        }
        .swipe-delete-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
        }
        /* Water card styles */
        .tracker-card.water.clickable {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tracker-card.water.clickable:hover {
          transform: translateY(-2px);
          box-shadow: var(--md-elevation-2);
        }
        .tracker-card.water.clickable:active {
          transform: translateY(0);
        }
        /* Weight card styles */
        .tracker-card.weight.clickable {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tracker-card.weight.clickable:hover {
          transform: translateY(-2px);
          box-shadow: var(--md-elevation-2);
        }
        .tracker-card.weight.clickable:active {
          transform: translateY(0);
        }
        .tracker-tap-hint {
          font-size: 0.625rem;
          color: var(--md-text-secondary);
          text-align: center;
          margin-top: 4px;
          opacity: 0.7;
        }
        @keyframes toastBounce {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          50% { transform: translateX(-50%) translateY(2px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `
      document.head.appendChild(style)
    }
  }

  attachEventListeners() {
    const container = document.getElementById('main-view')
    
    // Use event delegation for meal card toggles
    container.addEventListener('click', (e) => {
      const header = e.target.closest('.meal-card-header')
      if (header) {
        const mealTime = header.dataset.toggle
        if (this.expandedMeals.has(mealTime)) {
          this.expandedMeals.delete(mealTime)
        } else {
          this.expandedMeals.add(mealTime)
        }
        this.mount(document.getElementById('main-view'))
        return
      }
      
      // Meal item click (edit)
      const item = e.target.closest('.meal-item')
      if (item && !this.swipeState.isDragging) {
        const logId = item.dataset.logId
        router.navigate(`/log/${logId}`)
        return
      }
      
      // Water card click - open modal
      const waterCard = e.target.closest('#water-card')
      if (waterCard) {
        window.dispatchEvent(new CustomEvent('open-water-modal'))
        return
      }
      
      // Weight card click - open modal
      const weightCard = e.target.closest('#weight-card')
      if (weightCard) {
        window.dispatchEvent(new CustomEvent('open-weight-modal'))
        return
      }
    })
    
    // Swipe-to-delete setup (needs to run after DOM is ready)
    this.setupSwipeToDelete()
  }

  setupSwipeToDelete() {
    const container = document.getElementById('main-view')
    
    // Use event delegation for swipe-to-delete on meal items
    container.addEventListener('touchstart', (e) => {
      const item = e.target.closest('.meal-item')
      if (!item) return
      
      const wrapper = item.closest('.meal-item-wrapper')
      if (!wrapper) return
      
      this.handleSwipeStart(e, wrapper, item)
    }, { passive: true })
    
    container.addEventListener('touchmove', (e) => {
      const item = e.target.closest('.meal-item')
      if (!item) return
      
      const wrapper = item.closest('.meal-item-wrapper')
      if (!wrapper) return
      
      this.handleSwipeMove(e, wrapper, item)
    }, { passive: true })
    
    container.addEventListener('touchend', (e) => {
      const item = e.target.closest('.meal-item')
      if (!item) return
      
      const wrapper = item.closest('.meal-item-wrapper')
      if (!wrapper) return
      
      this.handleSwipeEnd(e, wrapper, item)
    })
    
    // Delete button click
    container.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.swipe-delete-btn')
      if (!deleteBtn) return
      
      e.stopPropagation()
      const logId = deleteBtn.dataset.deleteId
      const wrapper = deleteBtn.closest('.meal-item-wrapper')
      await this.handleDeleteLog(logId, wrapper)
    })
  }
  
  handleSwipeStart(e, wrapper, item) {
    wrapper._startX = e.touches[0].clientX
    wrapper._isDragging = true
    item.style.transition = 'none'
  }
  
  handleSwipeMove(e, wrapper, item) {
    if (!wrapper._isDragging) return
    const currentX = e.touches[0].clientX
    const diff = wrapper._startX - currentX
    
    if (diff > 0) {
      const translate = Math.min(diff, 80)
      item.style.transform = `translateX(-${translate}px)`
    }
  }
  
  handleSwipeEnd(e, wrapper, item) {
    wrapper._isDragging = false
    item.style.transition = 'transform 0.2s ease'
    
    const currentX = e.changedTouches[0].clientX
    const diff = wrapper._startX - currentX
    
    if (diff > 40) {
      wrapper.classList.add('swiped')
      item.style.transform = 'translateX(-80px)'
    } else {
      wrapper.classList.remove('swiped')
      item.style.transform = 'translateX(0)'
    }
    
    this.swipeState.isDragging = diff > 10
  }

  async handleDeleteLog(logId, wrapper) {
    if (confirm('Delete this log entry?')) {
      try {
        await logService.deleteLog(logId)
        wrapper.style.transition = 'all 0.3s ease'
        wrapper.style.transform = 'translateX(-100%)'
        wrapper.style.opacity = '0'
        
        setTimeout(() => {
          // Refresh the view
          this.init().then(() => {
            this.mount(document.getElementById('main-view'))
          })
        }, 300)
      } catch (error) {
        console.error('Failed to delete log:', error)
        alert('Failed to delete log entry')
      }
    }
  }

  async init() {
    await this.fetchData()
  }
}

export default Dashboard
