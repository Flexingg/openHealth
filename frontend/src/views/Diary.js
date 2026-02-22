import { store } from '../state/store.js'
import { logService } from '../services/logService.js'
import { router } from '../router/router.js'

/**
 * Diary view with timeline of food logs
 */
class Diary {
  constructor() {
    this.loading = true
    this.logs = []
    this.swipeState = {
      startX: 0,
      currentX: 0,
      isDragging: false,
      activeItem: null
    }
  }

  async fetchData() {
    const date = store.getSelectedDateString()
    store.setLoading(true)
    
    try {
      this.logs = await logService.getLogsByDate(date)
    } catch (error) {
      console.error('Failed to fetch diary data:', error)
      store.setError('Failed to load diary')
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

    return `
      <div class="main-content">
        <h3 style="margin-bottom: var(--md-spacing-md);">Today's Food Log</h3>
        
        ${this.logs.length === 0 ? `
          <div class="text-center mt-lg">
            <p class="text-secondary">No foods logged yet today</p>
            <p class="text-secondary mt-sm">Tap the + button to add your first meal</p>
          </div>
        ` : `
          ${this.renderTimeline()}
        `}
        
        <!-- FAB -->
        <button class="fab" id="add-food-fab" title="Add Food">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    `
  }

  renderTimeline() {
    // Group logs by time
    const grouped = this.groupByTime()
    
    return Object.entries(grouped).map(([timeKey, logs]) => {
      return `
        <div class="diary-section">
          <div class="diary-time-header">
            <span class="diary-time">${timeKey}</span>
            <span class="diary-meal-type">${logs[0].meal_time || 'Other'}</span>
          </div>
          ${logs.map(log => this.renderLogItem(log)).join('')}
        </div>
      `
    }).join('')
  }

  groupByTime() {
    const grouped = {}
    
    this.logs.forEach(log => {
      let timeKey = 'Unspecified time'
      
      if (log.time_logged) {
        const [hours, minutes] = log.time_logged.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        timeKey = `${displayHour}:${minutes} ${ampm}`
      } else if (log.created_at) {
        const date = new Date(log.created_at)
        const hour = date.getHours()
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        timeKey = `${displayHour}:${minutes} ${ampm}`
      }
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = []
      }
      grouped[timeKey].push(log)
    })
    
    // Sort by time (most recent first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unspecified time') return 1
      if (b === 'Unspecified time') return -1
      return new Date(`1970-01-01 ${b}`) - new Date(`1970-01-01 ${a}`)
    })
    
    const sorted = {}
    sortedKeys.forEach(key => {
      sorted[key] = grouped[key]
    })
    
    return sorted
  }

  renderLogItem(log) {
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
      if (food?.serving_size) {
        servingText += ` · ${food.serving_size} ${food.serving_unit || ''}`
      }
    }
    
    return `
      <div class="diary-item-wrapper" data-log-id="${log.id}">
        <div class="diary-item-swipe-delete">
          <button class="swipe-delete-btn" data-delete-id="${log.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        <div class="diary-item" data-log-id="${log.id}">
          <div class="diary-item-content">
            <div class="diary-item-name">${food?.name || 'Unknown food'}</div>
            <div class="diary-item-meta">${servingText}</div>
          </div>
          <div class="diary-item-cal">${nutrition.calories} cal</div>
        </div>
      </div>
    `
  }

  mount(container) {
    // Add diary-specific styles
    this.addStyles()
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  addStyles() {
    if (!document.getElementById('diary-styles')) {
      const style = document.createElement('style')
      style.id = 'diary-styles'
      style.textContent = `
        .diary-section {
          margin-bottom: var(--md-spacing-lg);
        }
        .diary-time-header {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
          margin-bottom: var(--md-spacing-sm);
          padding-bottom: var(--md-spacing-xs);
          border-bottom: 1px solid var(--md-divider);
        }
        .diary-time {
          font-weight: 500;
          color: var(--md-on-surface);
        }
        .diary-meal-type {
          font-size: 0.75rem;
          color: var(--md-primary);
          background: var(--md-primary-container);
          padding: 2px 8px;
          border-radius: var(--md-shape-small);
        }
        .diary-item-wrapper {
          position: relative;
          overflow: hidden;
          margin-bottom: var(--md-spacing-sm);
          border-radius: var(--md-shape-medium);
        }
        .diary-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--md-spacing-md);
          background: var(--md-surface);
          border-radius: var(--md-shape-medium);
          box-shadow: var(--md-elevation-1);
          cursor: pointer;
          position: relative;
          z-index: 1;
          transition: transform 0.2s ease, background var(--md-motion-duration-short) var(--md-motion-easing);
        }
        .diary-item:hover {
          background: var(--md-surface-variant);
        }
        .diary-item-content {
          flex: 1;
        }
        .diary-item-name {
          font-weight: 500;
          margin-bottom: 2px;
        }
        .diary-item-meta {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        .diary-item-cal {
          font-weight: 500;
          color: var(--md-text-secondary);
        }
        .diary-item-swipe-delete {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          background: var(--md-error);
          color: white;
          padding: 0 20px;
          border-radius: var(--md-shape-medium);
          transform: translateX(100%);
          transition: transform 0.2s ease;
        }
        .diary-item-wrapper.swiped .diary-item-swipe-delete {
          transform: translateX(0);
        }
        .diary-item-wrapper.swiped .diary-item {
          transform: translateX(-80px);
        }
        .swipe-delete-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
        }
      `
      document.head.appendChild(style)
    }
  }

  attachEventListeners() {
    // FAB click
    const fab = document.getElementById('add-food-fab')
    if (fab) {
      fab.addEventListener('click', () => {
        router.navigate('/add-food')
      })
    }
    
    // Log item click (edit)
    const items = document.querySelectorAll('.diary-item')
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't navigate if swiping
        if (this.swipeState.isDragging) return
        
        const logId = item.dataset.logId
        router.navigate(`/log/${logId}`)
      })
    })
    
    // Swipe-to-delete
    this.setupSwipeToDelete()
  }

  setupSwipeToDelete() {
    const wrappers = document.querySelectorAll('.diary-item-wrapper')
    
    wrappers.forEach(wrapper => {
      const item = wrapper.querySelector('.diary-item')
      const deleteBtn = wrapper.querySelector('.swipe-delete-btn')
      let startX = 0
      let currentX = 0
      let isDragging = false
      
      // Touch events
      item.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX
        isDragging = true
        item.style.transition = 'none'
      }, { passive: true })
      
      item.addEventListener('touchmove', (e) => {
        if (!isDragging) return
        currentX = e.touches[0].clientX
        const diff = startX - currentX
        
        if (diff > 0) {
          // Swiping left
          const translate = Math.min(diff, 80)
          item.style.transform = `translateX(-${translate}px)`
        }
      }, { passive: true })
      
      item.addEventListener('touchend', () => {
        isDragging = false
        item.style.transition = 'transform 0.2s ease'
        
        const diff = startX - currentX
        if (diff > 40) {
          // Show delete button
          wrapper.classList.add('swiped')
          item.style.transform = 'translateX(-80px)'
        } else {
          // Reset
          wrapper.classList.remove('swiped')
          item.style.transform = 'translateX(0)'
        }
        
        this.swipeState.isDragging = diff > 10
      })
      
      // Delete button click
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation()
          const logId = deleteBtn.dataset.deleteId
          await this.handleDeleteLog(logId, wrapper)
        })
      }
      
      // Click outside to close swipe
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove('swiped')
          item.style.transform = 'translateX(0)'
        }
      })
    })
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

export default Diary
