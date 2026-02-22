import { store } from '../state/store.js'
import { themeManager } from '../theme/ThemeManager.js'
import { goalsService } from '../services/goalsService.js'
import { settingsService } from '../services/settingsService.js'
import { storageManager } from '../utils/StorageManager.js'
import { supabase } from '../config/supabase.js'
import { router } from '../router/router.js'

/**
 * Settings view with theme, goals, and AI configuration
 */
class Settings {
  constructor() {
    this.loading = true
    this.saving = false
    this.error = null
    this.success = null
    
    // Form state
    this.themeMode = 'system'
    this.accentColor = '#10b981'
    this.goals = {
      target_calories: 2000,
      target_protein: 150,
      target_carbs: 200,
      target_fat: 65
    }
    this.aiConfig = {
      provider: 'openai',
      apiKey: '',
      modelName: ''
    }
    
    // Available options
    this.accentColors = themeManager.getAccentColors()
    this.themeModes = themeManager.getThemeModes()
    this.aiProviders = [
      { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
      { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-3-haiku-20240307' },
      { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-1.5-flash' }
    ]
  }

  async fetchData() {
    this.loading = true
    
    try {
      // Fetch settings and goals in parallel
      const [settings, goals, aiConfig] = await Promise.all([
        settingsService.getSettings().catch(() => null),
        goalsService.getLatestGoals().catch(() => null),
        storageManager.getAIConfig().catch(() => null)
      ])
      
      if (settings) {
        this.themeMode = settings.theme_mode || 'system'
        this.accentColor = settings.accent_color || '#10b981'
      }
      
      if (goals) {
        this.goals = {
          target_calories: goals.target_calories || 2000,
          target_protein: goals.target_protein || 150,
          target_carbs: goals.target_carbs || 200,
          target_fat: goals.target_fat || 65
        }
      }
      
      if (aiConfig) {
        this.aiConfig = aiConfig
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      this.error = 'Failed to load settings'
    } finally {
      this.loading = false
    }
  }

  render() {
    if (this.loading) {
      return `
        <div class="main-content">
          <div class="text-center mt-md">
            <div class="spinner"></div>
            <p class="text-secondary mt-sm">Loading settings...</p>
          </div>
        </div>
      `
    }

    const user = store.getState().user

    return `
      <div class="main-content">
        ${this.error ? `<div class="form-error mb-md">${this.error}</div>` : ''}
        ${this.success ? `<div class="form-success mb-md">${this.success}</div>` : ''}
        
        <!-- Appearance Section -->
        <div class="settings-section">
          <div class="settings-section-title">Appearance</div>
          
          <div class="settings-item">
            <div class="settings-item-label">Theme</div>
            <div class="theme-modes">
              ${this.themeModes.map(mode => `
                <button class="theme-mode-btn ${this.themeMode === mode.value ? 'selected' : ''}" data-theme-mode="${mode.value}">
                  ${mode.label}
                </button>
              `).join('')}
            </div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-label">Accent Color</div>
            <div class="color-picker">
              ${this.accentColors.map(color => `
                <button 
                  class="color-option ${this.accentColor === color.hex ? 'selected' : ''}" 
                  style="background-color: ${color.hex};"
                  data-color="${color.hex}"
                  title="${color.name}"
                ></button>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- Nutrition Goals Section -->
        <div class="settings-section">
          <div class="settings-section-title">Nutrition Goals</div>
          
          <div class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Calories</label>
                <input type="number" id="goal-calories" class="form-input" value="${this.goals.target_calories}" />
              </div>
              <div class="form-group">
                <label class="form-label">Protein (g)</label>
                <input type="number" id="goal-protein" class="form-input" value="${this.goals.target_protein}" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Carbs (g)</label>
                <input type="number" id="goal-carbs" class="form-input" value="${this.goals.target_carbs}" />
              </div>
              <div class="form-group">
                <label class="form-label">Fat (g)</label>
                <input type="number" id="goal-fat" class="form-input" value="${this.goals.target_fat}" />
              </div>
            </div>
            <button class="btn btn-primary mt-md" id="save-goals-btn" ${this.saving ? 'disabled' : ''}>
              ${this.saving ? '<span class="spinner"></span>' : 'Save Goals'}
            </button>
          </div>
        </div>
        
        <!-- AI Configuration Section -->
        <div class="settings-section">
          <div class="settings-section-title">AI Configuration</div>
          <p class="settings-note">Your API key is stored locally and never sent to our servers.</p>
          
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">Provider</label>
              <select id="ai-provider" class="form-input">
                ${this.aiProviders.map(p => `
                  <option value="${p.value}" ${this.aiConfig.provider === p.value ? 'selected' : ''}>${p.label}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input 
                type="password" 
                id="ai-api-key" 
                class="form-input" 
                value="${this.aiConfig.apiKey || ''}"
                placeholder="Enter your API key"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Model Name</label>
              <input 
                type="text" 
                id="ai-model" 
                class="form-input" 
                value="${this.aiConfig.modelName || ''}"
                placeholder="e.g., gpt-4o-mini"
              />
            </div>
            
            <button class="btn btn-primary mt-md" id="save-ai-btn" ${this.saving ? 'disabled' : ''}>
              ${this.saving ? '<span class="spinner"></span>' : 'Save AI Config'}
            </button>
          </div>
        </div>
        
        <!-- Account Section -->
        <div class="settings-section">
          <div class="settings-section-title">Account</div>
          
          <div class="settings-item">
            <div class="settings-item-label">Email</div>
            <div class="settings-item-value">${user?.email || 'Unknown'}</div>
          </div>
          
          <div class="settings-item">
            <button class="btn btn-secondary btn-full" id="logout-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </div>
    `
  }

  mount(container) {
    this.addStyles()
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  addStyles() {
    if (!document.getElementById('settings-styles')) {
      const style = document.createElement('style')
      style.id = 'settings-styles'
      style.textContent = `
        .settings-form {
          padding: var(--md-spacing-md);
        }
        .form-row {
          display: flex;
          gap: var(--md-spacing-md);
        }
        .form-row .form-group {
          flex: 1;
        }
        .settings-note {
          padding: var(--md-spacing-sm) var(--md-spacing-md);
          font-size: 0.75rem;
          color: var(--md-text-secondary);
          background: var(--md-surface-variant);
        }
        .form-success {
          padding: var(--md-spacing-sm) var(--md-spacing-md);
          background: rgba(16, 185, 129, 0.1);
          color: var(--md-success);
          border-radius: var(--md-shape-small);
          font-size: 0.875rem;
        }
      `
      document.head.appendChild(style)
    }
  }

  attachEventListeners() {
    // Theme mode buttons
    const themeModeBtns = document.querySelectorAll('.theme-mode-btn')
    themeModeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleThemeModeChange(btn.dataset.themeMode))
    })
    
    // Color picker
    const colorBtns = document.querySelectorAll('.color-option')
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleAccentColorChange(btn.dataset.color))
    })
    
    // Save goals
    const saveGoalsBtn = document.getElementById('save-goals-btn')
    if (saveGoalsBtn) {
      saveGoalsBtn.addEventListener('click', () => this.saveGoals())
    }
    
    // AI provider change
    const aiProviderSelect = document.getElementById('ai-provider')
    if (aiProviderSelect) {
      aiProviderSelect.addEventListener('change', (e) => {
        const provider = this.aiProviders.find(p => p.value === e.target.value)
        const modelInput = document.getElementById('ai-model')
        if (provider && modelInput && !modelInput.value) {
          modelInput.placeholder = `e.g., ${provider.defaultModel}`
        }
      })
    }
    
    // Save AI config
    const saveAiBtn = document.getElementById('save-ai-btn')
    if (saveAiBtn) {
      saveAiBtn.addEventListener('click', () => this.saveAIConfig())
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout())
    }
  }

