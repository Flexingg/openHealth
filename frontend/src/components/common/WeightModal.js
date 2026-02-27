import { store } from '../../state/store.js'
import { weightService } from '../../services/weightService.js'

/**
 * Weight Modal component for logging weight and viewing weight history
 */
class WeightModal {
  constructor(onLogAdded) {
    this.isOpen = false
    this.onLogAdded = onLogAdded
    this.weightLogs = []
    this.currentWeight = null
    this.customWeight = ''
    this.editingLogId = null
    this.canvas = null
    this.ctx = null
  }

  async fetchData() {
    try {
      const [logs, todayWeight] = await Promise.all([
        weightService.getWeightHistory(30),
        weightService.getWeightByDate(store.getSelectedDateString())
      ])
      this.weightLogs = logs || []
      this.currentWeight = todayWeight
    } catch (error) {
      console.error('Failed to fetch weight data:', error)
      this.weightLogs = []
      this.currentWeight = null
    }
  }

  render() {
    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'
    
    // Get the most recent weight for display
    let displayWeight = '--'
    if (this.currentWeight) {
      const weight = unit === 'lbs' 
        ? weightService.kgToLbs(this.currentWeight.weight_kg)
        : this.currentWeight.weight_kg
      displayWeight = Math.round(weight * 10) / 10
    } else if (this.weightLogs.length > 0) {
      const latest = this.weightLogs[0]
      const weight = unit === 'lbs' 
        ? weightService.kgToLbs(latest.weight_kg)
        : latest.weight_kg
      displayWeight = Math.round(weight * 10) / 10
    }

    const isEditing = this.editingLogId !== null
    const sectionTitle = isEditing ? 'Edit Weight' : 'Log Weight'
    const btnIcon = isEditing 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'

    return `
      <div class="weight-modal-overlay" id="weight-modal-overlay"></div>
      <div class="weight-modal" id="weight-modal">
        <div class="weight-modal-header">
          <div class="weight-modal-title">
            <span class="weight-modal-icon">⚖️</span>
            <span>Weight</span>
          </div>
          <button class="weight-modal-close" id="weight-modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="weight-modal-current">
          <div class="weight-current-value">${displayWeight}</div>
          <div class="weight-current-unit">${unit}</div>
        </div>
        
        <div class="weight-modal-section">
          <div class="weight-section-title">${sectionTitle}</div>
          <div class="weight-input-row">
            <input type="number" step="0.1" id="weight-custom-amount" placeholder="Enter weight" class="weight-custom-field" />
            <span class="weight-custom-unit">${unit}</span>
            <button class="weight-log-btn" id="weight-log-btn">
              ${btnIcon}
            </button>
            ${isEditing ? `
              <button class="weight-cancel-btn" id="weight-cancel-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="weight-modal-section weight-chart-section">
          <div class="weight-section-title">Weight History (30 days)</div>
          <div class="weight-chart-container">
            <canvas id="weight-chart-canvas"></canvas>
          </div>
          ${this.weightLogs.length === 0 ? '<div class="weight-chart-empty">No weight history yet</div>' : ''}
        </div>
        
        <div class="weight-modal-section">
          <div class="weight-section-title">Recent Logs</div>
          <div class="weight-logs-list" id="weight-logs-list">
            ${this.renderLogsList()}
          </div>
        </div>
      </div>
    `
  }

  renderLogsList() {
    if (this.weightLogs.length === 0) {
      return `<div class="weight-logs-empty">No weight logged yet</div>`
    }

    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'

    // Show only last 5 logs
    return this.weightLogs.slice(0, 5).map(log => {
      const display = unit === 'lbs' 
        ? (weightService.kgToLbs(log.weight_kg)).toFixed(1)
        : log.weight_kg.toFixed(1)
      const date = this.formatDate(log.date)
      const isEditingThis = this.editingLogId === log.id
      
      return `
        <div class="weight-log-item ${isEditingThis ? 'editing' : ''}" data-log-id="${log.id}">
          <div class="weight-log-info" data-edit-id="${log.id}">
            <span class="weight-log-amount">${display} ${unit}</span>
            <span class="weight-log-date">${date}</span>
          </div>
          <div class="weight-log-actions">
            <button class="weight-log-edit" data-edit-id="${log.id}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="weight-log-delete" data-delete-id="${log.id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `
    }).join('')
  }

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  mount(container) {
    container.innerHTML = this.render()
    // Don't attach event listeners here - they'll be attached when modal opens
  }

  attachEventListeners() {
    // Clone and replace overlay to remove old listeners
    const overlay = document.getElementById('weight-modal-overlay')
    if (overlay) {
      const newOverlay = overlay.cloneNode(true)
      overlay.parentNode.replaceChild(newOverlay, overlay)
      newOverlay.addEventListener('click', () => this.close())
    }

    // Clone and replace close button
    const closeBtn = document.getElementById('weight-modal-close')
    if (closeBtn) {
      const newCloseBtn = closeBtn.cloneNode(true)
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn)
      newCloseBtn.addEventListener('click', () => this.close())
    }

    // Log/update button
    const logBtn = document.getElementById('weight-log-btn')
    if (logBtn) {
      logBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (this.editingLogId) {
          this.handleUpdateWeight()
        } else {
          this.handleLogWeight()
        }
      })
    }

    // Cancel edit button
    const cancelBtn = document.getElementById('weight-cancel-btn')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.cancelEdit()
      })
    }

    // Weight input
    const weightInput = document.getElementById('weight-custom-amount')
    if (weightInput) {
      weightInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (this.editingLogId) {
            this.handleUpdateWeight()
          } else {
            this.handleLogWeight()
          }
        }
      })
      weightInput.addEventListener('input', (e) => {
        this.customWeight = e.target.value
      })
    }

    this.attachLogItemListeners()
  }

  attachLogItemListeners() {
    // Edit buttons
    const editBtns = document.querySelectorAll('.weight-log-edit')
    editBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const logId = btn.dataset.editId
        await this.startEdit(logId)
      })
    })

    // Delete buttons
    const deleteBtns = document.querySelectorAll('.weight-log-delete')
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const logId = btn.dataset.deleteId
        await this.handleDelete(logId)
      })
    })

    // Click on log item to edit
    const logItems = document.querySelectorAll('.weight-log-info')
    logItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation()
        const logId = item.dataset.editId
        await this.startEdit(logId)
      })
    })
  }

  async startEdit(logId) {
    const log = this.weightLogs.find(l => l.id === logId)
    if (!log) return

    this.editingLogId = logId
    
    // Convert to display unit
    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'
    const displayWeight = unit === 'lbs' 
      ? weightService.kgToLbs(log.weight_kg)
      : log.weight_kg

    // Re-render modal with edit mode
    const container = document.getElementById('weight-modal-container')
    if (container) {
      container.innerHTML = this.render()
      // Set the input value
      const input = document.getElementById('weight-custom-amount')
      if (input) {
        input.value = displayWeight.toFixed(1)
        this.customWeight = displayWeight.toFixed(1)
      }
      // Re-attach listeners
      this.attachEventListeners()
      // Redraw chart
      if (this.weightLogs.length > 0) {
        setTimeout(() => this.drawChart(), 50)
      }
    }
  }

  cancelEdit() {
    this.editingLogId = null
    this.customWeight = ''
    
    // Re-render modal
    const container = document.getElementById('weight-modal-container')
    if (container) {
      container.innerHTML = this.render()
      this.attachEventListeners()
      if (this.weightLogs.length > 0) {
        setTimeout(() => this.drawChart(), 50)
      }
    }
  }

  async handleLogWeight() {
    const input = document.getElementById('weight-custom-amount')
    const value = input?.value || this.customWeight
    
    if (!value) return
    
    const weight = parseFloat(value)
    if (isNaN(weight) || weight <= 0) return

    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'
    const kg = unit === 'lbs' ? weightService.lbsToKg(weight) : weight

    try {
      await weightService.logWeight(kg, store.getSelectedDateString())
      await this.fetchData()
      this.updateModal()
      
      if (this.onLogAdded) {
        this.onLogAdded()
      }
    } catch (error) {
      console.error('Failed to log weight:', error)
      alert('Failed to log weight. Please try again.')
    }
    
    // Clear input
    if (input) {
      input.value = ''
    }
    this.customWeight = ''
  }

  async handleUpdateWeight() {
    if (!this.editingLogId) return
    
    const input = document.getElementById('weight-custom-amount')
    const value = input?.value || this.customWeight
    
    if (!value) return
    
    const weight = parseFloat(value)
    if (isNaN(weight) || weight <= 0) return

    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'
    const kg = unit === 'lbs' ? weightService.lbsToKg(weight) : weight

    try {
      await weightService.updateWeightLog(this.editingLogId, kg)
      this.editingLogId = null
      this.customWeight = ''
      await this.fetchData()
      this.updateModal()
      
      if (this.onLogAdded) {
        this.onLogAdded()
      }
    } catch (error) {
      console.error('Failed to update weight:', error)
      alert('Failed to update weight. Please try again.')
    }
  }

  async handleDelete(logId) {
    if (!confirm('Delete this weight entry?')) return
    
    try {
      await weightService.deleteWeightLog(logId)
      
      // If we were editing this log, cancel edit mode
      if (this.editingLogId === logId) {
        this.editingLogId = null
      }
      
      await this.fetchData()
      this.updateModal()
      
      if (this.onLogAdded) {
        this.onLogAdded()
      }
    } catch (error) {
      console.error('Failed to delete weight log:', error)
    }
  }

  updateModal() {
    const modal = document.getElementById('weight-modal')
    
    if (modal) {
      // Update current weight display
      const userSettings = store.getState().userSettings
      const unit = userSettings.weightUnit || 'lbs'
      
      let displayWeight = '--'
      if (this.currentWeight) {
        const weight = unit === 'lbs' 
          ? weightService.kgToLbs(this.currentWeight.weight_kg)
          : this.currentWeight.weight_kg
        displayWeight = Math.round(weight * 10) / 10
      } else if (this.weightLogs.length > 0) {
        const latest = this.weightLogs[0]
        const weight = unit === 'lbs' 
          ? weightService.kgToLbs(latest.weight_kg)
          : latest.weight_kg
        displayWeight = Math.round(weight * 10) / 10
      }
      
      const currentValue = modal.querySelector('.weight-current-value')
      const currentUnit = modal.querySelector('.weight-current-unit')
      if (currentValue) currentValue.textContent = displayWeight
      if (currentUnit) currentUnit.textContent = unit
      
      // Update logs list
      const logsList = document.getElementById('weight-logs-list')
      if (logsList) {
        logsList.innerHTML = this.renderLogsList()
        this.attachLogItemListeners()
      }
      
      // Redraw chart
      if (this.weightLogs.length > 0) {
        this.drawChart()
      }
    }
  }

  drawChart() {
    const canvas = document.getElementById('weight-chart-canvas')
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Get user settings
    const userSettings = store.getState().userSettings
    const unit = userSettings.weightUnit || 'lbs'
    const accentColor = userSettings.accentColor || '#10b981'
    
    // Set canvas size
    const container = canvas.parentElement
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = 200 * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = '200px'
    
    ctx.scale(dpr, dpr)
    
    const width = rect.width
    const height = 200
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    if (this.weightLogs.length === 0) return
    
    // Prepare data - reverse to show oldest to newest
    const logs = [...this.weightLogs].reverse()
    
    // Convert weights to display units
    const weights = logs.map(log => 
      unit === 'lbs' ? weightService.kgToLbs(log.weight_kg) : log.weight_kg
    )
    
    const minWeight = Math.min(...weights) - 2
    const maxWeight = Math.max(...weights) + 2
    const weightRange = maxWeight - minWeight || 1
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)'
    ctx.lineWidth = 1
    
    // Horizontal grid lines
    const gridLines = 4
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      
      // Y-axis labels
      const weightLabel = (maxWeight - (weightRange / gridLines) * i).toFixed(0)
      ctx.fillStyle = 'rgba(128, 128, 128, 0.8)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(weightLabel, padding.left - 8, y + 4)
    }
    
    // Draw line chart
    ctx.beginPath()
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    
    const points = []
    
    logs.forEach((log, i) => {
      const x = padding.left + (chartWidth / (logs.length - 1 || 1)) * i
      const y = padding.top + chartHeight - ((weights[i] - minWeight) / weightRange) * chartHeight
      points.push({ x, y, weight: weights[i], date: log.date })
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // Draw gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    gradient.addColorStop(0, accentColor + '40')
    gradient.addColorStop(1, accentColor + '00')
    
    ctx.beginPath()
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom)
    ctx.lineTo(points[0].x, height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Draw data points
    points.forEach((point, i) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = accentColor
      ctx.fill()
      ctx.strokeStyle = 'var(--md-surface)'
      ctx.lineWidth = 2
      ctx.stroke()
    })
    
    // Draw x-axis labels (dates)
    ctx.fillStyle = 'rgba(128, 128, 128, 0.8)'
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    
    // Show every nth label depending on data points
    const labelInterval = Math.ceil(logs.length / 5)
    logs.forEach((log, i) => {
      if (i % labelInterval === 0 || i === logs.length - 1) {
        const x = padding.left + (chartWidth / (logs.length - 1 || 1)) * i
        const date = new Date(log.date + 'T00:00:00')
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ctx.fillText(label, x, height - 8)
      }
    })
  }

  async open() {
    await this.fetchData()
    this.isOpen = true
    this.editingLogId = null // Reset edit mode when opening
    
    // Re-render the modal content with fresh data and settings
    const container = document.getElementById('weight-modal-container')
    if (container) {
      container.innerHTML = this.render()
    }
    
    const modal = document.getElementById('weight-modal')
    const overlay = document.getElementById('weight-modal-overlay')
    
    if (modal) {
      modal.classList.add('open')
    }
    if (overlay) {
      overlay.classList.add('open')
    }
    
    // Attach event listeners after re-rendering
    this.attachEventListeners()
    
    // Draw chart after animation
    if (this.weightLogs.length > 0) {
      setTimeout(() => this.drawChart(), 100)
    }
  }

  close() {
    this.isOpen = false
    this.editingLogId = null // Reset edit mode when closing
    
    const modal = document.getElementById('weight-modal')
    const overlay = document.getElementById('weight-modal-overlay')
    
    if (modal) {
      modal.classList.remove('open')
    }
    if (overlay) {
      overlay.classList.remove('open')
    }
  }

  addStyles() {
    if (!document.getElementById('weight-modal-styles')) {
      const style = document.createElement('style')
      style.id = 'weight-modal-styles'
      style.textContent = `
        .weight-modal-overlay {
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
        .weight-modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .weight-modal {
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
        .weight-modal.open {
          transform: translateY(0);
        }
        .weight-modal-header {
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
        .weight-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.125rem;
          font-weight: 700;
        }
        .weight-modal-icon {
          font-size: 1.25rem;
        }
        .weight-modal-close {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: background 0.2s ease;
        }
        .weight-modal-close:hover {
          background: var(--md-surface-variant);
        }
        .weight-modal-current {
          text-align: center;
          padding: 24px 20px;
          background: var(--md-primary-container);
          margin: 16px;
          border-radius: 16px;
        }
        .weight-current-value {
          font-size: 3rem;
          font-weight: 700;
          color: var(--md-on-primary-container);
          line-height: 1;
        }
        .weight-current-unit {
          font-size: 0.875rem;
          color: var(--md-on-primary-container);
          margin-top: 4px;
          opacity: 0.8;
        }
        .weight-modal-section {
          padding: 16px 20px;
        }
        .weight-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--md-text-secondary);
          margin-bottom: 12px;
        }
        .weight-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--md-surface-variant);
          border-radius: 12px;
          padding: 4px;
        }
        .weight-custom-field {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px;
          font-size: 1rem;
          color: var(--md-on-surface);
          outline: none;
          min-width: 0;
        }
        .weight-custom-field::placeholder {
          color: var(--md-text-secondary);
        }
        .weight-custom-unit {
          color: var(--md-text-secondary);
          font-weight: 600;
          padding-right: 4px;
        }
        .weight-log-btn {
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
        .weight-log-btn:hover {
          transform: scale(1.05);
        }
        .weight-log-btn:active {
          transform: scale(0.95);
        }
        .weight-chart-section {
          position: relative;
        }
        .weight-chart-container {
          width: 100%;
          height: 200px;
          background: var(--md-surface-variant);
          border-radius: 12px;
          overflow: hidden;
        }
        #weight-chart-canvas {
          width: 100%;
          height: 100%;
        }
        .weight-chart-empty {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--md-text-secondary);
          font-size: 0.875rem;
          text-align: center;
          margin-top: 20px;
        }
        .weight-logs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .weight-logs-empty {
          text-align: center;
          color: var(--md-text-secondary);
          padding: 24px;
          font-size: 0.875rem;
        }
        .weight-log-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--md-surface-variant);
          border-radius: 12px;
        }
        .weight-log-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .weight-log-amount {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .weight-log-date {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        .weight-log-delete {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .weight-log-delete:hover {
          background: var(--md-error-container);
          color: var(--md-on-error-container);
        }
        .weight-log-actions {
          display: flex;
          gap: 4px;
        }
        .weight-log-edit {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .weight-log-edit:hover {
          background: var(--md-primary-container);
          color: var(--md-on-primary-container);
        }
        .weight-log-item.editing {
          background: var(--md-primary-container);
        }
        .weight-log-item.editing .weight-log-amount {
          color: var(--md-on-primary-container);
        }
        .weight-cancel-btn {
          background: var(--md-surface-variant);
          border: none;
          color: var(--md-text-secondary);
          width: 44px;
          height: 44px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .weight-cancel-btn:hover {
          background: var(--md-error-container);
          color: var(--md-on-error-container);
        }
      `
      document.head.appendChild(style)
    }
  }
}

export default WeightModal
