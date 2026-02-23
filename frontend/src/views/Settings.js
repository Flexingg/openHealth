import { store } from '../state/store.js'
import { themeManager } from '../theme/ThemeManager.js'
import { goalsService } from '../services/goalsService.js'
import { settingsService } from '../services/settingsService.js'
import { supabase } from '../config/supabase.js'
import { router } from '../router/router.js'

/**
 * Settings view with theme, goals, AI configuration, and user preferences
 * All fields auto-save on blur/change
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
    
    // Profile settings
    this.profile = {
      birthday: null,
      sex: null,
      heightFt: '',
      heightIn: '',
      heightCm: ''
    }
    
    // Unit preferences
    this.units = {
      weight: 'lbs',
      height: 'ft',
      water: 'oz',
      distance: 'mi'
    }
    
    // Quick water sizes (in user's preferred unit for display)
    this.waterSizes = {
      size1: 8,
      size2: 16,
      size3: 24
    }
    
    // Fitness experience
    this.fitness = {
      cardio: 'none',
      lifting: 'none'
    }
    
    // Available options
    this.accentColors = themeManager.getAccentColors()
    this.themeModes = themeManager.getThemeModes()
    this.aiProviders = [
      { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
      { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-3-haiku-20240307' },
      { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-1.5-flash' }
    ]
    this.sexOptions = [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]
    this.experienceLevels = [
      { value: 'none', label: 'None' },
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' }
    ]
    
    // Debounce timer for auto-save
    this.saveTimeout = null
  }

  async fetchData() {
    this.loading = true
    
    try {
      // Fetch all settings in parallel
      const [settings, goals] = await Promise.all([
        settingsService.getSettings().catch(() => null),
        goalsService.getLatestGoals().catch(() => null)
      ])
      
      if (settings) {
        // Theme
        this.themeMode = settings.theme_mode || 'system'
        this.accentColor = settings.accent_color || '#10b981'
        
        // AI Config
        this.aiConfig = {
          provider: settings.ai_provider || 'openai',
          apiKey: settings.ai_api_key || '',
          modelName: settings.ai_model_name || ''
        }
        
        // Units
        this.units = {
          weight: settings.weight_unit || 'lbs',
          height: settings.height_unit || 'ft',
          water: settings.water_unit || 'oz',
          distance: settings.distance_unit || 'mi'
        }
        
        // Quick water sizes - convert from ml to display unit
        const ML_PER_OZ = 29.5735
        const waterUnit = settings.water_unit || 'oz'
        this.waterSizes = {
          size1: waterUnit === 'oz' 
            ? Math.round((settings.quick_water_size_1 || 236.588) / ML_PER_OZ)
            : Math.round(settings.quick_water_size_1 || 236.588),
          size2: waterUnit === 'oz'
            ? Math.round((settings.quick_water_size_2 || 473.176) / ML_PER_OZ)
            : Math.round(settings.quick_water_size_2 || 473.176),
          size3: waterUnit === 'oz'
            ? Math.round((settings.quick_water_size_3 || 709.765) / ML_PER_OZ)
            : Math.round(settings.quick_water_size_3 || 709.765)
        }
        
        // Profile
        if (settings.birthday) {
          this.profile.birthday = settings.birthday
        }
        this.profile.sex = settings.sex || null
        if (settings.height_cm) {
          // Store both metric and imperial values
          this.profile.heightCm = Math.round(settings.height_cm)
          const heightDisplay = settingsService.cmToFtIn(settings.height_cm)
          this.profile.heightFt = heightDisplay.ft
          this.profile.heightIn = heightDisplay.in
        }
        
        // Fitness
        this.fitness = {
          cardio: settings.cardio_experience || 'none',
          lifting: settings.lifting_experience || 'none'
        }
        
        // Update store
        store.setUserSettings({
          themeMode: this.themeMode,
          accentColor: this.accentColor,
          aiProvider: this.aiConfig.provider,
          aiModelName: this.aiConfig.modelName,
          weightUnit: this.units.weight,
          heightUnit: this.units.height,
          waterUnit: this.units.water,
          distanceUnit: this.units.distance,
          quickWaterSize1: settings.quick_water_size_1 || 236.588,
          quickWaterSize2: settings.quick_water_size_2 || 473.176,
          quickWaterSize3: settings.quick_water_size_3 || 709.765,
          birthday: this.profile.birthday,
          sex: this.profile.sex,
          heightCm: settings.height_cm || null,
          cardioExperience: this.fitness.cardio,
          liftingExperience: this.fitness.lifting
        })
      }
      
      if (goals) {
        this.goals = {
          target_calories: goals.target_calories || 2000,
          target_protein: goals.target_protein || 150,
          target_carbs: goals.target_carbs || 200,
          target_fat: goals.target_fat || 65
        }
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
        ${this.saving ? `<div class="saving-indicator">Saving...</div>` : ''}
        
        <!-- Profile Section -->
        <div class="settings-section">
          <div class="settings-section-title">Profile</div>
          
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">Birthday</label>
              <input type="date" id="profile-birthday" class="form-input" value="${this.profile.birthday || ''}" />
            </div>
            
            <div class="form-group">
              <label class="form-label">Sex</label>
              <select id="profile-sex" class="form-input">
                <option value="">Select...</option>
                ${this.sexOptions.map(opt => `
                  <option value="${opt.value}" ${this.profile.sex === opt.value ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Height</label>
              ${this.units.height === 'cm' ? `
                <div class="height-inputs">
                  <input type="number" id="height-cm" class="form-input height-cm" placeholder="cm" value="${this.profile.heightCm || ''}" min="0" max="300" />
                  <span class="height-label">cm</span>
                </div>
              ` : `
                <div class="height-inputs">
                  <input type="number" id="height-ft" class="form-input height-ft" placeholder="ft" value="${this.profile.heightFt || ''}" min="0" max="9" />
                  <span class="height-label">ft</span>
                  <input type="number" id="height-in" class="form-input height-in" placeholder="in" value="${this.profile.heightIn || ''}" min="0" max="11" />
                  <span class="height-label">in</span>
                </div>
              `}
            </div>
          </div>
        </div>
        
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
        
        <!-- Units Section -->
        <div class="settings-section">
          <div class="settings-section-title">Units</div>
          
          <div class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Weight</label>
                <select id="unit-weight" class="form-input">
                  <option value="lbs" ${this.units.weight === 'lbs' ? 'selected' : ''}>Pounds (lbs)</option>
                  <option value="kg" ${this.units.weight === 'kg' ? 'selected' : ''}>Kilograms (kg)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Height</label>
                <select id="unit-height" class="form-input">
                  <option value="ft" ${this.units.height === 'ft' ? 'selected' : ''}>Feet/Inches</option>
                  <option value="cm" ${this.units.height === 'cm' ? 'selected' : ''}>Centimeters</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Water</label>
                <select id="unit-water" class="form-input">
                  <option value="oz" ${this.units.water === 'oz' ? 'selected' : ''}>Ounces (oz)</option>
                  <option value="ml" ${this.units.water === 'ml' ? 'selected' : ''}>Milliliters (ml)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Distance</label>
                <select id="unit-distance" class="form-input">
                  <option value="mi" ${this.units.distance === 'mi' ? 'selected' : ''}>Miles (mi)</option>
                  <option value="km" ${this.units.distance === 'km' ? 'selected' : ''}>Kilometers (km)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Water Sizes Section -->
        <div class="settings-section">
          <div class="settings-section-title">Quick Water Sizes</div>
          <p class="settings-note">Customize your 3 quick-add water button sizes.</p>
          
          <div class="settings-form">
            <div class="form-row water-sizes-row">
              <div class="form-group">
                <label class="form-label">Size 1</label>
                <div class="input-with-unit">
                  <input type="number" id="water-size-1" class="form-input" value="${this.waterSizes.size1}" min="1" />
                  <span class="unit-label">${this.units.water}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Size 2</label>
                <div class="input-with-unit">
                  <input type="number" id="water-size-2" class="form-input" value="${this.waterSizes.size2}" min="1" />
                  <span class="unit-label">${this.units.water}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Size 3</label>
                <div class="input-with-unit">
                  <input type="number" id="water-size-3" class="form-input" value="${this.waterSizes.size3}" min="1" />
                  <span class="unit-label">${this.units.water}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Fitness Experience Section -->
        <div class="settings-section">
          <div class="settings-section-title">Fitness Experience</div>
          
          <div class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cardio</label>
                <select id="fitness-cardio" class="form-input">
                  ${this.experienceLevels.map(opt => `
                    <option value="${opt.value}" ${this.fitness.cardio === opt.value ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Lifting</label>
                <select id="fitness-lifting" class="form-input">
                  ${this.experienceLevels.map(opt => `
                    <option value="${opt.value}" ${this.fitness.lifting === opt.value ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI Configuration Section -->
        <div class="settings-section">
          <div class="settings-section-title">AI Configuration</div>
          <p class="settings-note">Configure your AI provider for smart logging features.</p>
          
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
        .water-sizes-row .form-group {
          flex: 1;
          min-width: 80px;
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
        .saving-indicator {
          position: fixed;
          top: 70px;
          right: 20px;
          background: var(--md-primary);
          color: var(--md-on-primary);
          padding: var(--md-spacing-sm) var(--md-spacing-md);
          border-radius: var(--md-shape-small);
          font-size: 0.875rem;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .height-inputs {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
        }
        .height-ft {
          width: 70px;
        }
        .height-in {
          width: 70px;
        }
        .height-cm {
          width: 100px;
        }
        .height-label {
          color: var(--md-text-secondary);
          font-size: 0.875rem;
        }
        .input-with-unit {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
        }
        .input-with-unit .form-input {
          flex: 1;
        }
        .unit-label {
          color: var(--md-text-secondary);
          font-size: 0.875rem;
          min-width: 24px;
        }
      `
      document.head.appendChild(style)
    }
  }

  attachEventListeners() {
    // Theme mode buttons - immediate save
    const themeModeBtns = document.querySelectorAll('.theme-mode-btn')
    themeModeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleThemeModeChange(btn.dataset.themeMode))
    })
    
    // Color picker - immediate save
    const colorBtns = document.querySelectorAll('.color-option')
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleAccentColorChange(btn.dataset.color))
    })
    
    // Profile fields - auto-save on blur/change
    this.addAutoSaveListener('profile-birthday', 'blur', () => this.saveProfile())
    this.addAutoSaveListener('profile-sex', 'change', () => this.saveProfile())
    this.addAutoSaveListener('height-ft', 'blur', () => this.saveProfile())
    this.addAutoSaveListener('height-in', 'blur', () => this.saveProfile())
    this.addAutoSaveListener('height-cm', 'blur', () => this.saveProfile())
    
    // Unit fields - immediate save on change (triggers re-render for height input)
    this.addAutoSaveListener('unit-weight', 'change', () => this.saveUnits())
    this.addAutoSaveListener('unit-height', 'change', () => this.saveUnits(true)) // Re-render needed
    this.addAutoSaveListener('unit-water', 'change', () => this.saveUnits(true)) // Re-render needed
    this.addAutoSaveListener('unit-distance', 'change', () => this.saveUnits())
    
    // Water sizes - auto-save on blur
    this.addAutoSaveListener('water-size-1', 'blur', () => this.saveWaterSizes())
    this.addAutoSaveListener('water-size-2', 'blur', () => this.saveWaterSizes())
    this.addAutoSaveListener('water-size-3', 'blur', () => this.saveWaterSizes())
    
    // Fitness - immediate save on change
    this.addAutoSaveListener('fitness-cardio', 'change', () => this.saveFitness())
    this.addAutoSaveListener('fitness-lifting', 'change', () => this.saveFitness())
    
    // Goals - auto-save on blur
    this.addAutoSaveListener('goal-calories', 'blur', () => this.saveGoals())
    this.addAutoSaveListener('goal-protein', 'blur', () => this.saveGoals())
    this.addAutoSaveListener('goal-carbs', 'blur', () => this.saveGoals())
    this.addAutoSaveListener('goal-fat', 'blur', () => this.saveGoals())
    
    // AI config - auto-save on blur
    this.addAutoSaveListener('ai-provider', 'change', () => this.saveAIConfig())
    this.addAutoSaveListener('ai-api-key', 'blur', () => this.saveAIConfig())
    this.addAutoSaveListener('ai-model', 'blur', () => this.saveAIConfig())
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout())
    }
  }

  addAutoSaveListener(elementId, event, callback) {
    const element = document.getElementById(elementId)
    if (element) {
      element.addEventListener(event, callback)
    }
  }

  showSaving() {
    this.saving = true
    const indicator = document.querySelector('.saving-indicator')
    if (!indicator) {
      const mainView = document.getElementById('main-view')
      if (mainView) {
        const div = document.createElement('div')
        div.className = 'saving-indicator'
        div.textContent = 'Saving...'
        mainView.prepend(div)
      }
    }
  }

  hideSaving() {
    this.saving = false
    const indicator = document.querySelector('.saving-indicator')
    if (indicator) {
      indicator.remove()
    }
  }

  showSuccess(message) {
    this.success = message
    this.hideSaving()
    const mainView = document.getElementById('main-view')
    if (mainView) {
      mainView.innerHTML = this.render()
      this.attachEventListeners()
    }
    setTimeout(() => {
      this.success = null
      const successEl = document.querySelector('.form-success')
      if (successEl) {
        successEl.remove()
      }
    }, 2000)
  }

  showError(message) {
    this.error = message
    this.hideSaving()
    const mainView = document.getElementById('main-view')
    if (mainView) {
      mainView.innerHTML = this.render()
      this.attachEventListeners()
    }
  }

  async handleThemeModeChange(mode) {
    this.themeMode = mode
    
    try {
      await themeManager.setThemeMode(mode)
      this.showSuccess('Theme updated')
    } catch (error) {
      this.showError('Failed to update theme')
    }
  }

  async handleAccentColorChange(color) {
    this.accentColor = color
    
    try {
      await themeManager.setAccentColor(color)
      this.showSuccess('Accent color updated')
    } catch (error) {
      this.showError('Failed to update accent color')
    }
  }

  async saveProfile() {
    const birthday = document.getElementById('profile-birthday')?.value || null
    const sex = document.getElementById('profile-sex')?.value || null
    
    // Get height based on current unit preference
    let heightCm = null
    if (this.units.height === 'cm') {
      const heightCmInput = parseInt(document.getElementById('height-cm')?.value) || 0
      if (heightCmInput > 0) {
        heightCm = heightCmInput
      }
    } else {
      const heightFt = parseInt(document.getElementById('height-ft')?.value) || 0
      const heightIn = parseInt(document.getElementById('height-in')?.value) || 0
      if (heightFt > 0 || heightIn > 0) {
        heightCm = settingsService.ftInToCm(heightFt, heightIn)
      }
    }
    
    this.showSaving()
    
    try {
      await settingsService.updateProfile({
        birthday,
        sex,
        heightCm
      })
      
      // Update local state
      this.profile.birthday = birthday
      this.profile.sex = sex
      if (heightCm) {
        this.profile.heightCm = Math.round(heightCm)
        const heightDisplay = settingsService.cmToFtIn(heightCm)
        this.profile.heightFt = heightDisplay.ft
        this.profile.heightIn = heightDisplay.in
      }
      
      // Update store
      store.setUserSettings({
        birthday,
        sex,
        heightCm
      })
      
      this.showSuccess('Profile saved')
    } catch (error) {
      this.showError('Failed to save profile')
    }
  }

  async saveUnits(reRender = false) {
    const weight = document.getElementById('unit-weight')?.value
    const height = document.getElementById('unit-height')?.value
    const water = document.getElementById('unit-water')?.value
    const distance = document.getElementById('unit-distance')?.value
    
    this.showSaving()
    
    try {
      await settingsService.updateUnitPreferences({ weight, height, water, distance })
      
      // Update local state
      this.units = { weight, height, water, distance }
      
      // Update store
      store.setUserSettings({
        weightUnit: weight,
        heightUnit: height,
        waterUnit: water,
        distanceUnit: distance
      })
      
      if (reRender) {
        // Re-render to update height input and water unit labels
        this.hideSaving()
        const mainView = document.getElementById('main-view')
        if (mainView) {
          mainView.innerHTML = this.render()
          this.attachEventListeners()
        }
      }
      
      this.showSuccess('Units saved')
    } catch (error) {
      this.showError('Failed to save units')
    }
  }

  async saveWaterSizes() {
    const size1 = parseFloat(document.getElementById('water-size-1')?.value) || 8
    const size2 = parseFloat(document.getElementById('water-size-2')?.value) || 16
    const size3 = parseFloat(document.getElementById('water-size-3')?.value) || 24
    
    // Convert to ml for storage
    const ML_PER_OZ = 29.5735
    const size1Ml = this.units.water === 'oz' ? size1 * ML_PER_OZ : size1
    const size2Ml = this.units.water === 'oz' ? size2 * ML_PER_OZ : size2
    const size3Ml = this.units.water === 'oz' ? size3 * ML_PER_OZ : size3
    
    this.showSaving()
    
    try {
      await settingsService.updateQuickWaterSizes({
        size1: size1Ml,
        size2: size2Ml,
        size3: size3Ml
      })
      
      // Update local state
      this.waterSizes = { size1, size2, size3 }
      
      // Update store
      store.setUserSettings({
        quickWaterSize1: size1Ml,
        quickWaterSize2: size2Ml,
        quickWaterSize3: size3Ml
      })
      
      this.showSuccess('Water sizes saved')
    } catch (error) {
      this.showError('Failed to save water sizes')
    }
  }

  async saveFitness() {
    const cardio = document.getElementById('fitness-cardio')?.value
    const lifting = document.getElementById('fitness-lifting')?.value
    
    this.showSaving()
    
    try {
      await settingsService.updateFitnessExperience({ cardio, lifting })
      
      // Update local state
      this.fitness = { cardio, lifting }
      
      // Update store
      store.setUserSettings({
        cardioExperience: cardio,
        liftingExperience: lifting
      })
      
      this.showSuccess('Experience saved')
    } catch (error) {
      this.showError('Failed to save experience')
    }
  }

  async saveGoals() {
    const calories = parseFloat(document.getElementById('goal-calories')?.value)
    const protein = parseFloat(document.getElementById('goal-protein')?.value)
    const carbs = parseFloat(document.getElementById('goal-carbs')?.value)
    const fat = parseFloat(document.getElementById('goal-fat')?.value)
    
    this.showSaving()
    
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
      
      this.showSuccess('Goals saved')
    } catch (error) {
      this.showError('Failed to save goals')
    }
  }

  async saveAIConfig() {
    const provider = document.getElementById('ai-provider')?.value
    const apiKey = document.getElementById('ai-api-key')?.value
    const modelName = document.getElementById('ai-model')?.value
    
    if (!provider || !apiKey || !modelName) {
      return // Don't save incomplete config
    }
    
    this.showSaving()
    
    try {
      await settingsService.updateAIConfig({
        provider,
        apiKey,
        modelName
      })
      
      this.aiConfig = { provider, apiKey, modelName }
      
      // Update store
      store.setUserSettings({
        aiProvider: provider,
        aiModelName: modelName
      })
      
      this.showSuccess('AI configuration saved')
    } catch (error) {
      this.showError('Failed to save AI configuration')
    }
  }

  async handleLogout() {
    try {
      await supabase.auth.signOut()
      router.navigate('/')
    } catch (error) {
      this.showError('Failed to log out')
    }
  }

  async init() {
    await this.fetchData()
  }
}

export default Settings
