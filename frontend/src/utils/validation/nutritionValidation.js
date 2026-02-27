// src/utils/validation/nutritionValidation.js

export const nutritionValidation = {
  logDate: {
    required: true,
    validate: (value) => value instanceof Date && !isNaN(value),
    message: 'Log date must be a valid date'
  },
  mealType: {
    required: false,
    validate: (value) => ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(value),
    message: 'Invalid meal type'
  },
  calories: {
    min: 0,
    max: 5000,
    required: false,
    validate: (value) => value >= 0 && value <= 5000,
    message: 'Calories must be between 0 and 5000'
  },
  proteinG: {
    min: 0,
    max: 500,
    required: false,
    validate: (value) => value >= 0 && value <= 500,
    message: 'Protein must be between 0 and 500 grams'
  },
  carbsG: {
    min: 0,
    max: 500,
    required: false,
    validate: (value) => value >= 0 && value <= 500,
    message: 'Carbohydrates must be between 0 and 500 grams'
  },
  fatG: {
    min: 0,
    max: 500,
    required: false,
    validate: (value) => value >= 0 && value <= 500,
    message: 'Fat must be between 0 and 500 grams'
  }
};

export function validateNutritionLog(data) {
  const errors = [];
  
  Object.entries(nutritionValidation).forEach(([field, rules]) => {
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
