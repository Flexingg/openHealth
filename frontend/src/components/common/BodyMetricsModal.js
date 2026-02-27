import { store } from '../../state/store.js';
import BodyMeasurementsService from '../../services/bodyMeasurementsService.js';
import { validateBodyMeasurements } from '../../utils/validation/bodyMeasurementsValidation.js';
import { convertWeight } from '../../utils/unitConversion/weight.js';
import { convertHeight } from '../../utils/unitConversion/height.js';

/**
 * Body Metrics Modal component for entering body measurements
 */
class BodyMetricsModal {
  constructor(onLogAdded) {
    this.isOpen = false;
    this.onLogAdded = onLogAdded;
    this.measurements = [];
    this.boundHandlers = {};
  }

  async fetchData() {
    const date = store.getSelectedDateString();
    try {
      const data = await BodyMeasurementsService.getByDateRange(
        store.getState().user.id,
        date,
        date
      );
      this.measurements = data || [];
    } catch (error) {
      console.error('Failed to fetch body measurements:', error);
      this.measurements = [];
    }
  }

  render() {
    const userSettings = store.getState().userSettings;
    const weightUnit = userSettings.weightUnit || 'lbs';
    const heightUnit = userSettings.heightUnit || 'ft';

    return `
      <div class="body-metrics-modal-overlay" id="body-metrics-modal-overlay"></div>
      <div class="body-metrics-modal" id="body-metrics-modal">
        <div class="body-metrics-modal-header">
          <div class="body-metrics-modal-title">
            <span class="body-metrics-modal-icon">📏</span>
            <span>Body Metrics</span>
          </div>
          <button class="body-metrics-modal-close" id="body-metrics-modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="body-metrics-modal-content">
          <form id="body-metrics-form">
            <div class="body-metrics-form-group">
              <label for="measurement-date">Date</label>
              <input type="date" id="measurement-date" value="${store.getSelectedDateString()}" required />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="height-cm">Height (${heightUnit})</label>
              <input type="number" id="height-cm" step="0.1" placeholder="Enter height" />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="weight-kg">Weight (${weightUnit}) ${'*'}</label>
              <input type="number" id="weight-kg" step="0.1" placeholder="Enter weight" required />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="body-fat-percent">Body Fat (%)</label>
              <input type="number" id="body-fat-percent" step="0.1" min="0" max="100" placeholder="Enter body fat %" />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="bone-mass-kg">Bone Mass (kg)</label>
              <input type="number" id="bone-mass-kg" step="0.1" placeholder="Enter bone mass" />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="lean-body-mass-kg">Lean Body Mass (kg)</label>
              <input type="number" id="lean-body-mass-kg" step="0.1" placeholder mass" />
           ="Enter lean body </div>
            
            <div class="body-metrics-form-group">
              <label for="body-water-percent">Body Water (%)</label>
              <input type="number" id="body-water-percent" step="0.1" min="0" max="100" placeholder="Enter body water %" />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="bmr-kcal">Basal Metabolic Rate (kcal)</label>
              <input type="number" id="bmr-kcal" placeholder="Enter BMR" />
            </div>
            
            <div class="body-metrics-form-group">
              <label for="body-metrics-notes">Notes</label>
              <textarea id="body-metrics-notes" placeholder="Add notes..."></textarea>
            </div>
            
            <div class="body-metrics-form-error" id="body-metrics-form-error"></div>
            
            <button type="submit" class="body-metrics-submit">Save Measurement</button>
          </form>
          
          <div class="body-metrics-recent">
            <h3>Recent Measurements</h3>
            <div class="body-metrics-list" id="body-metrics-list">
              ${this.renderMeasurementsList()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderMeasurementsList() {
    if (this.measurements.length === 0) {
      return `<div class="body-metrics-empty">No measurements recorded today</div>`;
    }

    const userSettings = store.getState().userSettings;
    const weightUnit = userSettings.weightUnit || 'lbs';

    return this.measurements.map(m => {
      const weight = weightUnit === 'lbs' ? convertWeight(m.weight_kg, 'kg', 'lbs') : m.weight_kg;
      const displayWeight = weight ? weight.toFixed(1) : '-';
      
      return `
        <div class="body-metrics-item" data-measurement-id="${m.id}">
          <div class="body-metrics-info">
            <span class="body-metrics-weight">${displayWeight} ${weightUnit}</span>
            <span class="body-metrics-date">${m.measurement_date}</span>
            ${m.bmi ? `<span class="body-metrics-bmi">BMI: ${m.bmi}</span>` : ''}
          </div>
          <button class="body-metrics-delete" data-delete-id="${m.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  mount(container) {
    container.innerHTML = this.render();
  }

  attachEventListeners() {
    const overlay = document.getElementById('body-metrics-modal-overlay');
    const closeBtn = document.getElementById('body-metrics-modal-close');
    const form = document.getElementById('body-metrics-form');

    if (overlay) {
      const newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      newOverlay.addEventListener('click', () => this.close());
    }

    if (closeBtn) {
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      newCloseBtn.addEventListener('click', () => this.close());
    }

    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    this.attachDeleteListeners();
  }

  attachDeleteListeners() {
    const deleteBtns = document.querySelectorAll('.body-metrics-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        await this.handleDelete(id);
      });
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const userSettings = store.getState().userSettings;
    const weightUnit = userSettings.weightUnit || 'lbs';
    const heightUnit = userSettings.heightUnit || 'ft';
    
    const weightInput = document.getElementById('weight-kg').value;
    const heightInput = document.getElementById('height-cm').value;
    
    if (!weightInput) {
      this.showError('Weight is required');
      return;
    }
    
