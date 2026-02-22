import { store } from '../state/store.js'
import { foodService } from '../services/foodService.js'
import { logService } from '../services/logService.js'
import { aiService } from '../services/aiService.js'
import { router } from '../router/router.js'

/**
 * AddFood view - Full-screen logging with Text Search and Camera tabs
 */
class AddFood {
  constructor() {
    this.activeTab = 'text'
    this.searchTerm = ''
    this.searchResults = []
    this.loading = false
    this.error = null
    this.selectedFood = null
    this.servings = 1
    this.mealTime = this.getDefaultMealTime()
    this.cameraImage = null
    this.extractedNutrition = null
  }

  getDefaultMealTime() {
    const hour = new Date().getHours()
    if (hour < 11) return 'Breakfast'
    if (hour < 14) return 'Lunch'
    if (hour < 18) return 'Snack'
    return 'Dinner'
  }

  render() {
    return `
      <div class="add-food-view">
        <!-- Header -->
        <header class="add-food-header">
          <button class="btn btn-text" id="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
          <h2>Add Food</h2>
          <div style="width: 60px;"></div>
        </header>
        
        <!-- Tabs -->
        <div class="add-food-tabs">
          <button class="tab-btn ${this.activeTab === 'text' ? 'active' : ''}" data-tab="text">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Text Search
          </button>
          <button class="tab-btn ${this.activeTab === 'camera' ? 'active' : ''}" data-tab="camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Camera
          </button>
        </div>
        
        <!-- Meal & Date Selection -->
        <div class="add-food-options">
          <div class="option-group">
            <label>Meal</label>
            <select id="meal-time" class="form-input">
              <option value="Breakfast" ${this.mealTime === 'Breakfast' ? 'selected' : ''}>Breakfast</option>
              <option value="Lunch" ${this.mealTime === 'Lunch' ? 'selected' : ''}>Lunch</option>
              <option value="Dinner" ${this.mealTime === 'Dinner' ? 'selected' : ''}>Dinner</option>
              <option value="Snack" ${this.mealTime === 'Snack' ? 'selected' : ''}>Snack</option>
            </select>
          </div>
        </div>
        
        <!-- Tab Content -->
        <div class="add-food-content">
          ${this.activeTab === 'text' ? this.renderTextTab() : this.renderCameraTab()}
        </div>
        
        <!-- Selected Food Modal -->
        ${this.selectedFood ? this.renderServingModal() : ''}
      </div>
    `
  }

