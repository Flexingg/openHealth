import { store } from '../../state/store.js'

/**
 * FAB Speed Dial component with expanding menu
 * Supports long-press for voice recording
 */
class FabSpeedDial {
  constructor(onCameraClick, onTextClick, onVoiceClick) {
    this.isOpen = false
    this.onCameraClick = onCameraClick
    this.onTextClick = onTextClick
    this.onVoiceClick = onVoiceClick
    this.visible = true
    
    // Voice recording state
    this.isRecording = false
    this.onVoiceStart = null
    this.onVoiceEnd = null
    this.onVoiceCancel = null
    this.onTranscriptUpdate = null
    
    // Long-press detection
    this.longPressTimer = null
    this.isLongPress = false
    this.longPressDuration = 500 // milliseconds
    
    // Swipe detection
    this.touchStartY = 0
    this.swipeThreshold = 100 // pixels
    this.hasSwipedUp = false
  }

  /**
   * Set voice recording callbacks
   */
  setVoiceCallbacks(onVoiceStart, onVoiceEnd, onVoiceCancel, onTranscriptUpdate) {
    this.onVoiceStart = onVoiceStart
    this.onVoiceEnd = onVoiceEnd
    this.onVoiceCancel = onVoiceCancel
    this.onTranscriptUpdate = onTranscriptUpdate
  }

  render() {
    if (!this.visible) {
      return '<div class="fab-container hidden" id="fab-container"></div>'
    }

    const containerClass = `fab-container ${this.isOpen ? 'open' : ''} ${this.isRecording ? 'recording-mode' : ''}`
    const mainFabClass = `fab-main ${this.isRecording ? 'recording' : ''}`

    return `
      <div class="fab-overlay ${this.isOpen ? 'open' : ''}" id="fab-overlay"></div>
      <div class="${containerClass}" id="fab-container" oncontextmenu="return false">
        ${!this.isRecording ? `
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
        <div class="fab-item">
          <span class="fab-label">Voice Record</span>
          <button class="fab-item-btn" id="fab-voice">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>
        ` : ''}
        <button class="${mainFabClass}" id="fab-main" oncontextmenu="return false">
          ${this.isRecording ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mic-icon">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          ` : `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          `}
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
    const container = document.getElementById('fab-container')
    const overlay = document.getElementById('fab-overlay')
    const cameraBtn = document.getElementById('fab-camera')
    const textBtn = document.getElementById('fab-text')
    const voiceBtn = document.getElementById('fab-voice')

    if (container) {
      container.addEventListener('contextmenu', (e) => e.preventDefault())
    }

    if (mainFab) {
      // Prevent context menu on long press
      mainFab.addEventListener('contextmenu', (e) => e.preventDefault())

      // Click handler (short tap - opens menu or stops recording)
      mainFab.addEventListener('click', (e) => {
        if (this.isRecording) {
          // Tap during recording stops and sends the transcript
          this.stopRecording()
          return
        }
        // Only toggle menu if it wasn't a long press
        if (!this.isLongPress) {
          this.toggle()
        }
        this.isLongPress = false
      })

      // Long-press start (mousedown/touchstart)
      mainFab.addEventListener('mousedown', (e) => this.startLongPress(e))
      mainFab.addEventListener('touchstart', (e) => this.startLongPress(e))

      // Long-press end (mouseup/touchend)
      mainFab.addEventListener('mouseup', (e) => this.endLongPress(e))
      mainFab.addEventListener('touchend', (e) => this.endLongPress(e))

      // Handle touch cancel
      mainFab.addEventListener('touchcancel', (e) => {
        if (this.isRecording) {
          this.cancelRecording()
        }
      })

      // Touch move for swipe detection
      mainFab.addEventListener('touchmove', (e) => this.handleTouchMove(e))
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

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.close()
        if (this.onVoiceClick) this.onVoiceClick()
      })
    }
  }

  /**
   * Start long-press timer
   */
  startLongPress(e) {
    if (this.isRecording) return
    
    this.isLongPress = false
    this.hasSwipedUp = false
    
    // Get touch coordinates for swipe detection
    if (e.type === 'touchstart') {
      this.touchStartY = e.touches[0].clientY
    } else {
      this.touchStartY = e.clientY
    }
    
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true
      // Prevent default after we've determined it's a long press
      // This stops text selection but allows click to fire on short taps
      if (document.activeElement) {
        document.activeElement.blur()
      }
      this.startRecording()
    }, this.longPressDuration)
  }

  /**
   * Handle touch move for swipe-up gesture detection
   */
  handleTouchMove(e) {
    if (!this.isRecording) return
    
    const currentY = e.touches[0].clientY
    const deltaY = this.touchStartY - currentY
    
    // Check if swiping up (positive delta means upward swipe)
    if (deltaY > this.swipeThreshold) {
      this.hasSwipedUp = true
      this.cancelRecording()
    }
  }

  /**
   * End long-press - stop recording and send transcript
   */
  endLongPress(e) {
    // Clear the timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    // If we were recording, stop and send transcript (smart logger handles empty transcript case)
    if (this.isRecording) {
      this.stopRecording()
    }
    
    this.isLongPress = false
  }
  /**
   * Start voice recording
   */
  startRecording() {
    this.isRecording = true
    this.updateDOM()
    
    // Notify parent component to start voice recording
    if (this.onVoiceStart) {
      this.onVoiceStart()
    }
  }

  /**
   * Stop voice recording and send transcript
   */
  stopRecording() {
    if (!this.isRecording) return
    
    this.isRecording = false
    this.updateDOM()
    
    // Notify parent component to stop and process recording
    if (this.onVoiceEnd) {
      this.onVoiceEnd()
    }
  }

  /**
   * Cancel voice recording without sending
   */
  cancelRecording() {
    if (!this.isRecording) return
    
    this.isRecording = false
    this.hasSwipedUp = false
    this.updateDOM()
    
    // Notify parent component to cancel
    if (this.onVoiceCancel) {
      this.onVoiceCancel()
    }
  }

  /**
   * Update transcript display (called from parent)
   */
  updateTranscript(text) {
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(text)
    }
  }

  toggle() {
    if (this.isRecording) return // Don't toggle menu during recording
    this.isOpen = !this.isOpen
    this.updateDOM()
  }

  open() {
    if (this.isRecording) return
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
    this.isRecording = false
    this.updateDOM()
  }

  updateDOM() {
    const container = document.getElementById('fab-container')
    const overlay = document.getElementById('fab-overlay')
    const mainFab = document.getElementById('fab-main')
    
    if (container) {
      if (this.visible) {
        container.classList.remove('hidden')
        if (this.isOpen) {
          container.classList.add('open')
        } else {
          container.classList.remove('open')
        }
        if (this.isRecording) {
          container.classList.add('recording-mode')
        } else {
          container.classList.remove('recording-mode')
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

    // Update FAB icon based on recording state
    if (mainFab) {
      if (this.isRecording) {
        mainFab.classList.add('recording')
      } else {
        mainFab.classList.remove('recording')
      }
    }
  }
}

export default FabSpeedDial
