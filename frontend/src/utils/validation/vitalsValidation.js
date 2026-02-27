// src/utils/validation/vitalsValidation.js

export const vitalsValidation = {
  recordDate: {
    required: true,
    validate: (value) => value instanceof Date && !isNaN(value),
    message: 'Record date must be a valid date'
  },
  bloodGlucoseMgDl: {
    min: 50,
    max: 500,
    required: false,
    validate: (value) => value >= 50 && value <= 500,
    message: 'Blood glucose must be between 50 and 500 mg/dL'
  },
  systolicBloodPressure: {
    min: 70,
    max: 200,
    required: false,
    validate: (value) => value >= 70 && value <= 200,
    message: 'Systolic blood pressure must be between 70 and 200 mmHg'
  },
  diastolicBloodPressure: {
    min: 40,
    max: 120,
    required: false,
    validate: (value) => value >= 40 && value <= 120,
    message: 'Diastolic blood pressure must be between 40 and 120 mmHg'
  },
  heartRateBpm: {
    min: 30,
    max: 200,
    required: false,
    validate: (value) => value >= 30 && value <= 200,
    message: 'Heart rate must be between 30 and 200 BPM'
  },
  heartRateVariability: {
    min: 10,
    max: 200,
    required: false,
    validate: (value) => value >= 10 && value <= 200,
    message: 'Heart rate variability must be between 10 and 200 ms'
  },
  oxygenSaturationPercent: {
    min: 70,
    max: 100,
    required: false,
    validate: (value) => value >= 70 && value <= 100,
    message: 'Oxygen saturation must be between 70 and 100%'
  },
  respiratoryRateBpm: {
    min: 8,
    max: 40,
    required: false,
    validate: (value) => value >= 8 && value <= 40,
    message: 'Respiratory rate must be between 8 and 40 BPM'
  },
  restingHeartRateBpm: {
    min: 30,
    max: 100,
    required: false,
    validate: (value) => value >= 30 && value <= 100,
    message: 'Resting heart rate must be between 30 and 100 BPM'
  },
  bodyTemperatureC: {
    min: 35,
    max: 42,
    required: false,
    validate: (value) => value >= 35 && value <= 42,
    message: 'Body temperature must be between 35 and 42°C'
  },
  skinTemperatureC: {
    min: 25,
    max: 40,
    required: false,
    validate: (value) => value >= 25 && value <= 40,
    message: 'Skin temperature must be between 25 and 40°C'
  }
};

export function validateVitals(data) {
  const errors = [];
  
  Object.entries(vitalsValidation).forEach(([field, rules]) => {
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
