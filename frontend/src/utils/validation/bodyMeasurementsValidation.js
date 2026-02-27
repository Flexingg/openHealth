// src/utils/validation/bodyMeasurementsValidation.js

export const bodyMeasurementsValidation = {
  height: {
    min: 50, // cm
    max: 250, // cm
    required: false,
    validate: (value) => {
      if (value === null || value === undefined) return true;
      return value >= 50 && value <= 250;
    },
    message: 'Height must be between 50 and 250 cm'
  },
  weight: {
    min: 20, // kg
    max: 300, // kg
    required: true,
    validate: (value) => value >= 20 && value <= 300,
    message: 'Weight must be between 20 and 300 kg'
  },
  bodyFatPercent: {
    min: 0,
    max: 100,
    required: false,
    validate: (value) => value >= 0 && value <= 100,
    message: 'Body fat percentage must be between 0 and 100%'
  },
  boneMassKg: {
    min: 0,
    max: 50,
    required: false,
    validate: (value) => value >= 0 && value <= 50,
    message: 'Bone mass must be between 0 and 50 kg'
  },
  leanBodyMassKg: {
    min: 0,
    max: 250,
    required: false,
    validate: (value) => value >= 0 && value <= 250,
    message: 'Lean body mass must be between 0 and 250 kg'
  },
  bodyWaterPercent: {
    min: 0,
    max: 100,
    required: false,
    validate: (value) => value >= 0 && value <= 100,
    message: 'Body water percentage must be between 0 and 100%'
  },
  basalMetabolicRateKcal: {
    min: 500,
    max: 5000,
    required: false,
    validate: (value) => value >= 500 && value <= 5000,
    message: 'BMR must be between 500 and 5000 kcal'
  }
};

export function validateBodyMeasurements(data) {
  const errors = [];
  
  Object.entries(bodyMeasurementsValidation).forEach(([field, rules]) => {
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
