// src/utils/validation/mindfulnessValidation.js

export const mindfulnessValidation = {
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
    min: 1, // 1 minute
    max: 1440, // 24 hours
    required: true,
    validate: (value) => value >= 1 && value <= 1440,
    message: 'Duration must be between 1 minute and 24 hours'
  },
  sessionType: {
    required: false,
    validate: (value) => ['meditation', 'breathing', 'yoga', 'mindfulness', 'other'].includes(value),
    message: 'Invalid session type'
  },
  intensity: {
    required: false,
    validate: (value) => ['light', 'moderate', 'intense'].includes(value),
    message: 'Invalid intensity'
  }
};

export function validateMindfulnessSession(data) {
  const errors = [];
  
  Object.entries(mindfulnessValidation).forEach(([field, rules]) => {
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
