/**
 * Bottom Sheet component for text input
 */
class BottomSheet {
  constructor(onSubmit) {
    this.isOpen = false
    this.onSubmit = onSubmit
    this.value = ''
    this.placeholder = 'E.g. I had a chicken sandwich and 16oz of water'
  }

  render() {
    return `
      <div class="bottom-sheet" id="bottom-sheet">
        <div class="bottom-sheet-handle" id="bottom-sheet-handle">
          <div class="bottom-sheet-handle-bar"></div>
        </div>
        <div class="bottom-sheet-content">
          <div class="smart-log-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Smart Log
          </div>
          <div style="position: relative;">
            <textarea 
              class="smart-log-textarea" 
              id="smart-log-input" 
              placeholder="${this.placeholder}"
              rows="3"
            >${this.value}</textarea>
            <button class="smart-log-submit" id="smart-log-submit">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div class="smart-log-chips">
            <button class="smart-log-chip" data-prefill="Ate an apple">🍎 Ate an apple</button>
            <button class="smart-log-chip" data-prefill="Drank 8oz water">💧 8oz water</button>
            <button class="smart-log-chip" data-prefill="Today's weight is ">⚖️ Log Weight</button>
          </div>
        </div>
      </div>
    `
  }

  mount(container) {
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  attachEventListeners() {
    const handle = document.getElementById('bottom-sheet-handle')
    const input = document.getElementById('smart-log-input')
    const submitBtn = document.getElementById('smart-log-submit')
    const chips = document.querySelectorAll('.smart-log-chip')

    if (handle) {
      handle.addEventListener('click', () => this.close())
    }

    if (input) {
      input.addEventListener('input', (e) => {
        this.value = e.target.value
      })
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          this.submit()
        }
      })
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submit())
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prefill = chip.dataset.prefill
        this.value = prefill
        if (input) {
          input.value = prefill
          input.focus()
          // Move cursor to end
          input.setSelectionRange(prefill.length, prefill.length)
        }
      })
    })
  }

  open() {
    this.isOpen = true
    const sheet = document.getElementById('bottom-sheet')
    if (sheet) {
      sheet.classList.add('open')
      setTimeout(() => {
        const input = document.getElementById('smart-log-input')
        if (input) input.focus()
      }, 100)
    }
  }

  close() {
    this.isOpen = false
    const sheet = document.getElementById('bottom-sheet')
    if (sheet) {
      sheet.classList.remove('open')
    }
  }

  submit() {
    console.log('BottomSheet submit called, value:', this.value)
    if (this.value.trim() && this.onSubmit) {
      this.onSubmit(this.value.trim())
    } else {
      console.log('Submit skipped - empty value or no callback')
    }
  }

  clear() {
    this.value = ''
    const input = document.getElementById('smart-log-input')
    if (input) {
      input.value = ''
    }
  }
}

export default BottomSheet
