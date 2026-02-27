import './styles/main.css'
import { supabase } from './config/supabase.js'
import { store } from './state/store.js'
import { toSentenceCaps } from './utils/textFormatter.js'
import { router } from './router/router.js'
import { themeManager } from './theme/ThemeManager.js'
import { aiService } from './services/aiService.js'
import { logService } from './services/logService.js'
import { foodService } from './services/foodService.js'
import { waterService } from './services/waterService.js'
import { weightService } from './services/weightService.js'
import { settingsService } from './services/settingsService.js'
import AuthScreen from './components/auth/AuthScreen.js'
import topNavBar from './components/navigation/TopNavBar.js'
import bottomNav from './components/navigation/BottomNav.js'
import FabSpeedDial from './components/common/FabSpeedDial.js'
import BottomSheet from './components/common/BottomSheet.js'
import AIModal from './components/common/AIModal.js'
import EditLogModal from './components/common/EditLogModal.js'
import WaterModal from './components/common/WaterModal.js'
import WeightModal from './components/common/WeightModal.js'
import Dashboard from './views/Dashboard.js'
import Diary from './views/Diary.js'
import Settings from './views/Settings.js'

// View instances
let dashboard = null
let diary = null
let settings = null
let fabSpeedDial = null
let bottomSheet = null
let aiModal = null
let editLogModal = null
let waterModal = null
let weightModal = null

/**
 * Main App class
 */
class App {
  constructor() {
    this.authScreen = null
    this.currentView = null
  }

