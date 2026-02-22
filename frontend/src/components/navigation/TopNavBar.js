import { store } from '../../state/store.js'
import { router } from '../../router/router.js'

/**
 * TopNavBar component with date picker
 */
class TopNavBar {
  constructor() {
    this.expanded = false
  }

  render() {
    const { selectedDate } = store.getState()
    const formattedDate = this.formatDate(selectedDate)
    
    return `
      <header class="top-nav">
        <div class="top-nav-title">PWAte</div>
        <div class="date-picker" id="date-picker">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${formattedDate}</span>
        </div>
      </header>
      <input type="date" id="date-input" style="position: absolute; opacity: 0; pointer-events: none;" value="${selectedDate.toISOString().split('T')[0]}">
    `
  }

  formatDate(date) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateStr = date.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    if (dateStr === todayStr) return 'Today'
    if (dateStr === yesterdayStr) return 'Yesterday'
    if (dateStr === tomorrowStr) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  mount(container) {
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  attachEventListeners() {
    const datePicker = document.getElementById('date-picker')
    const dateInput = document.getElementById('date-input')
    
    datePicker.addEventListener('click', () => {
      dateInput.showPicker()
    })
    
    dateInput.addEventListener('change', (e) => {
      const newDate = new Date(e.target.value + 'T00:00:00')
      store.setSelectedDate(newDate)
      this.update()
    })
  }

  update() {
    const container = document.querySelector('.top-nav')
    if (container) {
      const parent = container.parentElement
      this.mount(parent)
    }
  }
}

export const topNavBar = new TopNavBar()
export default topNavBar
