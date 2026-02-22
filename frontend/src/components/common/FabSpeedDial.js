import { store } from '../../state/store.js'

/**
 * FAB Speed Dial component with expanding menu
 */
class FabSpeedDial {
  constructor(onCameraClick, onTextClick) {
    this.isOpen = false
    this.onCameraClick = onCameraClick
    this.onTextClick = onTextClick
    this.visible = true
  }

  render() {
    if (!this.visible) {
      return '<div class="fab-container hidden" id="fab-container"></div>'
    }

    return `
      <div class="fab-overlay ${this.isOpen ? 'open' : ''}" id="fab-overlay"></div>
      <div class="fab-container ${this.isOpen ? 'open' : ''}" id="fab-container">
        <div class="fab-item">
          <span class="fab-label">Scan Label</span>
          <button class="fab-item-btn" id="fab-camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
        </div>
        <div class="fab-item">
          <span class="fab-label">Type Anything</span>
          <button class="fab-item-btn" id="fab-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
        <button class="fab-main" id="fab-main">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    `
  }

  mount(container) {
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  attachEventListeners() {
    const mainFab = document.getElementById('fab-main')
    const overlay = document.getElementById('fab-overlay')
    const cameraBtn = document.getElementById('fab-camera')
    const textBtn = document.getElementById('fab-text')

    if (mainFab) {
      mainFab.addEventListener('click', () => this.toggle())
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.close())
    }

    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        this.close()
        if (this.onCameraClick) this.onCameraClick()
      })
    }

    if (textBtn) {
      textBtn.addEventListener('click', () => {
        this.close()
        if (this.onTextClick) this.onTextClick()
      })
    }
  }

  toggle() {
    this.isOpen = !this.isOpen
    this.updateDOM()
  }

  open() {
    this.isOpen = true
    this.updateDOM()
  }

  close() {
    this.isOpen = false
    this.updateDOM()
  }

  show() {
    this.visible = true
    this.updateDOM()
  }

  hide() {
    this.visible = false
    this.isOpen = false
    this.updateDOM()
  }

  updateDOM() {
    const container = document.getElementById('fab-container')
    const overlay = document.getElementById('fab-overlay')
    
    if (container) {
      if (this.visible) {
        container.classList.remove('hidden')
        if (this.isOpen) {
          container.classList.add('open')
        } else {
          container.classList.remove('open')
        }
      } else {
        container.classList.add('hidden')
      }
    }
    
    if (overlay) {
      if (this.isOpen && this.visible) {
        overlay.classList.add('open')
      } else {
        overlay.classList.remove('open')
      }
    }
  }
}

export default FabSpeedDial