  async init() {
    // Initialize theme manager
    await themeManager.init()
    
    // Load user settings into store
    await this.loadUserSettings()
    
    // Set up auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        store.setUser(session?.user)
        this.loadUserSettings()
        this.renderApp()
      } else if (event === 'SIGNED_OUT') {
        store.setUser(null)
        this.renderAuth()
      }
    })
    
    // Check initial auth state
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      store.setUser(user)
      this.renderApp()
    } else {
      this.renderAuth()
    }
    
    // Set up router
    this.setupRouter()
    router.init()
  }

  /**
   * Load user settings from the database into the store
   */
  async loadUserSettings() {
    try {
      const settings = await settingsService.getSettings()
      if (settings) {
        store.setUserSettings({
          themeMode: settings.theme_mode || 'system',
          accentColor: settings.accent_color || '#10b981',
          aiProvider: settings.ai_provider || null,
          aiModelName: settings.ai_model_name || null,
          weightUnit: settings.weight_unit || 'lbs',
          heightUnit: settings.height_unit || 'ft',
          waterUnit: settings.water_unit || 'oz',
          distanceUnit: settings.distance_unit || 'mi',
          quickWaterSize1: settings.quick_water_size_1 || 236.588,
          quickWaterSize2: settings.quick_water_size_2 || 473.176,
          quickWaterSize3: settings.quick_water_size_3 || 709.765,
          birthday: settings.birthday || null,
          sex: settings.sex || null,
          heightCm: settings.height_cm || null,
          cardioExperience: settings.cardio_experience || 'none',
          liftingExperience: settings.lifting_experience || 'none'
        })
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }

  setupRouter() {
    router.register('/', () => this.showDashboard())
    router.register('/diary', () => this.showDiary())
    router.register('/settings', () => this.showSettings())
    router.register('/log/:id', (path) => this.showLogDetails(path))
    
    router.onRouteChange = (path) => {
      store.setRoute(path)
      bottomNav.update()
      this.updateFabVisibility(path)
    }
  }

  updateFabVisibility(path) {
    if (fabSpeedDial) {
      if (path === '/' || path === '/diary') {
        fabSpeedDial.show()
      } else {
        fabSpeedDial.hide()
      }
    }
  }

  renderAuth() {
    const app = document.getElementById('app')
    this.authScreen = new AuthScreen((user) => {
      store.setUser(user)
      this.renderApp()
    })
    this.authScreen.mount(app)
  }

  renderApp() {
    const app = document.getElementById('app')
    
    app.innerHTML = `
      <div id="top-nav-container"></div>
      <div id="main-view"></div>
      <div id="fab-container-wrapper"></div>
      <div id="bottom-sheet-container"></div>
      <div id="ai-modal-container"></div>
      <div id="edit-log-modal-container"></div>
      <div id="water-modal-container"></div>
      <div id="weight-modal-container"></div>
      <div id="bottom-nav-container"></div>
      <input type="file" id="native-camera-input" accept="image/*" capture="environment" style="display: none;">
    `
    
    // Mount navigation
    topNavBar.mount(document.getElementById('top-nav-container'))
    bottomNav.mount(document.getElementById('bottom-nav-container'))
    
    // Initialize FAB Speed Dial
    fabSpeedDial = new FabSpeedDial(
      () => this.openCamera(),
      () => this.openBottomSheet()
    )
    fabSpeedDial.mount(document.getElementById('fab-container-wrapper'))
    
    // Initialize Bottom Sheet
    bottomSheet = new BottomSheet((text) => this.handleSmartLog(text))
    bottomSheet.mount(document.getElementById('bottom-sheet-container'))
    
    // Initialize AI Modal
    aiModal = new AIModal(
      (result) => this.confirmLog(result),
      () => this.openBottomSheet()
    )
    aiModal.mount(document.getElementById('ai-modal-container'))
    
    // Initialize Edit Log Modal
    editLogModal = new EditLogModal()
    editLogModal.mount(document.getElementById('edit-log-modal-container'))
    
    // Initialize Water Modal
    waterModal = new WaterModal(() => this.handleWaterLogged())
    waterModal.addStyles()
    waterModal.mount(document.getElementById('water-modal-container'))
    
    // Listen for open water modal event
    window.addEventListener('open-water-modal', () => {
      if (waterModal) {
        waterModal.open()
      }
    })
    
    // Initialize Weight Modal
    weightModal = new WeightModal(() => this.handleWeightLogged())
    weightModal.addStyles()
    weightModal.mount(document.getElementById('weight-modal-container'))
    
    // Listen for open weight modal event
    window.addEventListener('open-weight-modal', () => {
      if (weightModal) {
        weightModal.open()
      }
    })
    
    // Set up camera input handler
    const cameraInput = document.getElementById('native-camera-input')
    if (cameraInput) {
      cameraInput.addEventListener('change', (e) => this.handleCameraCapture(e))
    }
    
    // Show initial view based on route
    router.handleRouteChange(window.location.pathname)
  }

  async showDashboard() {
    const container = document.getElementById('main-view')
    dashboard = new Dashboard()
    await dashboard.init()
    dashboard.mount(container)
    this.currentView = dashboard
    this.updateFabVisibility('/')
  }

  async showDiary() {
    const container = document.getElementById('main-view')
    diary = new Diary()
    await diary.init()
    diary.mount(container)
    this.currentView = diary
    this.updateFabVisibility('/diary')
  }

  async showSettings() {
    const container = document.getElementById('main-view')
    settings = new Settings()
    await settings.init()
    settings.mount(container)
    this.currentView = settings
    this.updateFabVisibility('/settings')
  }

  showLogDetails(path) {
    const logId = path.split('/log/')[1]
    
    // Open the edit modal
    editLogModal.open(
      logId,
      () => this.handleLogSaved(),
      () => this.handleLogDeleted(),
      () => this.handleModalClose()
    )
  }

  async handleLogSaved() {
    this.showToast('Log updated')
    // Refresh the current view
    if (this.currentView && this.currentView.init) {
      await this.currentView.init()
      this.currentView.mount(document.getElementById('main-view'))
    }
  }

  async handleLogDeleted() {
    this.showToast('Log deleted')
    // Navigate back to the previous page
    router.back()
    // Refresh the current view
    if (this.currentView && this.currentView.init) {
      await this.currentView.init()
      this.currentView.mount(document.getElementById('main-view'))
    }
  }

  handleModalClose() {
    // Navigate back when modal closes without action
    if (window.location.pathname.startsWith('/log/')) {
      router.back()
    }
  }

  openCamera() {
    const cameraInput = document.getElementById('native-camera-input')
    if (cameraInput) {
      cameraInput.click()
    }
  }

  openBottomSheet() {
    if (bottomSheet) {
      bottomSheet.open()
    }
  }

  openWaterModal() {
    if (waterModal) {
      waterModal.open()
    }
  }

  async handleWaterLogged() {
    // Refresh the current view
    if (this.currentView && this.currentView.init) {
      await this.currentView.init()
      this.currentView.mount(document.getElementById('main-view'))
    }
  }

  openWeightModal() {
    if (weightModal) {
      weightModal.open()
    }
  }

  async handleWeightLogged() {
    // Refresh the current view
    if (this.currentView && this.currentView.init) {
      await this.currentView.init()
      this.currentView.mount(document.getElementById('main-view'))
    }
  }

  async handleCameraCapture(e) {
    const file = e.target.files[0]
    if (!file) return
    
    aiModal.showThinking()
    
    try {
      const { base64, mimeType } = await aiService.compressImage(file)
      const result = await aiService.scanNutritionLabel(base64, mimeType)
      
      aiModal.showResult({
        logType: 'food',
        foodName: toSentenceCaps(result.name),
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
      })
    } catch (error) {
      aiModal.showError(error.message)
    }
  }

  async handleSmartLog(text) {
    console.log('handleSmartLog called with:', text)
    bottomSheet.close()
    aiModal.showThinking()
    
    try {
      // Check if AI is configured
      const isConfigured = await aiService.isConfigured()
      console.log('AI configured:', isConfigured)
      if (!isConfigured) {
        aiModal.showError('AI not configured. Please set up your AI provider in Settings.')
        return
      }
      
      // Call the smart log endpoint (handles food, water, weight)
      console.log('Calling smartLog...')
      const result = await aiService.smartLog(
        text,
        store.getSelectedDateString(),
        this.getDefaultMealTime()
      )
      console.log('smartLog result:', result)
      
      // The result includes logType: 'food' | 'water' | 'weight'
      // Pass through to AIModal which already handles all types
      console.log('Processing result, logType:', result.logType)
      
      if (result.logType === 'food') {
        console.log('Food result, food_not_found:', result.food_not_found)
        if (result.food_not_found) {
          // AI estimated nutrition for unknown food
          console.log('Showing estimated nutrition:', result.estimated_nutrition)
          const estimated = result.estimated_nutrition || {}
          aiModal.showResult({
            logType: 'food',
            foodName: toSentenceCaps(result.search_term),
            servings: result.servings || 1,
            serving_size: estimated.serving_size || 1,
            serving_unit: estimated.serving_unit || 'serving',
            serving_grams: estimated.serving_grams || null,
            calories: estimated.calories || 0,
            protein: estimated.protein || 0,
            carbs: estimated.carbs || 0,
            fat: estimated.fat || 0,
            calories_per_100g: estimated.calories_per_100g || null,
            protein_per_100g: estimated.protein_per_100g || null,
            carbs_per_100g: estimated.carbs_per_100g || null,
            fat_per_100g: estimated.fat_per_100g || null,
            common_servings: estimated.common_servings || null
          })
        } else {
          // Food found in database
          console.log('Showing found food:', result.foodName)
          aiModal.showResult({
            logType: 'food',
            foodName: toSentenceCaps(result.foodName),
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat
          })
        }
      } else if (result.logType === 'water') {
        console.log('Water result')
        aiModal.showResult({
          logType: 'water',
          amount: result.display_amount,
          unit: result.display_unit,
          amount_ml: result.amount_ml
        })
      } else if (result.logType === 'weight') {
        aiModal.showResult({
          logType: 'weight',
          amount: result.display_weight,
          unit: result.display_unit,
          weight_kg: result.weight_kg
        })
      }
    } catch (error) {
      aiModal.showError(error.message)
    }
  }

  async confirmLog(result) {
    if (!result) return
    
    try {
      if (result.logType === 'food') {
        // Create the food if it doesn't exist, then log it
        // Include estimated nutrition data if available
        const foodData = {
          name: result.foodName,
          serving_size: result.serving_size || 1,
          serving_unit: result.serving_unit || 'serving',
          serving_grams: result.serving_grams || null,
          calories: result.calories || 0,
          protein: result.protein || 0,
          carbs: result.carbs || 0,
          fat: result.fat || 0,
          calories_per_100g: result.calories_per_100g || null,
          protein_per_100g: result.protein_per_100g || null,
          carbs_per_100g: result.carbs_per_100g || null,
          fat_per_100g: result.fat_per_100g || null
        }
        
        const commonServings = result.common_servings || null
        
        const food = await foodService.createFood(foodData, commonServings)
        
        await logService.createLog({
          food_id: food.id,
          date: store.getSelectedDateString(),
          meal_time: this.getDefaultMealTime(),
          servings_consumed: result.servings || 1
        })
        
        this.showToast(`Logged: ${result.foodName}`)
      } else if (result.logType === 'water') {
        // Log water intake
        await waterService.logWater(
          result.amount_ml,
          store.getSelectedDateString()
        )
        
        this.showToast(`Logged: ${result.amount} ${result.unit} water`)
      } else if (result.logType === 'weight') {
        // Log body weight
        await weightService.logWeight(
          result.weight_kg,
          store.getSelectedDateString()
        )
        
        this.showToast(`Logged: ${result.amount} ${result.unit}`)
      }
      
      aiModal.close()
      bottomSheet.clear()
      
      // Refresh the current view
      if (this.currentView && this.currentView.init) {
        await this.currentView.init()
        this.currentView.mount(document.getElementById('main-view'))
      }
    } catch (error) {
      console.error('Failed to save log:', error)
      this.showToast('Failed to save log')
    }
  }

  getDefaultMealTime() {
    const hour = new Date().getHours()
    if (hour < 11) return 'Breakfast'
    if (hour < 14) return 'Lunch'
    if (hour < 18) return 'Snack'
    return 'Dinner'
  }

  showToast(message) {
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 96px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--md-on-surface);
      color: var(--md-surface);
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: var(--md-elevation-2);
      z-index: 100;
      animation: bounce 0.5s ease;
    `
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  app.init()
})

export default App