  renderTextTab() {
    return `
      <div class="text-tab">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            id="food-search" 
            class="form-input" 
            placeholder="Search foods..."
            value="${this.searchTerm}"
          />
        </div>
        
        ${this.loading ? `
          <div class="text-center mt-md">
            <div class="spinner"></div>
          </div>
        ` : ''}
        
        ${this.error ? `
          <div class="form-error mt-md">${this.error}</div>
        ` : ''}
        
        ${this.searchResults.length > 0 ? `
          <div class="search-results">
            ${this.searchResults.map(food => `
              <div class="search-result-item" data-food-id="${food.id}">
                <div class="food-info">
                  <div class="food-name">${food.name}</div>
                  <div class="food-meta">
                    ${food.brand ? `${food.brand} · ` : ''}
                    ${food.serving_size} ${food.serving_unit}
                  </div>
                </div>
                <div class="food-cal">${Math.round(food.calories)} cal</div>
              </div>
            `).join('')}
          </div>
        ` : this.searchTerm && !this.loading ? `
          <div class="text-center mt-lg">
            <p class="text-secondary">No foods found</p>
            <button class="btn btn-secondary mt-md" id="create-food-btn">
              Create New Food
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  renderCameraTab() {
    if (this.extractedNutrition) {
      return this.renderNutritionForm()
    }
    
    return `
      <div class="camera-tab">
        <div class="camera-preview" id="camera-preview">
          ${this.cameraImage ? `
            <img src="${this.cameraImage}" alt="Captured food" />
          ` : `
            <div class="camera-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <p>Take a photo of a nutrition label or your food</p>
            </div>
          `}
        </div>
        
        <div class="camera-actions">
          <label class="btn btn-primary btn-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Take Photo
            <input type="file" id="camera-input" accept="image/*" capture="environment" style="display: none;" />
          </label>
          
          <label class="btn btn-secondary btn-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Gallery
            <input type="file" id="gallery-input" accept="image/*" style="display: none;" />
          </label>
        </div>
        
        ${this.loading ? `
          <div class="text-center mt-md">
            <div class="spinner"></div>
            <p class="text-secondary mt-sm">Analyzing image...</p>
          </div>
        ` : ''}
        
        ${this.error ? `
          <div class="form-error mt-md">${this.error}</div>
        ` : ''}
      </div>
    `
  }

  renderNutritionForm() {
    return `
      <div class="nutrition-form">
        <h3>Verify Nutrition</h3>
        <p class="text-secondary mb-md">Review and edit the extracted nutrition info</p>
        
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" id="nutrition-name" class="form-input" value="${this.extractedNutrition.name || ''}" />
        </div>
        
        <div class="form-group">
          <label class="form-label">Brand</label>
          <input type="text" id="nutrition-brand" class="form-input" value="${this.extractedNutrition.brand || ''}" />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Serving Size</label>
            <input type="number" id="nutrition-serving-size" class="form-input" value="${this.extractedNutrition.serving_size || 1}" step="0.1" />
          </div>
          <div class="form-group">
            <label class="form-label">Unit</label>
            <input type="text" id="nutrition-serving-unit" class="form-input" value="${this.extractedNutrition.serving_unit || 'g'}" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Calories</label>
            <input type="number" id="nutrition-calories" class="form-input" value="${this.extractedNutrition.calories || 0}" />
          </div>
          <div class="form-group">
            <label class="form-label">Protein (g)</label>
            <input type="number" id="nutrition-protein" class="form-input" value="${this.extractedNutrition.protein || 0}" step="0.1" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Carbs (g)</label>
            <input type="number" id="nutrition-carbs" class="form-input" value="${this.extractedNutrition.carbs || 0}" step="0.1" />
          </div>
          <div class="form-group">
            <label class="form-label">Fat (g)</label>
            <input type="number" id="nutrition-fat" class="form-input" value="${this.extractedNutrition.fat || 0}" step="0.1" />
          </div>
        </div>
        
        <div class="form-actions mt-lg">
          <button class="btn btn-secondary" id="retake-btn">Retake</button>
          <button class="btn btn-primary" id="save-nutrition-btn">Save & Log</button>
        </div>
      </div>
    `
  }

  renderServingModal() {
    const food = this.selectedFood
    const totalCal = Math.round(food.calories * this.servings)
    const totalProtein = Math.round(food.protein * this.servings)
    
    return `
      <div class="serving-modal-overlay">
        <div class="serving-modal">
          <h3>${food.name}</h3>
          
          <div class="serving-info mt-md">
            <p class="text-secondary">Per serving: ${Math.round(food.calories)} cal · ${Math.round(food.protein)}g protein</p>
          </div>
          
          <div class="serving-controls mt-md">
            <label class="form-label">Servings</label>
            <div class="serving-buttons">
              <button class="btn btn-secondary" id="decrease-serving">−</button>
              <span class="serving-value">${this.servings}</span>
              <button class="btn btn-secondary" id="increase-serving">+</button>
            </div>
            <div class="quick-servings">
              <button class="btn btn-text" data-servings="0.5">0.5</button>
              <button class="btn btn-text" data-servings="1">1</button>
              <button class="btn btn-text" data-servings="1.5">1.5</button>
              <button class="btn btn-text" data-servings="2">2</button>
            </div>
          </div>
          
          <div class="serving-total mt-md">
            <p><strong>Total:</strong> ${totalCal} cal · ${totalProtein}g protein</p>
          </div>
          
          <div class="form-actions mt-lg">
            <button class="btn btn-secondary" id="cancel-serving">Cancel</button>
            <button class="btn btn-primary" id="log-food-btn">Log Food</button>
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
    if (!document.getElementById('add-food-styles')) {
      const style = document.createElement('style')
      style.id = 'add-food-styles'
      style.textContent = `
        .add-food-view {
          min-height: 100vh;
          background: var(--md-background);
        }
        .add-food-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--md-spacing-md);
          background: var(--md-surface);
          border-bottom: 1px solid var(--md-divider);
        }
        .add-food-header h2 {
          font-size: 1.25rem;
        }
        .add-food-tabs {
          display: flex;
          padding: var(--md-spacing-sm);
          gap: var(--md-spacing-sm);
          background: var(--md-surface);
        }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--md-spacing-sm);
          padding: var(--md-spacing-md);
          border: none;
          border-radius: var(--md-shape-medium);
          background: transparent;
          color: var(--md-text-secondary);
          cursor: pointer;
          transition: all var(--md-motion-duration-short) var(--md-motion-easing);
        }
        .tab-btn.active {
          background: var(--md-primary-container);
          color: var(--md-on-primary-container);
        }
        .add-food-options {
          display: flex;
          gap: var(--md-spacing-md);
          padding: var(--md-spacing-md);
          background: var(--md-surface);
          border-bottom: 1px solid var(--md-divider);
        }
        .option-group {
          flex: 1;
        }
        .option-group label {
          display: block;
          font-size: 0.75rem;
          color: var(--md-text-secondary);
          margin-bottom: var(--md-spacing-xs);
        }
        .add-food-content {
          padding: var(--md-spacing-md);
        }
        .search-input-wrapper {
          margin-bottom: var(--md-spacing-md);
        }
        .search-results {
          display: flex;
          flex-direction: column;
          gap: var(--md-spacing-sm);
        }
        .search-result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--md-spacing-md);
          background: var(--md-surface);
          border-radius: var(--md-shape-medium);
          box-shadow: var(--md-elevation-1);
          cursor: pointer;
          transition: background var(--md-motion-duration-short) var(--md-motion-easing);
        }
        .search-result-item:hover {
          background: var(--md-surface-variant);
        }
        .food-info .food-name {
          font-weight: 500;
        }
        .food-info .food-meta {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        .food-cal {
          font-weight: 500;
          color: var(--md-text-secondary);
        }
        .camera-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .camera-preview {
          width: 100%;
          max-width: 400px;
          aspect-ratio: 4/3;
          background: var(--md-surface-variant);
          border-radius: var(--md-shape-medium);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: var(--md-spacing-md);
        }
        .camera-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .camera-placeholder {
          text-align: center;
          color: var(--md-text-secondary);
          padding: var(--md-spacing-lg);
        }
        .camera-actions {
          display: flex;
          gap: var(--md-spacing-md);
        }
        .nutrition-form {
          max-width: 400px;
          margin: 0 auto;
        }
        .form-row {
          display: flex;
          gap: var(--md-spacing-md);
        }
        .form-row .form-group {
          flex: 1;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--md-spacing-sm);
        }
        .serving-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--md-spacing-md);
        }
        .serving-modal {
          background: var(--md-surface);
          border-radius: var(--md-shape-large);
          padding: var(--md-spacing-lg);
          width: 100%;
          max-width: 400px;
        }
        .serving-controls {
          text-align: center;
        }
        .serving-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-sm);
        }
        .serving-value {
          font-size: 1.5rem;
          font-weight: 500;
          min-width: 60px;
          text-align: center;
        }
        .quick-servings {
          display: flex;
          justify-content: center;
          gap: var(--md-spacing-xs);
        }
        .serving-total {
          text-align: center;
          padding: var(--md-spacing-md);
          background: var(--md-surface-variant);
          border-radius: var(--md-shape-small);
        }
      `
      document.head.appendChild(style)
    }
  }

  attachEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => router.back())
    }
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn')
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab
        this.error = null
        this.mount(document.getElementById('main-view'))
      })
    })
    
    // Meal time selection
    const mealTimeSelect = document.getElementById('meal-time')
    if (mealTimeSelect) {
      mealTimeSelect.addEventListener('change', (e) => {
        this.mealTime = e.target.value
      })
    }
    
    // Search input
    const searchInput = document.getElementById('food-search')
    if (searchInput) {
      let debounceTimer
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          this.handleSearch(e.target.value)
        }, 300)
      })
    }
    
    // Search results
    const resultItems = document.querySelectorAll('.search-result-item')
    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const foodId = item.dataset.foodId
        this.selectFood(foodId)
      })
    })
    
    // Create food button
    const createBtn = document.getElementById('create-food-btn')
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        router.navigate('/create-food')
      })
    }
    
    // Camera input
    const cameraInput = document.getElementById('camera-input')
    const galleryInput = document.getElementById('gallery-input')
    
    if (cameraInput) {
      cameraInput.addEventListener('change', (e) => this.handleImageCapture(e))
    }
    if (galleryInput) {
      galleryInput.addEventListener('change', (e) => this.handleImageCapture(e))
    }
    
    // Nutrition form
    const saveNutritionBtn = document.getElementById('save-nutrition-btn')
    const retakeBtn = document.getElementById('retake-btn')
    
    if (saveNutritionBtn) {
      saveNutritionBtn.addEventListener('click', () => this.saveNutritionFromForm())
    }
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.cameraImage = null
        this.extractedNutrition = null
        this.error = null
        this.mount(document.getElementById('main-view'))
      })
    }
    
    // Serving modal
    const decreaseBtn = document.getElementById('decrease-serving')
    const increaseBtn = document.getElementById('increase-serving')
    const cancelBtn = document.getElementById('cancel-serving')
    const logBtn = document.getElementById('log-food-btn')
    const quickBtns = document.querySelectorAll('.quick-servings button')
    
    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => {
        if (this.servings > 0.5) {
          this.servings = Math.round((this.servings - 0.5) * 10) / 10
          this.mount(document.getElementById('main-view'))
        }
      })
    }
    
    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => {
        this.servings = Math.round((this.servings + 0.5) * 10) / 10
        this.mount(document.getElementById('main-view'))
      })
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.selectedFood = null
        this.servings = 1
        this.mount(document.getElementById('main-view'))
      })
    }
    
    if (logBtn) {
      logBtn.addEventListener('click', () => this.logFood())
    }
    
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.servings = parseFloat(btn.dataset.servings)
        this.mount(document.getElementById('main-view'))
      })
    })
  }

  async handleSearch(term) {
    this.searchTerm = term
    
    if (!term.trim()) {
      this.searchResults = []
      this.mount(document.getElementById('main-view'))
      return
    }
    
    this.loading = true
    this.error = null
    this.mount(document.getElementById('main-view'))
    
    try {
      this.searchResults = await foodService.searchFoods(term)
    } catch (error) {
      this.error = 'Failed to search foods'
      console.error(error)
    } finally {
      this.loading = false
      this.mount(document.getElementById('main-view'))
    }
  }

  async selectFood(foodId) {
    const food = this.searchResults.find(f => f.id === foodId)
    if (food) {
      this.selectedFood = food
      this.servings = 1
      this.mount(document.getElementById('main-view'))
    }
  }

  async handleImageCapture(e) {
    const file = e.target.files[0]
    if (!file) return
    
    this.loading = true
    this.error = null
    
    // Show preview
    const reader = new FileReader()
    reader.onload = (event) => {
      this.cameraImage = event.target.result
      this.mount(document.getElementById('main-view'))
    }
    reader.readAsDataURL(file)
    
    try {
      // Compress and analyze
      const { base64, mimeType } = await aiService.compressImage(file)
      this.extractedNutrition = await aiService.scanNutritionLabel(base64, mimeType)
    } catch (error) {
      this.error = error.message || 'Failed to analyze image'
      console.error(error)
    } finally {
      this.loading = false
      this.mount(document.getElementById('main-view'))
    }
  }

  async saveNutritionFromForm() {
    const name = document.getElementById('nutrition-name').value
    const brand = document.getElementById('nutrition-brand').value
    const servingSize = parseFloat(document.getElementById('nutrition-serving-size').value)
    const servingUnit = document.getElementById('nutrition-serving-unit').value
    const calories = parseFloat(document.getElementById('nutrition-calories').value)
    const protein = parseFloat(document.getElementById('nutrition-protein').value)
    const carbs = parseFloat(document.getElementById('nutrition-carbs').value)
    const fat = parseFloat(document.getElementById('nutrition-fat').value)
    
    if (!name) {
      this.error = 'Name is required'
      this.mount(document.getElementById('main-view'))
      return
    }
    
    this.loading = true
    this.mount(document.getElementById('main-view'))
    
    try {
      // Create the food
      const food = await foodService.createFood({
        name,
        brand: brand || null,
        serving_size: servingSize,
        serving_unit: servingUnit,
        calories,
        protein,
        carbs,
        fat
      })
      
      // Log it
      await logService.createLog({
        food_id: food.id,
        date: store.getSelectedDateString(),
        meal_time: this.mealTime,
        servings_consumed: 1
      })
      
      // Navigate back
      router.navigate('/')
    } catch (error) {
      this.error = 'Failed to save food'
      console.error(error)
    } finally {
      this.loading = false
      this.mount(document.getElementById('main-view'))
    }
  }

  async logFood() {
    if (!this.selectedFood) return
    
    this.loading = true
    this.mount(document.getElementById('main-view'))
    
    try {
      await logService.createLog({
        food_id: this.selectedFood.id,
        date: store.getSelectedDateString(),
        meal_time: this.mealTime,
        servings_consumed: this.servings
      })
      
      // Navigate back to dashboard
      router.navigate('/')
    } catch (error) {
      this.error = 'Failed to log food'
      console.error(error)
      this.loading = false
      this.mount(document.getElementById('main-view'))
    }
  }
}

export default AddFood
