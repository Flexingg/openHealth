import { store } from '../state/store.js';
import BodyMeasurementsService from '../services/bodyMeasurementsService.js';
import SleepService from '../services/sleepService.js';
import MindfulnessService from '../services/mindfulnessService.js';
import VitalsService from '../services/vitalsService.js';
import CycleTrackingService from '../services/cycleTrackingService.js';
import NutritionService from '../services/nutritionService.js';

/**
 * Health Connect Dashboard View
 * Provides a centralized view for all Health Connect data types
 */
class HealthConnect {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    const user = store.getState().user;
    if (!user) return;

    try {
      // Fetch all Health Connect data
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        bodyMeasurements,
        sleepSessions,
        mindfulnessSessions,
        vitals,
        cycleTracking,
        nutritionLogs
      ] = await Promise.all([
        BodyMeasurementsService.getByDateRange(user.id, thirtyDaysAgo, today),
        SleepService.getByDateRange(user.id, thirtyDaysAgo, today),
        MindfulnessService.getByDateRange(user.id, thirtyDaysAgo, today),
        VitalsService.getByDateRange(user.id, thirtyDaysAgo, today),
        CycleTrackingService.getByDateRange(user.id, thirtyDaysAgo, today),
        NutritionService.getByDateRange(user.id, thirtyDaysAgo, today)
      ]);

