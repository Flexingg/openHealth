// src/utils/validation/sleepValidation.js

export const sleepValidation = {
  startTime: {
    required: true,
    validate: (value) => value instanceof Date && !isNaN(value),
    message: 'Start time must be a valid date'
  },
  endTime: {
    required: true,
    validate: (value) => value instanceof Date && !isNaN(value),
    message: 'End time must be a valid date'
  },
  durationMinutes: {
    min: 30, // 0.5 hours
    max: 1440, // 24 hours
    required: true,
    validate: (value) => value >= 30 && value <= 1440,
    message: 'Duration must be between 30 minutes and 24 hours'
  },
  sleepType: {
    required: false,
    validate: (value) => ['deep', 'light', 'rem', 'awake', 'unknown'].includes(value),
    message: 'Invalid sleep type'
  },
  sleepQuality: {
    required: false,
    validate: (value) => ['poor', 'fair', 'good', 'excellent'].includes(value),
    message: 'Invalid sleep quality'
  }
};

export function validateSleepSession(data) {
  const errors = [];
  
  Object.entries(sleepValidation).forEach(([field, rules]) => {
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
  
  // Validate time order
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push('End time must be after start time');
  }
  
  return errors;
}
