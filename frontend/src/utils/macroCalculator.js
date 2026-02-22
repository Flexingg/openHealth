/**
 * Macro calculation utilities
 */

/**
 * Calculate macros for a given number of servings
 * @param {Object} food - Food object with nutrition info
 * @param {number} servings - Number of servings
 * @returns {Object} Calculated macros
 */
export function calculateMacros(food, servings) {
  return {
    calories: Math.round((food.calories || 0) * servings),
    protein: Math.round((food.protein || 0) * servings * 10) / 10,
    carbs: Math.round((food.carbs || 0) * servings * 10) / 10,
    fat: Math.round((food.fat || 0) * servings * 10) / 10
  }
}

/**
 * Calculate percentage of goal
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @returns {number} Percentage (0-100+)
 */
export function calculatePercentage(current, target) {
  if (!target || target === 0) return 0
  return Math.round((current / target) * 100)
}

/**
 * Calculate remaining macros
 * @param {Object} current - Current macros
 * @param {Object} target - Target macros
 * @returns {Object} Remaining macros
 */
export function calculateRemaining(current, target) {
  return {
    calories: Math.max(0, (target.calories || 0) - (current.calories || 0)),
    protein: Math.max(0, (target.protein || 0) - (current.protein || 0)),
    carbs: Math.max(0, (target.carbs || 0) - (current.carbs || 0)),
    fat: Math.max(0, (target.fat || 0) - (current.fat || 0))
  }
}

/**
 * Get progress status
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @returns {string} 'ok', 'warning', or 'danger'
 */
export function getProgressStatus(current, target) {
  const percentage = (current / target) * 100
  
  if (percentage > 100) return 'danger'
  if (percentage > 85) return 'warning'
  return 'ok'
}

/**
 * Sum macros from an array of items
 * @param {Array} items - Array of objects with macros
 * @param {string} caloriesKey - Key for calories (default 'calories')
 * @param {string} proteinKey - Key for protein (default 'protein')
 * @param {string} carbsKey - Key for carbs (default 'carbs')
 * @param {string} fatKey - Key for fat (default 'fat')
 * @returns {Object} Summed macros
 */
export function sumMacros(items, caloriesKey = 'calories', proteinKey = 'protein', carbsKey = 'carbs', fatKey = 'fat') {
  return items.reduce((acc, item) => ({
    calories: acc.calories + (item[caloriesKey] || 0),
    protein: acc.protein + (item[proteinKey] || 0),
    carbs: acc.carbs + (item[carbsKey] || 0),
    fat: acc.fat + (item[fatKey] || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

/**
 * Format macro value for display
 * @param {number} value - Macro value
 * @param {string} unit - Unit suffix
 * @param {boolean} round - Whether to round the value
 * @returns {string} Formatted string
 */
export function formatMacro(value, unit = '', round = true) {
  const displayValue = round ? Math.round(value) : value
  return `${displayValue}${unit}`
}