  async handleThemeModeChange(mode) {
    this.themeMode = mode
    
    try {
      await themeManager.setThemeMode(mode)
      this.success = 'Theme updated'
      setTimeout(() => {
        this.success = null
        this.mount(document.getElementById('main-view'))
      }, 2000)
    } catch (error) {
      this.error = 'Failed to update theme'
    }
    
    this.mount(document.getElementById('main-view'))
  }

  async handleAccentColorChange(color) {
    this.accentColor = color
    
    try {
      await themeManager.setAccentColor(color)
      this.success = 'Accent color updated'
      setTimeout(() => {
        this.success = null
        this.mount(document.getElementById('main-view'))
      }, 2000)
    } catch (error) {
      this.error = 'Failed to update accent color'
    }
    
    this.mount(document.getElementById('main-view'))
  }

  async saveGoals() {
    const calories = parseFloat(document.getElementById('goal-calories').value)
    const protein = parseFloat(document.getElementById('goal-protein').value)
    const carbs = parseFloat(document.getElementById('goal-carbs').value)
    const fat = parseFloat(document.getElementById('goal-fat').value)
    
    this.saving = true
    this.error = null
    this.mount(document.getElementById('main-view'))
    
    try {
      await goalsService.updateTodayGoals({
        target_calories: calories,
        target_protein: protein,
        target_carbs: carbs,
        target_fat: fat
      })
      
      store.setGoals({
        target_calories: calories,
        target_protein: protein,
        target_carbs: carbs,
        target_fat: fat
      })
      
      this.success = 'Goals saved'
      setTimeout(() => {
        this.success = null
        this.mount(document.getElementById('main-view'))
      }, 2000)
    } catch (error) {
      this.error = 'Failed to save goals'
    } finally {
      this.saving = false
      this.mount(document.getElementById('main-view'))
    }
  }

  async saveAIConfig() {
    const provider = document.getElementById('ai-provider').value
    const apiKey = document.getElementById('ai-api-key').value
    const modelName = document.getElementById('ai-model').value
    
    if (!provider || !apiKey || !modelName) {
      this.error = 'Please fill in all AI configuration fields'
      this.mount(document.getElementById('main-view'))
      return
    }
    
    this.saving = true
    this.error = null
    this.mount(document.getElementById('main-view'))
    
    try {
      await storageManager.saveAIConfig({
        provider,
        apiKey,
        modelName
      })
      
      this.aiConfig = { provider, apiKey, modelName }
      this.success = 'AI configuration saved'
      setTimeout(() => {
        this.success = null
        this.mount(document.getElementById('main-view'))
      }, 2000)
    } catch (error) {
      this.error = 'Failed to save AI configuration'
    } finally {
      this.saving = false
      this.mount(document.getElementById('main-view'))
    }
  }

  async handleLogout() {
    try {
      await supabase.auth.signOut()
      router.navigate('/')
    } catch (error) {
      this.error = 'Failed to log out'
      this.mount(document.getElementById('main-view'))
    }
  }

  async init() {
    await this.fetchData()
  }
}

export default Settings