    // Convert to metric if needed
    let weightKg = parseFloat(weightInput);
    if (weightUnit === 'lbs') {
      weightKg = weightKg / 2.20462;
    }
    
    let heightCm = null;
    if (heightInput) {
      heightCm = parseFloat(heightInput);
      if (heightUnit === 'ft') {
        heightCm = heightCm * 30.48;
      }
    }
    
    const measurementData = {
      measurement_date: document.getElementById('measurement-date').value,
      weight_kg: weightKg,
      height_cm: heightCm,
      body_fat_percent: parseFloat(document.getElementById('body-fat-percent').value) || null,
      bone_mass_kg: parseFloat(document.getElementById('bone-mass-kg').value) || null,
      lean_body_mass_kg: parseFloat(document.getElementById('lean-body-mass-kg').value) || null,
      body_water_percent: parseFloat(document.getElementById('body-water-percent').value) || null,
      basal_metabolic_rate_kcal: parseFloat(document.getElementById('bmr-kcal').value) || null,
      notes: document.getElementById('body-metrics-notes').value || null
    };
    
    // Validate
    const errors = validateBodyMeasurements(measurementData);
    if (errors.length > 0) {
      this.showError(errors.join(', '));
      return;
    }
    
    try {
      const user = store.getState().user;
      await BodyMeasurementsService.create({
        ...measurementData,
        user_id: user.id
      });
      
      await this.fetchData();
      this.updateModal();
      
      if (this.onLogAdded) {
        this.onLogAdded();
      }
      
      this.close();
    } catch (error) {
      console.error('Failed to save measurement:', error);
      this.showError('Failed to save measurement. Please try again.');
    }
  }

  async handleDelete(id) {
    try {
      await BodyMeasurementsService.delete(id);
      await this.fetchData();
      this.updateModal();
      
      if (this.onLogAdded) {
        this.onLogAdded();
      }
    } catch (error) {
      console.error('Failed to delete measurement:', error);
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('body-metrics-form-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }

  updateModal() {
    const modal = document.getElementById('body-metrics-modal');
    
    if (modal) {
      const list = document.getElementById('body-metrics-list');
      if (list) {
        list.innerHTML = this.renderMeasurementsList();
        this.attachDeleteListeners();
      }
    }
  }

  async open() {
    await this.fetchData();
    this.isOpen = true;
    
    const container = document.getElementById('body-metrics-modal-container');
    if (container) {
      container.innerHTML = this.render();
    }
    
    const modal = document.getElementById('body-metrics-modal');
    const overlay = document.getElementById('body-metrics-modal-overlay');
    
    if (modal) {
      modal.classList.add('open');
    }
    if (overlay) {
      overlay.classList.add('open');
    }
    
    this.attachEventListeners();
  }

  close() {
    this.isOpen = false;
    
    const modal = document.getElementById('body-metrics-modal');
    const overlay = document.getElementById('body-metrics-modal-overlay');
    
    if (modal) {
      modal.classList.remove('open');
    }
    if (overlay) {
      overlay.classList.remove('open');
    }
  }

  addStyles() {
    if (!document.getElementById('body-metrics-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'body-metrics-modal-styles';
      style.textContent = `
        .body-metrics-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 200;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .body-metrics-modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .body-metrics-modal {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--md-surface);
          border-radius: 24px 24px 0 0;
          z-index: 201;
          max-height: 85vh;
          overflow-y: auto;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        .body-metrics-modal.open {
          transform: translateY(0);
        }
        .body-metrics-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--md-divider);
          position: sticky;
          top: 0;
          background: var(--md-surface);
          z-index: 1;
        }
        .body-metrics-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.125rem;
          font-weight: 700;
        }
        .body-metrics-modal-icon {
          font-size: 1.25rem;
        }
        .body-metrics-modal-close {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: background 0.2s ease;
        }
        .body-metrics-modal-close:hover {
          background: var(--md-surface-variant);
        }
        .body-metrics-modal-content {
          padding: 16px 20px;
        }
        .body-metrics-form-group {
          margin-bottom: 16px;
        }
        .body-metrics-form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--md-text-secondary);
          margin-bottom: 4px;
        }
        .body-metrics-form-group input,
        .body-metrics-form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--md-outline);
          border-radius: 12px;
          background: var(--md-surface-variant);
          color: var(--md-on-surface);
          font-size: 1rem;
        }
        .body-metrics-form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        .body-metrics-form-error {
          color: var(--md-error);
          font-size: 0.875rem;
          margin-bottom: 16px;
          display: none;
        }
        .body-metrics-submit {
          width: 100%;
          padding: 14px;
          background: var(--md-primary);
          color: var(--md-on-primary);
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .body-metrics-submit:hover {
          transform: scale(1.02);
        }
        .body-metrics-submit:active {
          transform: scale(0.98);
        }
        .body-metrics-recent {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--md-divider);
        }
        .body-metrics-recent h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .body-metrics-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .body-metrics-empty {
          text-align: center;
          color: var(--md-text-secondary);
          padding: 24px;
          font-size: 0.875rem;
        }
        .body-metrics-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--md-surface-variant);
          border-radius: 12px;
        }
        .body-metrics-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .body-metrics-weight {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .body-metrics-date {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
        .body-metrics-bmi {
          font-size: 0.75rem;
          color: var(--md-primary);
        }
        .body-metrics-delete {
          background: transparent;
          border: none;
          color: var(--md-text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .body-metrics-delete:hover {
          background: var(--md-error-container);
          color: var(--md-on-error-container);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export default BodyMetricsModal;
