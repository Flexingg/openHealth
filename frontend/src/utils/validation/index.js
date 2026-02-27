// src/utils/validation/index.js

import { validateBodyMeasurements } from './bodyMeasurementsValidation';
import { validateSleepSession } from './sleepValidation';
import { validateMindfulnessSession } from './mindfulnessValidation';
import { validateCycleTracking } from './cycleTrackingValidation';
import { validateVitals } from './vitalsValidation';
import { validateNutritionLog } from './nutritionValidation';

export const Validators = {
  body_measurements: validateBodyMeasurements,
  sleep_sessions: validateSleepSession,
  mindfulness_sessions: validateMindfulnessSession,
  cycle_tracking: validateCycleTracking,
  vitals: validateVitals,
  nutrition_logs: validateNutritionLog
};

export function validateData(data, tableName) {
  if (!Validators[tableName]) {
    throw new Error(`No validator found for table: ${tableName}`);
  }
  
  return Validators[tableName](data);
}

export function isValid(data, tableName) {
  return validateData(data, tableName).length === 0;
}
