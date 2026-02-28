import { logService } from '../../services/logService.js'
import { foodService } from '../../services/foodService.js'
import { servingService } from '../../services/servingService.js'

/**
 * EditLogModal - Modal for editing food log entries
 */
class EditLogModal {
  constructor() {
    this.log = null
    this.food = null
    this.servings = []
    this.loading = false
    this.error = null
    this.showDeleteConfirm = false
    // Mode: 'log' | 'food' | 'servings'
    this.mode = 'log'
    this.formData = {
      servings_consumed: 1,
      food_serving_id: null,
      custom_serving_grams: null,
      meal_time: 'Breakfast',
      date: new Date().toISOString().split('T')[0],
      time_logged: null
    }
    // Food editing form data
    this.foodFormData = {
      name: '',
      brand: '',
      serving_size: 1,
      serving_unit: 'serving',
      serving_grams: null,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
    // Serving form for adding/editing
    this.servingFormData = {
      id: null,
      name: '',
      grams: 100,
      is_default: false
    }
    this.onSave = null
    this.onDelete = null
    this.onClose = null
  }

  /**
   * Open the modal with a specific log
   * @param {string} logId - Log ID to edit
   * @param {Function} onSave - Callback after save
   * @param {Function} onDelete - Callback after delete
   * @param {Function} onClose - Callback on close
   */
  async open(logId, onSave, onDelete, onClose) {
    this.onSave = onSave
    this.onDelete = onDelete
    this.onClose = onClose
    this.loading = true
    this.error = null
    this.showDeleteConfirm = false
    this.mode = 'log'
    this.render()

    try {
      // Fetch log data
      this.log = await logService.getLogById(logId)
      
      // Fetch available servings for this food
      this.servings = await servingService.getServingsForFood(this.log.food_id)
      
      // Load food data for editing
      this.food = this.log.foods
      this.initFoodFormData()
      
      // Initialize form data from log
      this.formData = {
        servings_consumed: this.log.servings_consumed || 1,
        food_serving_id: this.log.food_serving_id,
        custom_serving_grams: this.log.custom_serving_grams,
        meal_time: this.log.meal_time || 'Breakfast',
        date: this.log.date,
        time_logged: this.log.time_logged || this.getCurrentTime()
      }
      
      this.loading = false
      this.render()
    } catch (error) {
      console.error('Failed to load log:', error)
      this.error = 'Failed to load log entry'
      this.loading = false
      this.render()
    }
  }

  initFoodFormData() {
    if (this.food) {
      this.foodFormData = {
        name: this.food.name || '',
        brand: this.food.brand || '',
        serving_size: this.food.serving_size || 1,
        serving_unit: this.food.serving_unit || 'serving',
        serving_grams: this.food.serving_grams || null,
        calories: this.food.calories || 0,
        protein: this.food.protein || 0,
        carbs: this.food.carbs || 0,
        fat: this.food.fat || 0
      }
    }
  }

  getCurrentTime() {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  close() {
    this.log = null
    this.food = null
    this.servings = []
    this.mode = 'log'
    if (this.onClose) this.onClose()
    this.render()
  }

  setMode(mode) {
    this.mode = mode
    this.render()
  }

  render() {
    const container = document.getElementById('edit-log-modal-container')
    if (!container) return

    if (!this.log && !this.loading && !this.error) {
      container.innerHTML = ''
      return
    }

    container.innerHTML = this.renderContent()
    this.attachEventListeners()
  }

  renderContent() {
    if (this.loading) {
      return `
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="text-center p-lg">
              <div class="spinner"></div>
              <p class="text-secondary mt-md">Loading...</p>
            </div>
          </div>
        </div>
      `
    }

    if (this.error) {
      return `
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="text-center p-lg">
              <p class="text-error">${this.error}</p>
              <button class="btn btn-secondary mt-md" id="edit-modal-close">Close</button>
            </div>
          </div>
        </div>
      `
    }

    if (this.showDeleteConfirm) {
      return this.renderDeleteConfirm()
    }

    // Render based on mode
    if (this.mode === 'food') {
      return this.renderFoodEditForm()
    } else if (this.mode === 'servings') {
      return this.renderServingsManageForm()
    }
    
    return this.renderEditForm()
  }

  renderEditForm() {
    const food = this.log.foods
    const nutrition = logService.calculateNutrition({
      ...this.log,
      ...this.formData,
      food_servings: this.servings.find(s => s.id === this.formData.food_serving_id)
    })

    return `
      <div class="modal-overlay" id="edit-modal-overlay">
        <div class="modal-content edit-log-modal">
          <div class="modal-header">
            <h3>Edit Log</h3>
            <button class="btn btn-icon" id="edit-modal-close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Food Info -->
            <div class="food-info-card">
              <div class="food-info-name">${food?.name || 'Unknown food'}</div>
              <div class="food-info-meta">
                ${food?.brand ? `${food.brand} · ` : ''}
                ${nutrition.grams ? `${Math.round(nutrition.grams)}g` : `${food?.serving_size || 1} ${food?.serving_unit || 'serving'}`}
              </div>
              <div class="food-info-nutrition">
                ${nutrition.calories} cal · ${nutrition.protein}g protein
              </div>
            </div>
            
            <!-- Food Actions -->
            <div class="food-actions-row">
              <button class="btn btn-secondary btn-sm" id="edit-food-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Food
              </button>
              <button class="btn btn-secondary btn-sm" id="manage-servings-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                Servings
              </button>
            </div>
            
            <!-- Serving Size Selection -->
            <div class="form-section">
              <label class="form-label">Serving Size</label>
              ${this.servings.length > 0 ? `
                <select id="edit-serving-select" class="form-input">
                  <option value="">Default (${food?.serving_size || 1} ${food?.serving_unit || 'serving'})</option>
                  ${this.servings.map(s => `
                    <option value="${s.id}" ${this.formData.food_serving_id === s.id ? 'selected' : ''}>
                      ${s.name} (${s.grams}g)
                    </option>
                  `).join('')}
                </select>
              ` : `
                <div class="serving-size-inputs">
                  <input type="number" id="edit-custom-grams" class="form-input" 
                    placeholder="Grams" value="${this.formData.custom_serving_grams || ''}" 
                    step="0.1" min="0" style="width: 100px;" />
                  <span class="text-secondary">grams</span>
                </div>
              `}
            </div>
            
            <!-- Servings Consumed -->
            <div class="form-section">
              <label class="form-label">Servings</label>
              <div class="serving-controls">
                <button class="btn btn-secondary btn-sm" id="edit-decrease-serving">−</button>
                <span class="serving-value">${this.formData.servings_consumed}</span>
                <button class="btn btn-secondary btn-sm" id="edit-increase-serving">+</button>
              </div>
              <div class="quick-servings">
                <button class="btn btn-text btn-sm" data-servings="0.5">0.5</button>
                <button class="btn btn-text btn-sm" data-servings="1">1</button>
                <button class="btn btn-text btn-sm" data-servings="1.5">1.5</button>
                <button class="btn btn-text btn-sm" data-servings="2">2</button>
              </div>
            </div>
            
            <!-- Meal & Date -->
            <div class="form-row">
              <div class="form-section">
                <label class="form-label">Meal</label>
                <select id="edit-meal-time" class="form-input">
                  <option value="Breakfast" ${this.formData.meal_time === 'Breakfast' ? 'selected' : ''}>Breakfast</option>
                  <option value="Lunch" ${this.formData.meal_time === 'Lunch' ? 'selected' : ''}>Lunch</option>
                  <option value="Dinner" ${this.formData.meal_time === 'Dinner' ? 'selected' : ''}>Dinner</option>
                  <option value="Snack" ${this.formData.meal_time === 'Snack' ? 'selected' : ''}>Snack</option>
                </select>
              </div>
              <div class="form-section">
                <label class="form-label">Date</label>
                <input type="date" id="edit-date" class="form-input" value="${this.formData.date}" />
              </div>
            </div>
            
            <!-- Time -->
            <div class="form-section">
              <label class="form-label">Time</label>
              <input type="time" id="edit-time" class="form-input" value="${this.formData.time_logged || ''}" />
            </div>
            
            <!-- Total -->
            <div class="nutrition-total">
              <p><strong>Total:</strong> ${nutrition.calories} cal · ${nutrition.protein}g protein · ${nutrition.carbs}g carbs · ${nutrition.fat}g fat</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-danger" id="edit-delete-btn">Delete</button>
            <div class="footer-spacer"></div>
            <button class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
            <button class="btn btn-primary" id="edit-save-btn">Save</button>
          </div>
        </div>
      </div>
    `
  }

  renderDeleteConfirm() {
    const food = this.log.foods
    return `
      <div class="modal-overlay">
        <div class="modal-content delete-confirm-modal">
          <div class="delete-confirm-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--md-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
          <h3>Delete Log Entry?</h3>
          <p class="text-secondary">Are you sure you want to delete "${food?.name || 'this food'}" from your food log?</p>
          <p class="text-secondary text-sm">This action cannot be undone.</p>
          <div class="delete-confirm-actions">
            <button class="btn btn-secondary" id="delete-cancel">Cancel</button>
            <button class="btn btn-danger" id="delete-confirm">Delete</button>
          </div>
        </div>
      </div>
    `
  }

  attachEventListeners() {
    // Close button - handle all modes
    const closeBtn = document.getElementById('edit-modal-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close())
    }

    // Overlay click to close - handle all modes
    const overlay = document.getElementById('edit-modal-overlay')
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close()
      })
    }