      store.setBodyMeasurements(bodyMeasurements || []);
      store.setSleepSessions(sleepSessions || []);
      store.setMindfulnessSessions(mindfulnessSessions || []);
      store.setVitals(vitals || []);
      store.setCycleTracking(cycleTracking || []);
      store.setNutritionLogs(nutritionLogs || []);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Health Connect data:', error);
    }
  }

  render() {
    const state = store.getState();
    const { bodyMeasurements, sleepSessions, mindfulnessSessions, vitals, cycleTracking, nutritionLogs } = state;

    return `
      <div class="health-connect-dashboard">
        <div class="health-connect-header">
          <h1>Health Connect</h1>
          <p>Track your comprehensive health data</p>
        </div>

        <div class="health-connect-cards">
          <!-- Body Measurements Card -->
          <div class="health-connect-card" data-type="body-measurements">
            <div class="card-icon">📏</div>
            <div class="card-content">
              <h3>Body Measurements</h3>
              <p class="card-count">${bodyMeasurements.length} records</p>
              <p class="card-latest">${this.getLatestMeasurement(bodyMeasurements)}</p>
            </div>
            <button class="card-action" data-action="body-measurements">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <!-- Sleep Card -->
          <div class="health-connect-card" data-type="sleep">
            <div class="card-icon">😴</div>
            <div class="card-content">
              <h3>Sleep</h3>
              <p class="card-count">${sleepSessions.length} sessions</p>
              <p class="card-latest">${this.getLatestSleep(sleepSessions)}</p>
            </div>
            <button class="card-action" data-action="sleep">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <!-- Mindfulness Card -->
          <div class="health-connect-card" data-type="mindfulness">
            <div class="card-icon">🧘</div>
            <div class="card-content">
              <h3>Mindfulness</h3>
              <p class="card-count">${mindfulnessSessions.length} sessions</p>
              <p class="card-latest">${this.getLatestMindfulness(mindfulnessSessions)}</p>
            </div>
            <button class="card-action" data-action="mindfulness">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <!-- Vitals Card -->
          <div class="health-connect-card" data-type="vitals">
            <div class="card-icon">❤️</div>
            <div class="card-content">
              <h3>Vitals</h3>
              <p class="card-count">${vitals.length} records</p>
              <p class="card-latest">${this.getLatestVitals(vitals)}</p>
            </div>
            <button class="card-action" data-action="vitals">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <!-- Cycle Tracking Card -->
          <div class="health-connect-card" data-type="cycle-tracking">
            <div class="card-icon">🌸</div>
            <div class="card-content">
              <h3>Cycle Tracking</h3>
              <p class="card-count">${cycleTracking.length} records</p>
              <p class="card-latest">${this.getLatestCycle(cycleTracking)}</p>
            </div>
            <button class="card-action" data-action="cycle-tracking">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <!-- Nutrition Card -->
          <div class="health-connect-card" data-type="nutrition">
            <div class="card-icon">🥗</div>
            <div class="card-content">
              <h3>Nutrition</h3>
              <p class="card-count">${nutritionLogs.length} logs</p>
              <p class="card-latest">${this.getLatestNutrition(nutritionLogs)}</p>
            </div>
            <button class="card-action" data-action="nutrition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Stats Section -->
        <div class="health-connect-stats">
          <h2>Quick Stats (Last 30 Days)</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">${this.calculateAvgSleep(sleepSessions)}</span>
              <span class="stat-label">Avg Sleep (hrs)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.calculateAvgMindfulness(mindfulnessSessions)}</span>
              <span class="stat-label">Avg Mindfulness (min)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.getLatestBMI(bodyMeasurements)}</span>
              <span class="stat-label">Latest BMI</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.getLatestBloodPressure(vitals)}</span>
              <span class="stat-label">Latest BP</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getLatestMeasurement(measurements) {
    if (!measurements || measurements.length === 0) return 'No data';
    const latest = measurements[0];
    return latest.weight_kg ? `${latest.weight_kg.toFixed(1)} kg` : 'No data';
  }

  getLatestSleep(sessions) {
    if (!sessions || sessions.length === 0) return 'No data';
    const latest = sessions[0];
    return latest.duration_minutes ? `${Math.round(latest.duration_minutes / 60)} hrs` : 'No data';
  }

  getLatestMindfulness(sessions) {
    if (!sessions || sessions.length === 0) return 'No data';
    const latest = sessions[0];
    return latest.duration_minutes ? `${Math.round(latest.duration_minutes)} min` : 'No data';
  }

  getLatestVitals(vitals) {
    if (!vitals || vitals.length === 0) return 'No data';
    const latest = vitals[0];
    if (latest.heart_rate_bpm) return `${latest.heart_rate_bpm} BPM`;
    if (latest.blood_glucose_mg_dl) return `${latest.blood_glucose_mg_dl} mg/dL`;
    return 'No data';
  }

  getLatestCycle(records) {
    if (!records || records.length === 0) return 'No data';
    const latest = records[0];
    return latest.menstruation_period ? 'On period' : 'Not on period';
  }

  getLatestNutrition(logs) {
    if (!logs || logs.length === 0) return 'No data';
    const latest = logs[0];
    return latest.calories ? `${latest.calories} cal` : 'No data';
  }

  calculateAvgSleep(sessions) {
    if (!sessions || sessions.length === 0) return '-';
    const total = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return (total / sessions.length / 60).toFixed(1);
  }

  calculateAvgMindfulness(sessions) {
    if (!sessions || sessions.length === 0) return '-';
    const total = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return Math.round(total / sessions.length);
  }

  getLatestBMI(measurements) {
    if (!measurements || measurements.length === 0) return '-';
    return measurements[0].bmi || '-';
  }

  getLatestBloodPressure(vitals) {
    if (!vitals || vitals.length === 0) return '-';
    const latest = vitals[0];
    if (latest.systolic_blood_pressure && latest.diastolic_blood_pressure) {
      return `${Math.round(latest.systolic_blood_pressure)}/${Math.round(latest.diastolic_blood_pressure)}`;
    }
    return '-';
  }

  mount(container) {
    container.innerHTML = this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const actionButtons = document.querySelectorAll('.card-action');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        this.handleAction(action);
      });
    });
  }

  handleAction(action) {
    // Dispatch custom event to open the appropriate modal
    const event = new CustomEvent('health-connect-action', {
      detail: { action }
    });
    document.dispatchEvent(event);
  }

  addStyles() {
    if (!document.getElementById('health-connect-styles')) {
      const style = document.createElement('style');
      style.id = 'health-connect-styles';
      style.textContent = `
        .health-connect-dashboard {
          padding: 16px;
          padding-bottom: 80px;
        }
        .health-connect-header {
          margin-bottom: 24px;
        }
        .health-connect-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .health-connect-header p {
          color: var(--md-text-secondary);
          font-size: 0.875rem;
        }
        .health-connect-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .health-connect-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--md-surface-variant);
          border-radius: 16px;
          transition: transform 0.2s ease;
        }
        .health-connect-card:active {
          transform: scale(0.98);
        }
        .card-icon {
          font-size: 2rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--md-primary-container);
          border-radius: 12px;
        }
        .card-content {
          flex: 1;
        }
        .card-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .card-count {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
          margin-bottom: 2px;
        }
        .card-latest {
          font-size: 0.875rem;
          color: var(--md-primary);
          font-weight: 500;
        }
        .card-action {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--md-primary);
          color: var(--md-on-primary);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .card-action:hover {
          transform: scale(1.1);
        }
        .health-connect-stats {
          margin-top: 32px;
        }
        .health-connect-stats h2 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .stat-item {
          background: var(--md-surface-variant);
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--md-primary);
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--md-text-secondary);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export default HealthConnect;
