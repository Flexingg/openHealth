import { store } from '../../state/store.js'
import { waterService } from '../../services/waterService.js'

/**
 * Water Modal component for quick add and viewing recent water logs
 */
class WaterModal {
  constructor(onLogAdded) {
    this.isOpen = false
    this.onLogAdded = onLogAdded
    this.waterLogs = []
    this.waterTotal = { total_ml: 0, total_oz: 0 }
    this.customAmount = ''
    this.isRefreshing = false
    this.eventListenersAttached = false
  }

  async fetchData() {
    const date = store.getSelectedDateString()
    try {
      const [logs, total] = await Promise.all([
        waterService.getWaterByDate(date),
        waterService.getDailyWaterTotal(date)
      ])
      this.waterLogs = logs || []
      this.waterTotal = total || { total_ml: 0, total_oz: 0 }
    } catch (error) {
      console.error('Failed to fetch water data:', error)
      this.waterLogs = []
      this.waterTotal = { total_ml: 0, total_oz: 0 }
    }
  }

  render() {
    const userSettings = store.getState().userSettings
    const unit = userSettings.waterUnit || 'oz'
    const total = unit === 'oz' 
      ? Math.round(this.waterTotal?.total_oz || 0)
      : Math.round(this.waterTotal?.total_ml || 0)
    
    const sizes = store.getQuickWaterSizes()

    return `
      <div class="water-modal-overlay" id="water-modal-overlay"></div>
      <div class="water-modal" id="water-modal">
        <div class="water-modal-header">
          <div class="water-modal-title">
            <span class="water-modal-icon">💧</span>
            <span>Water</span>
          </div>
          <button class="water-modal-close" id="water-modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="water-modal-total">
          <div class="water-total-value">${total}</div>
          <div class="water-total-unit">${unit} today</div>
        </div>
        
        <div class="water-modal-section">
          <div class="water-section-title">Quick Add</div>
          <div class="water-quick-buttons">
            ${sizes.map((size, i) => `
              <button class="water-quick-btn-modal" data-ml="${size.ml}">
                ${size.display}${size.unit}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="water-modal-section">
          <div class="water-section-title">Custom Amount</div>
          <div class="water-custom-input">
            <input type="number" id="water-custom-amount" placeholder="Enter amount" class="water-custom-field" />
            <span class="water-custom-unit">${unit}</span>
            <button class="water-custom-add" id="water-custom-add">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="water-modal-section">
          <div class="water-section-title">Today's Log</div>
          <div class="water-logs-list" id="water-logs-list">
            ${this.renderLogsList()}
          </div>
        </div>
      </div>
    `
  }

  renderLogsList() {
    if (this.waterLogs.length === 0) {
      return `<div class="water-logs-empty">No water logged today</div>`
    }

    const userSettings = store.getState().userSettings
    const unit = userSettings.waterUnit || 'oz'

    return this.waterLogs.map(log => {
      const display = unit === 'oz' 
        ? Math.round(waterService.mlToOz(log.amount_ml))
        : Math.round(log.amount_ml)
      const time = this.formatTime(log.created_at)
      
      return `
        <div class="water-log-item" data-log-id="${log.id}">
          <div class="water-log-info">
            <span class="water-log-amount">${display} ${unit}</span>
            <span class="water-log-time">${time}</span>
          </div>
          <button class="water-log-delete" data-delete-id="${log.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `
    }).join('')
  }

  formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  mount(container) {
    container.innerHTML = this.render()
    if (!this.eventListenersAttached) {
      this.attachEventListeners()
      this.eventListenersAttached = true
    }
  }

  attachEventListeners() {
    const overlay = document.getElementById('water-modal-overlay')
    const closeBtn = document.getElementById('water-modal-close')
    const quickBtns = document.querySelectorAll('.water-quick-btn-modal')
    const customAddBtn = document.getElementById('water-custom-add')
    const customInput = document.getElementById('water-custom-amount')
    const deleteBtns = document.querySelectorAll('.water-log-delete')

    if (overlay) {
      overlay.addEventListener('click', () => this.close())
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close())
    }

    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const ml = parseFloat(btn.dataset.ml)
        this.handleQuickAdd(ml)
      })
    })

    if (customAddBtn) {
      customAddBtn.addEventListener('click', () => this.handleCustomAdd())
    }

    if (customInput) {
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleCustomAdd()
        }
      })
      customInput.addEventListener('input', (e) => {
        this.customAmount = e.target.value
      })
    }

    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const logId = btn.dataset.deleteId
        await this.handleDelete(logId)
      })
    })
  }

  async handleQuickAdd(ml) {
    if (this.isRefreshing) return
    this.isRefreshing = true
    
    try {
      await waterService.logWater(ml, store.getSelectedDateString())
      await this.fetchData()
      this.updateModal()
    } catch (error) {
      console.error('Failed to log water:', error)
    } finally {
      this.isRefreshing = false
    }
  }

  async handleCustomAdd() {
    const input = document.getElementById('water-custom-amount')
    const value = input?.value || this.customAmount
    
    if (!value) return
    
    const amount = parseFloat(value)
    if (isNaN(amount) || amount <= 0) return

    const userSettings = store.getState().userSettings
    const unit = userSettings.waterUnit || 'oz'
    const ml = unit === 'oz' ? waterService.ozToMl(amount) : amount

    await this.handleQuickAdd(ml)
    
    // Clear input
    if (input) {
      input.value = ''
    }
    this.customAmount = ''
  }

  async handleDelete(logId) {
    try {
      await waterService.deleteWaterLog(logId)
      await this.fetchData()
      this.updateModal()
      
      if (this.onLogAdded) {
        this.onLogAdded()
      }
    } catch (error) {
      console.error('Failed to delete water log:', error)
    }
  }

  updateModal() {
    const modal = document.getElementById('water-modal')
    const overlay = document.getElementById('water-modal-overlay')
    
    if (modal && overlay) {
      // Update total
      const userSettings = store.getState().userSettings
      const unit = userSettings.waterUnit || 'oz'
      const total = unit === 'oz' 
        ? Math.round(this.waterTotal?.total_oz || 0)
        : Math.round(this.waterTotal?.total_ml || 0)
      
      const totalValue = modal.querySelector('.water-total-value')
      const totalUnit = modal.querySelector('.water-total-unit')
      if (totalValue) totalValue.textContent = total
      if (totalUnit) totalUnit.textContent = `${unit} today`
      
      // Update logs list
      const logsList = document.getElementById('water-logs-list')
      if (logsList) {
        logsList.innerHTML = this.renderLogsList()
        // Re-attach delete listeners
        const deleteBtns = logsList.querySelectorAll('.water-log-delete')
        deleteBtns.forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation()
            const logId = btn.dataset.deleteId
            await this.handleDelete(logId)
          })
        })
      }
    }
  }

  async open() {
    await this.fetchData()
    this.isOpen = true
    
    const modal = document.getElementById('water-modal')
    const overlay = document.getElementById('water-modal-overlay')
    
    if (modal) {
      modal.classList.add('open')
    }
    if (overlay) {
      overlay.classList.add('open')
    }
    
    // Update modal with fetched data
    this.updateModal()
  }

  close() {
    this.isOpen = false
    
    const modal = document.getElementById('water-modal')
    const overlay = document.getElementById('water-modal-overlay')
    
    if (modal) {
      modal.classList.remove('open')
    }
    if (overlay) {
      overlay.classList.remove('open')
    }
  }

  addStyles() {
    if (!document.getElementById('water-modal-styles')) {
      const style = document.createElement('style')
      style.id = 'water-modal-styles'
      style.textContent = `
        .water-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 200;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .water-modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .water-modal {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--md-surface);
          border-radius: 24px 24px 0 0;
          z-index: 201;
          max-height: 85vh;
          overflow-y: auto;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        .water-modal.open {
          transform: translateY(0);
        }
        .water-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--md-divider);
          position: sticky;
          top: 0;
          background: var(--md-surface);
          z-index: 1;
        }
        .water-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.125rem;
          font-weight: 700;
        }
        .water-modal-icon {
          font-size: 1.25rem;
        }
        .water-modal-close {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: background 0.2s ease;
        }
        .water-modal-close:hover {
          background: var(--md-surface-variant);
        }
        .water-modal-total {
          text-align: center;
          padding: 24px 20px;
          background: var(--md-primary-container);
          margin: 16px;
          border-radius: 16px;
        }
        .water-total-value {
          font-size: 3rem;
          font-weight: 700;
          color: var(--md-on-primary-container);
          line-height: 1;
        }
        .water-total-unit {
          font-size: 0.875rem;
          color: var(--md-on-primary-container);
          margin-top: 4px;
          opacity: 0.8;
        }
        .water-modal-section {
          padding: 16px 20px;
        }
        .water-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--md-text-secondary);
          margin-bottom: 12px;
        }
        .water-quick-buttons {
          display: flex;
          gap: 8px;
        }
        .water-quick-btn-modal {
          flex: 1;
          padding: 12px 8px;
          border: 2px solid var(--md-primary);
          border-radius: 12px;
          background: transparent;
          color: var(--md-primary);
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .water-quick-btn-modal:hover {
          background: var(--md-primary);
          color: var(--md-on-primary);
        }
        .water-quick-btn-modal:active {
          transform: scale(0.95);
        }
        .water-custom-input {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--md-surface-variant);
          border-radius: 12px;
          padding: 4px;
        }
        .water-custom-field {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px;
          font-size: 1rem;
          color: var(--md-on-surface);
          outline: none;
          min-width: 0;
        }
        .water-custom-field::placeholder {
          color: var(--md-text-secondary);
        }
        .water-custom-unit {
          color: var(--md-text-secondary);
          font-weight: 600;
          padding-right: 4px;
        }
        .water-custom-add {
          background: var(--md-primary);
          border: none;
          color: var(--md-on-primary);
          width: 44px;
          height: 44px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }
        .water-custom-add:hover {
          transform: scale(1.05);
        }
        .water-custom-add:active {
          transform: scale(0.95);
        }
        .water-logs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .water-logs-empty {
          text-align: center;
          color: var(--md-text-secondary);
          padding: 24px;
          font-size: 0.875rem;
        }
        .water-log-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--md-surface-variant);
          border-radius: 12px;
        }
        .water-log-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .water-log-amount {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .water-log-time {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        .water-log-delete {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .water-log-delete:hover {
          background: var(--md-error-container);
          color: var(--md-on-error-container);
        }
      `
      document.head.appendChild(style)
    }
  }
}

export default WaterModal
