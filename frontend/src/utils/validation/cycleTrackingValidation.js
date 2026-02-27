// src/utils/validation/cycleTrackingValidation.js

export const cycleTrackingValidation = {
  recordDate: {
    required: true,
    validate: (value) => value instanceof Date && !isNaN(value),
    message: 'Record date must be a valid date'
  },
  basalBodyTemperature: {
    min: 35, // °C
    max: 42, // °C
    required: false,
    validate: (value) => value >= 35 && value <= 42,
    message: 'Basal body temperature must be between 35 and 42°C'
  },
  cervicalMucus: {
    required: false,
    validate: (value) => ['dry', 'sticky', 'creamy', 'watery', 'egg_white'].includes(value),
    message: 'Invalid cervical mucus type'
  },
  menstruationFlow: {
    required: false,
    validate: (value) => ['light', 'moderate', 'heavy', 'spotting'].includes(value),
    message: 'Invalid menstruation flow'
  },
  ovulationTestResult: {
    required: false,
    validate: (value) => ['negative', 'positive', 'invalid'].includes(value),
    message: 'Invalid ovulation test result'
  },
  sexualActivity: {
    required: false,
    validate: (value) => typeof value === 'boolean',
    message: 'Sexual activity must be a boolean'
  },
  intermenstrualBleeding: {
    required: false,
    validate: (value) => typeof value === 'boolean',
    message: 'Intermenstrual bleeding must be a boolean'
  },
  menstruationPeriod: {
    required: false,
    validate: (value) => typeof value === 'boolean',
    message: 'Menstruation period must be a boolean'
  }
};

export function validateCycleTracking(data) {
  const errors = [];
  
  Object.entries(cycleTrackingValidation).forEach(([field, rules]) => {
    const value = data[field];
    
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(`${field} is required`);
      return;
    }
    
    if (value !== null && value !== undefined && value !== '') {
      if (!rules.validate(value)) {
        errors.push(rules.message);
      }
    }
  });
  
  return errors;
}