    // Cancel button (for log edit mode)
    const cancelBtn = document.getElementById('edit-cancel-btn')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close())
    }

    // Edit Food button
    const editFoodBtn = document.getElementById('edit-food-btn')
    if (editFoodBtn) {
      editFoodBtn.addEventListener('click', () => {
        this.initFoodFormData()
        this.setMode('food')
      })
    }

    // Manage Servings button
    const manageServingsBtn = document.getElementById('manage-servings-btn')
    if (manageServingsBtn) {
      manageServingsBtn.addEventListener('click', () => {
        this.setMode('servings')
      })
    }

    // Food Edit Form listeners
    this.attachFoodEditListeners()
    
    // Servings Management listeners
    this.attachServingsListeners()

    // Serving select
    const servingSelect = document.getElementById('edit-serving-select')
    if (servingSelect) {
      servingSelect.addEventListener('change', (e) => {
        this.formData.food_serving_id = e.target.value || null
        this.render()
      })
    }

    // Custom grams input
    const customGramsInput = document.getElementById('edit-custom-grams')
    if (customGramsInput) {
      customGramsInput.addEventListener('input', (e) => {
        this.formData.custom_serving_grams = parseFloat(e.target.value) || null
        this.render()
      })
    }

    // Serving controls
    const decreaseBtn = document.getElementById('edit-decrease-serving')
    const increaseBtn = document.getElementById('edit-increase-serving')
    
    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => {
        if (this.formData.servings_consumed > 0.5) {
          this.formData.servings_consumed = Math.round((this.formData.servings_consumed - 0.5) * 10) / 10
          this.render()
        }
      })
    }
    
    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => {
        this.formData.servings_consumed = Math.round((this.formData.servings_consumed + 0.5) * 10) / 10
        this.render()
      })
    }

    // Quick servings
    const quickBtns = document.querySelectorAll('.quick-servings button')
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.formData.servings_consumed = parseFloat(btn.dataset.servings)
        this.render()
      })
    })

    // Meal time
    const mealTimeSelect = document.getElementById('edit-meal-time')
    if (mealTimeSelect) {
      mealTimeSelect.addEventListener('change', (e) => {
        this.formData.meal_time = e.target.value
      })
    }

    // Date
    const dateInput = document.getElementById('edit-date')
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.formData.date = e.target.value
      })
    }

    // Time
    const timeInput = document.getElementById('edit-time')
    if (timeInput) {
      timeInput.addEventListener('change', (e) => {
        this.formData.time_logged = e.target.value
      })
    }

    // Delete button
    const deleteBtn = document.getElementById('edit-delete-btn')
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.showDeleteConfirm = true
        this.render()
      })
    }

    // Delete confirmation
    const deleteCancelBtn = document.getElementById('delete-cancel')
    const deleteConfirmBtn = document.getElementById('delete-confirm')
    
    if (deleteCancelBtn) {
      deleteCancelBtn.addEventListener('click', () => {
        this.showDeleteConfirm = false
        this.render()
      })
    }
    
    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener('click', () => this.handleDelete())
    }

    // Save button
    const saveBtn = document.getElementById('edit-save-btn')
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave())
    }
  }

  async handleSave() {
    this.loading = true
    this.render()

    try {
      const updates = {
        servings_consumed: this.formData.servings_consumed,
        meal_time: this.formData.meal_time,
        date: this.formData.date,
        time_logged: this.formData.time_logged || null
      }

      // Add serving info
      if (this.formData.food_serving_id) {
        updates.food_serving_id = this.formData.food_serving_id
        updates.custom_serving_grams = null
      } else if (this.formData.custom_serving_grams) {
        updates.custom_serving_grams = this.formData.custom_serving_grams
        updates.food_serving_id = null
      }

      await logService.updateLog(this.log.id, updates)
      
      if (this.onSave) this.onSave()
      this.close()
    } catch (error) {
      console.error('Failed to save log:', error)
      this.error = 'Failed to save changes'
      this.loading = false
      this.render()
    }
  }

  // ===== Food Edit Methods =====

  attachFoodEditListeners() {
    // Back button in food edit mode
    const backBtn = document.getElementById('food-edit-back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.setMode('log')
      })
    }

    // Food form inputs
    const foodNameInput = document.getElementById('food-name')
    if (foodNameInput) {
      foodNameInput.addEventListener('input', (e) => {
        this.foodFormData.name = e.target.value
      })
    }

    const foodBrandInput = document.getElementById('food-brand')
    if (foodBrandInput) {
      foodBrandInput.addEventListener('input', (e) => {
        this.foodFormData.brand = e.target.value
      })
    }

    const servingSizeInput = document.getElementById('food-serving-size')
    if (servingSizeInput) {
      servingSizeInput.addEventListener('input', (e) => {
        this.foodFormData.serving_size = parseFloat(e.target.value) || 1
      })
    }

    const servingUnitInput = document.getElementById('food-serving-unit')
    if (servingUnitInput) {
      servingUnitInput.addEventListener('input', (e) => {
        this.foodFormData.serving_unit = e.target.value
      })
    }

    const servingGramsInput = document.getElementById('food-serving-grams')
    if (servingGramsInput) {
      servingGramsInput.addEventListener('input', (e) => {
        this.foodFormData.serving_grams = parseFloat(e.target.value) || null
      })
    }

    const caloriesInput = document.getElementById('food-calories')
    if (caloriesInput) {
      caloriesInput.addEventListener('input', (e) => {
        this.foodFormData.calories = parseFloat(e.target.value) || 0
      })
    }

    const proteinInput = document.getElementById('food-protein')
    if (proteinInput) {
      proteinInput.addEventListener('input', (e) => {
        this.foodFormData.protein = parseFloat(e.target.value) || 0
      })
    }

    const carbsInput = document.getElementById('food-carbs')
    if (carbsInput) {
      carbsInput.addEventListener('input', (e) => {
        this.foodFormData.carbs = parseFloat(e.target.value) || 0
      })
    }

    const fatInput = document.getElementById('food-fat')
    if (fatInput) {
      fatInput.addEventListener('input', (e) => {
        this.foodFormData.fat = parseFloat(e.target.value) || 0
      })
    }

    // Save food button
    const saveFoodBtn = document.getElementById('save-food-btn')
    if (saveFoodBtn) {
      saveFoodBtn.addEventListener('click', () => this.handleSaveFood())
    }

    // Cancel food edit button
    const cancelFoodBtn = document.getElementById('edit-modal-cancel-food')
    if (cancelFoodBtn) {
      cancelFoodBtn.addEventListener('click', () => {
        this.setMode('log')
      })
    }
  }

  async handleSaveFood() {
    if (!this.foodFormData.name) {
      this.error = 'Food name is required'
      this.render()
      return
    }

    // Ensure we have a valid food ID
    const foodId = this.food?.id || this.log?.foods?.id
    if (!foodId) {
      this.error = 'Food ID not found'
      this.render()
      return
    }

    this.loading = true
    this.render()

    try {
      await foodService.updateFood(foodId, {
        name: this.foodFormData.name,
        brand: this.foodFormData.brand || null,
        serving_size: this.foodFormData.serving_size,
        serving_unit: this.foodFormData.serving_unit,
        serving_grams: this.foodFormData.serving_grams,
        calories: this.foodFormData.calories,
        protein: this.foodFormData.protein,
        carbs: this.foodFormData.carbs,
        fat: this.foodFormData.fat
      })

      // Refresh the log to get updated food data
      this.log = await logService.getLogById(this.log.id)
      this.food = this.log.foods
      
      this.setMode('log')
      if (this.onSave) this.onSave()
    } catch (error) {
      console.error('Failed to save food:', error)
      this.error = 'Failed to save food'
      this.loading = false
      this.render()
    }
  }

  renderFoodEditForm() {
    return `
      <div class="modal-overlay" id="edit-modal-overlay">
        <div class="modal-content edit-log-modal">
          <div class="modal-header">
            <button class="back-btn" id="food-edit-back-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h3>Edit Food</h3>
            <button class="btn btn-icon" id="edit-modal-close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="food-edit-section">
              <h4>Basic Info</h4>
              <div class="form-group">
                <label class="form-label">Name *</label>
                <input type="text" id="food-name" class="form-input" value="${this.foodFormData.name || ''}" />
              </div>
              
              <div class="form-group">
                <label class="form-label">Brand</label>
                <input type="text" id="food-brand" class="form-input" value="${this.foodFormData.brand || ''}" />
              </div>
            </div>
            
            <div class="food-edit-section">
              <h4>Serving Size</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Size</label>
                  <input type="number" id="food-serving-size" class="form-input" value="${this.foodFormData.serving_size || 1}" step="0.1" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Unit</label>
                  <input type="text" id="food-serving-unit" class="form-input" value="${this.foodFormData.serving_unit || 'serving'}" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Grams (optional)</label>
                <input type="number" id="food-serving-grams" class="form-input" value="${this.foodFormData.serving_grams || ''}" step="0.1" min="0" placeholder="e.g., 240 for 1 cup" />
              </div>
            </div>
            
            <div class="food-edit-section">
              <h4>Nutrition per Serving</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Calories</label>
                  <input type="number" id="food-calories" class="form-input" value="${this.foodFormData.calories || 0}" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Protein (g)</label>
                  <input type="number" id="food-protein" class="form-input" value="${this.foodFormData.protein || 0}" step="0.1" min="0" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Carbs (g)</label>
                  <input type="number" id="food-carbs" class="form-input" value="${this.foodFormData.carbs || 0}" step="0.1" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fat (g)</label>
                  <input type="number" id="food-fat" class="form-input" value="${this.foodFormData.fat || 0}" step="0.1" min="0" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" id="edit-modal-cancel-food">Cancel</button>
            <button class="btn btn-primary" id="save-food-btn">Save Food</button>
          </div>
        </div>
      </div>
    `
  }

  // ===== Servings Management Methods =====

  attachServingsListeners() {
    // Back button in servings mode
    const backBtn = document.getElementById('servings-back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.setMode('log')
      })
    }

    // Add serving button
    const addServingBtn = document.getElementById('add-serving-btn')
    if (addServingBtn) {
      addServingBtn.addEventListener('click', () => {
        this.servingFormData = { id: null, name: '', grams: 100, is_default: false }
        this.render()
      })
    }

    // Cancel add serving
    const cancelAddBtn = document.getElementById('cancel-add-serving')
    if (cancelAddBtn) {
      cancelAddBtn.addEventListener('click', () => {
        this.servingFormData = { id: null, name: '', grams: 100, is_default: false }
        this.render()
      })
    }

    // Save serving
    const saveServingBtn = document.getElementById('save-serving-btn')
    if (saveServingBtn) {
      saveServingBtn.addEventListener('click', () => this.handleSaveServing())
    }

    // Serving form inputs
    const servingNameInput = document.getElementById('serving-name')
    if (servingNameInput) {
      servingNameInput.addEventListener('input', (e) => {
        this.servingFormData.name = e.target.value
      })
    }

    const servingGramsInput = document.getElementById('serving-grams')
    if (servingGramsInput) {
      servingGramsInput.addEventListener('input', (e) => {
        this.servingFormData.grams = parseFloat(e.target.value) || 100
      })
    }

    // Event delegation for serving actions (edit, delete, set default)
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.edit-serving-btn')) {
        const btn = e.target.closest('.edit-serving-btn')
        const servingId = btn.dataset.servingId
        const serving = this.servings.find(s => s.id === servingId)
        if (serving) {
          this.servingFormData = {
            id: serving.id,
            name: serving.name,
            grams: serving.grams,
            is_default: serving.is_default
          }
          this.render()
        }
      }

      if (e.target.closest('.delete-serving-btn')) {
        const btn = e.target.closest('.delete-serving-btn')
        const servingId = btn.dataset.servingId
        if (confirm('Delete this serving size?')) {
          await this.handleDeleteServing(servingId)
        }
      }

      if (e.target.closest('.set-default-btn')) {
        const btn = e.target.closest('.set-default-btn')
        const servingId = btn.dataset.servingId
        await this.handleSetDefaultServing(servingId)
      }
    })
  }

  async handleSaveServing() {
    if (!this.servingFormData.name) {
      this.error = 'Serving name is required'
      this.render()
      return
    }

    // Ensure we have a valid food ID
    const foodId = this.food?.id || this.log?.foods?.id
    if (!foodId) {
      this.error = 'Food ID not found'
      this.render()
      return
    }

    this.loading = true
    this.render()

    try {
      if (this.servingFormData.id) {
        // Update existing serving
        await servingService.updateServing(this.servingFormData.id, {
          name: this.servingFormData.name,
          grams: this.servingFormData.grams,
          is_default: this.servingFormData.is_default
        })
      } else {
        // Create new serving
        await servingService.createServing({
          food_id: foodId,
          name: this.servingFormData.name,
          grams: this.servingFormData.grams,
          is_default: this.servingFormData.is_default
        })
      }

      // Refresh servings list
      this.servings = await servingService.getServingsForFood(foodId)
      this.servingFormData = { id: null, name: '', grams: 100, is_default: false }
      
      // Refresh the log to get updated serving data
      this.log = await logService.getLogById(this.log.id)
      
      if (this.onSave) this.onSave()
    } catch (error) {
      console.error('Failed to save serving:', error)
      this.error = 'Failed to save serving'
      this.loading = false
      this.render()
    }
  }

  async handleDeleteServing(servingId) {
    this.loading = true
    this.render()

    try {
      await servingService.deleteServing(servingId)
      
      // Ensure we have a valid food ID
      const foodId = this.food?.id || this.log?.foods?.id
      this.servings = await servingService.getServingsForFood(foodId)
      
      // Refresh the log
      this.log = await logService.getLogById(this.log.id)
      
      if (this.onSave) this.onSave()
    } catch (error) {
      console.error('Failed to delete serving:', error)
      this.error = 'Failed to delete serving'
      this.loading = false
      this.render()
    }
  }

  async handleSetDefaultServing(servingId) {
    this.loading = true
    this.render()

    try {
      // Ensure we have a valid food ID
      const foodId = this.food?.id || this.log?.foods?.id
      await servingService.setDefaultServing(foodId, servingId)
      this.servings = await servingService.getServingsForFood(foodId)
      
      // Refresh the log
      this.log = await logService.getLogById(this.log.id)
      
      if (this.onSave) this.onSave()
    } catch (error) {
      console.error('Failed to set default serving:', error)
      this.error = 'Failed to set default serving'
      this.loading = false
      this.render()
    }
  }

  renderServingsManageForm() {
    const isAdding = !this.servingFormData.id
    
    return `
      <div class="modal-overlay" id="edit-modal-overlay">
        <div class="modal-content edit-log-modal">
          <div class="modal-header">
            <button class="back-btn" id="servings-back-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h3>Manage Servings</h3>
            <button class="btn btn-icon" id="edit-modal-close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <p class="text-secondary mb-md">Add or edit predefined serving sizes for this food.</p>
            
            <!-- Existing Servings List -->
            ${this.servings.length > 0 ? `
              <div class="serving-list">
                ${this.servings.map(s => `
                  <div class="serving-item">
                    <div class="serving-item-info">
                      <div class="serving-item-name">
                        ${s.name}
                        ${s.is_default ? '<span class="default-badge">Default</span>' : ''}
                      </div>
                      <div class="serving-item-grams">${s.grams}g</div>
                    </div>
                    <div class="serving-item-actions">
                      ${!s.is_default ? `
                        <button class="set-default-btn" data-serving-id="${s.id}" title="Set as default">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                      ` : ''}
                      <button class="edit-serving-btn" data-serving-id="${s.id}" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="delete-serving-btn" data-serving-id="${s.id}" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-secondary text-center p-md">No custom servings yet.</p>
            `}
            
            <!-- Add/Edit Serving Form -->
            <div class="add-serving-form">
              <h4>${isAdding ? 'Add New Serving' : 'Edit Serving'}</h4>
              <div class="form-row">
                <input type="text" id="serving-name" class="form-input" placeholder="Name (e.g., cup, piece)" value="${this.servingFormData.name || ''}" />
                <input type="number" id="serving-grams" class="form-input" placeholder="Grams" value="${this.servingFormData.grams || 100}" step="0.1" min="0" style="max-width: 100px;" />
              </div>
              <div class="add-serving-form-actions">
                ${!isAdding ? `
                  <button class="btn btn-secondary" id="cancel-add-serving">Cancel</button>
                ` : ''}
                <button class="btn btn-primary" id="save-serving-btn">${isAdding ? 'Add' : 'Update'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  async handleDelete() {
    this.loading = true
    this.render()

    try {
      await logService.deleteLog(this.log.id)
      
      if (this.onDelete) this.onDelete()
      this.close()
    } catch (error) {
      console.error('Failed to delete log:', error)
      this.error = 'Failed to delete log entry'
      this.loading = false
      this.showDeleteConfirm = false
      this.render()
    }
  }

  addStyles() {
    if (!document.getElementById('edit-log-modal-styles')) {
      const style = document.createElement('style')
      style.id = 'edit-log-modal-styles'
      style.textContent = `
        .modal-overlay {
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
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background: var(--md-surface);
          border-radius: var(--md-shape-large);
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--md-spacing-md) var(--md-spacing-lg);
          border-bottom: 1px solid var(--md-divider);
        }
        
        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 500;
        }
        
        .modal-body {
          padding: var(--md-spacing-lg);
        }
        
        .modal-footer {
          display: flex;
          align-items: center;
          padding: var(--md-spacing-md) var(--md-spacing-lg);
          border-top: 1px solid var(--md-divider);
          gap: var(--md-spacing-sm);
        }
        
        .footer-spacer {
          flex: 1;
        }
        
        .food-info-card {
          background: var(--md-surface-variant);
          border-radius: var(--md-shape-medium);
          padding: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-lg);
        }
        
        .food-info-name {
          font-weight: 500;
          font-size: 1.1rem;
          margin-bottom: 4px;
        }
        
        .food-info-meta {
          font-size: 0.875rem;
          color: var(--md-text-secondary);
          margin-bottom: 4px;
        }
        
        .food-info-nutrition {
          font-size: 0.875rem;
          color: var(--md-primary);
        }
        
        .form-section {
          margin-bottom: var(--md-spacing-md);
        }
        
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--md-text-secondary);
          margin-bottom: var(--md-spacing-xs);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .form-row {
          display: flex;
          gap: var(--md-spacing-md);
        }
        
        .form-row .form-section {
          flex: 1;
        }
        
        .serving-controls {
          display: flex;
          align-items: center;
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
          gap: var(--md-spacing-xs);
        }
        
        .serving-size-inputs {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
        }
        
        .nutrition-total {
          background: var(--md-primary-container);
          color: var(--md-on-primary-container);
          padding: var(--md-spacing-md);
          border-radius: var(--md-shape-small);
          text-align: center;
          margin-top: var(--md-spacing-md);
        }
        
        .delete-confirm-modal {
          text-align: center;
          padding: var(--md-spacing-xl);
        }
        
        .delete-confirm-icon {
          margin-bottom: var(--md-spacing-md);
        }
        
        .delete-confirm-modal h3 {
          margin-bottom: var(--md-spacing-sm);
        }
        
        .delete-confirm-modal p {
          margin-bottom: var(--md-spacing-sm);
        }
        
        .delete-confirm-actions {
          display: flex;
          justify-content: center;
          gap: var(--md-spacing-md);
          margin-top: var(--md-spacing-lg);
        }
        
        .text-sm {
          font-size: 0.75rem;
        }
        
        .btn-danger {
          background: var(--md-error);
          color: var(--md-on-error);
        }
        
        .btn-danger:hover {
          background: var(--md-error-container);
          color: var(--md-on-error-container);
        }
        
        .btn-sm {
          padding: 6px 12px;
          font-size: 0.875rem;
        }
        
        .btn-icon {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
        }
        
        .btn-icon:hover {
          color: var(--md-on-surface);
        }
        
        .food-actions-row {
          display: flex;
          gap: var(--md-spacing-sm);
          margin-bottom: var(--md-spacing-lg);
        }
        
        .food-actions-row .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--md-spacing-xs);
        }
        
        .food-actions-row .btn svg {
          flex-shrink: 0;
        }
        
        /* Food Edit Form Styles */
        .food-edit-section {
          margin-bottom: var(--md-spacing-lg);
        }
        
        .food-edit-section h4 {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: var(--md-spacing-md);
          color: var(--md-on-surface);
        }
        
        .serving-list {
          margin-top: var(--md-spacing-md);
        }
        
        .serving-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--md-spacing-sm) var(--md-spacing-md);
          background: var(--md-surface-variant);
          border-radius: var(--md-shape-small);
          margin-bottom: var(--md-spacing-xs);
        }
        
        .serving-item-info {
          flex: 1;
        }
        
        .serving-item-name {
          font-weight: 500;
        }
        
        .serving-item-grams {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        
        .serving-item-actions {
          display: flex;
          gap: var(--md-spacing-xs);
        }
        
        .serving-item-actions button {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          border-radius: var(--md-shape-small);
        }
        
        .serving-item-actions button:hover {
          background: var(--md-surface);
          color: var(--md-on-surface);
        }
        
        .default-badge {
          font-size: 0.625rem;
          background: var(--md-primary);
          color: var(--md-on-primary);
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: var(--md-spacing-xs);
        }
        
        .add-serving-form {
          margin-top: var(--md-spacing-md);
          padding: var(--md-spacing-md);
          background: var(--md-surface-variant);
          border-radius: var(--md-shape-medium);
        }
        
        .add-serving-form .form-row {
          display: flex;
          gap: var(--md-spacing-sm);
          margin-bottom: var(--md-spacing-sm);
        }
        
        .add-serving-form .form-row input {
          flex: 1;
        }
        
        .add-serving-form-actions {
          display: flex;
          gap: var(--md-spacing-sm);
          justify-content: flex-end;
        }
        
        .modal-header-with-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .modal-header-with-actions h3 {
          flex: 1;
        }
        
        .back-btn {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-xs);
          padding: var(--md-spacing-xs) var(--md-spacing-sm);
          background: transparent;
          border: none;
          color: var(--md-primary);
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .back-btn:hover {
          background: var(--md-surface-variant);
          border-radius: var(--md-shape-small);
        }
        
        .form-group {
          margin-bottom: var(--md-spacing-md);
        }
        
        .form-group .form-input {
          width: 100%;
        }
        
        .mb-md {
          margin-bottom: var(--md-spacing-md);
        }
        
        .p-md {
          padding: var(--md-spacing-md);
        }
      `
      document.head.appendChild(style)
    }
  }

  mount(container) {
    container.innerHTML = '<div id="edit-log-modal-container"></div>'
    this.addStyles()
  }
}

export default EditLogModal
