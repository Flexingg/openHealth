import { router } from '../../router/router.js'
import { store } from '../../state/store.js'

/**
 * BottomNav component with pill-style navigation
 */
class BottomNav {
  constructor() {
    this.items = [
      { id: 'dashboard', label: 'Today', icon: 'home', path: '/' },
      { id: 'diary', label: 'Diary', icon: 'list', path: '/diary' },
      { id: 'settings', label: 'Config', icon: 'settings', path: '/settings' }
    ]
  }

  render() {
    const currentPath = store.getState().currentRoute
    
    return `
      <nav class="bottom-nav">
        ${this.items.map(item => {
          const isActive = currentPath === item.path
          return `
            <button class="nav-item ${isActive ? 'active' : ''}" data-path="${item.path}">
              <div class="nav-pill-container">
                <div class="nav-pill"></div>
                ${this.getIcon(item.icon)}
              </div>
              <span>${item.label}</span>
            </button>
          `
        }).join('')}
      </nav>
    `
  }

  getIcon(name) {
    const icons = {
      home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>`,
      list: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>`,
      settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>`
    }
    return icons[name] || ''
  }

  mount(container) {
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  attachEventListeners() {
    const nav = document.querySelector('.bottom-nav')
    if (!nav) return
    
    const items = nav.querySelectorAll('.nav-item')
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const path = item.dataset.path
        router.navigate(path)
      })
    })
  }

  update() {
    const container = document.querySelector('.bottom-nav')
    if (container) {
      container.outerHTML = this.render()
      this.attachEventListeners()
    }
  }
}

export const bottomNav = new BottomNav()
export default bottomNav
