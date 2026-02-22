/**
 * AI Confirmation Modal for showing thinking state and results
 */
class AIModal {
  constructor(onConfirm, onEdit) {
    this.isOpen = false
    this.isThinking = false
    this.result = null
    this.error = null
    this.onConfirm = onConfirm
    this.onEdit = onEdit
  }

  render() {
    return `
      <div class="ai-modal ${this.isOpen ? 'open' : ''}" id="ai-modal">
        <div class="ai-modal-content">
          ${this.isThinking ? this.renderThinking() : this.renderResult()}
        </div>
      </div>
    `
  }

  renderThinking() {
    return `
      <div id="ai-thinking-state" style="display: flex; flex-direction: column; align-items: center; padding: 24px 0;">
        <div class="ai-thinking-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <h3 style="font-weight: 700; font-size: 1.125rem; color: var(--md-primary); margin-top: 16px;">Analyzing input...</h3>
      </div>
    `
  }

  renderResult() {
    if (this.error) {
      return `
        <div style="text-align: center; padding: 16px 0;">
          <div style="color: var(--md-error); font-weight: 700; margin-bottom: 8px;">Error connecting to AI</div>
          <p style="font-size: 0.875rem; color: var(--md-text-secondary);">${this.error}</p>
          <button class="btn btn-secondary mt-md" id="ai-modal-close">Close</button>
        </div>
      `
    }

    if (!this.result) return ''

    const { logType, foodName, calories, protein, carbs, fat, amount, unit } = this.result

    if (logType === 'weight') {
      return `
        <div style="display: flex; align-items: center; gap: 8px; color: var(--md-primary); margin-bottom: 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3 style="font-weight: 700; font-size: 1.125rem;">AI Found This:</h3>
        </div>
        <div class="ai-result-card" style="background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="display: flex; align-items: center; font-weight: 500;">
              <span style="margin-right: 8px;">⚖️</span> Body Weight
            </span>
            <span style="font-weight: 700; font-size: 1.125rem;">${amount || '--'} ${unit || 'lbs'}</span>
          </div>
        </div>
        ${this.renderActions()}
      `
    }

    if (logType === 'water') {
      return `
        <div style="display: flex; align-items: center; gap: 8px; color: var(--md-primary); margin-bottom: 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3 style="font-weight: 700; font-size: 1.125rem;">AI Found This:</h3>
        </div>
        <div class="ai-result-card" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="display: flex; align-items: center; font-weight: 500;">
              <span style="margin-right: 8px;">💧</span> Hydration
            </span>
            <span style="font-weight: 700; font-size: 1.125rem;">+${amount || 0} ${unit || 'oz'}</span>
          </div>
        </div>
        ${this.renderActions()}
      `
    }

    // Food log
    return `
      <div style="display: flex; align-items: center; gap: 8px; color: var(--md-primary); margin-bottom: 16px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h3 style="font-weight: 700; font-size: 1.125rem;">AI Found This:</h3>
      </div>
      <div class="ai-result-card">
        <div class="ai-result-header">
          <div>
            <div class="ai-result-name">${foodName || 'Unknown Food'}</div>
            <div class="ai-result-serving">1 serving</div>
          </div>
          <span class="ai-result-cal">${calories || 0} kcal</span>
        </div>
        <div class="ai-result-macros">
          <div class="ai-result-macro">
            <div class="ai-result-macro-value">${protein || 0}g</div>
            <div class="ai-result-macro-label">Protein</div>
          </div>
          <div class="ai-result-macro">
            <div class="ai-result-macro-value">${carbs || 0}g</div>
            <div class="ai-result-macro-label">Carbs</div>
          </div>
          <div class="ai-result-macro">
            <div class="ai-result-macro-value">${fat || 0}g</div>
            <div class="ai-result-macro-label">Fat</div>
          </div>
        </div>
      </div>
      ${this.renderActions()}
    `
  }

  renderActions() {
    return `
      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button class="btn btn-secondary" style="flex: 1;" id="ai-modal-edit">Edit</button>
        <button class="btn btn-primary" style="flex: 1;" id="ai-modal-confirm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Log It
        </button>
      </div>
    `
  }

  mount(container) {
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  attachEventListeners() {
    const confirmBtn = document.getElementById('ai-modal-confirm')
    const editBtn = document.getElementById('ai-modal-edit')
    const closeBtn = document.getElementById('ai-modal-close')

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (this.onConfirm) this.onConfirm(this.result)
      })
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.close()
        if (this.onEdit) this.onEdit()
      })
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close())
    }
  }

  showThinking() {
    this.isThinking = true
    this.result = null
    this.error = null
    this.open()
  }

  showResult(result) {
    console.log('AIModal.showResult called with:', result)
    this.isThinking = false
    this.result = result
    this.isOpen = true  // Make sure modal is open
    this.updateDOM()
    console.log('AIModal.showResult done, isOpen:', this.isOpen)
  }

  showError(error) {
    this.isThinking = false
    this.error = error
    this.updateDOM()
  }

  open() {
    this.isOpen = true
    const modal = document.getElementById('ai-modal')
    if (modal) {
      modal.classList.add('open')
    }
    this.updateDOM()
  }

  close() {
    this.isOpen = false
    const modal = document.getElementById('ai-modal')
    if (modal) {
      modal.classList.remove('open')
    }
  }

  updateDOM() {
    const container = document.getElementById('ai-modal')
    if (container) {
      // Update the class for open/closed state
      if (this.isOpen) {
        container.classList.add('open')
      } else {
        container.classList.remove('open')
      }
      
      // Re-render content
      const parent = container.parentElement
      if (parent) {
        this.mount(parent)
      }
    }
  }
}

export default AIModal
