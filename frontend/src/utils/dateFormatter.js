/**
 * Date formatting utilities
 */

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDateISO(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Format date for display
 * @param {Date|string} date - Date object or ISO string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const d = typeof date === 'string' ? new Date(date) : date
  const defaultOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }
  return d.toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

/**
 * Format time for display
 * @param {string} time - Time string (HH:MM:SS)
 * @returns {string} Formatted time string
 */
export function formatTime(time) {
  if (!time) return ''
  
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  
  return `${displayHour}:${minutes} ${ampm}`
}

/**
 * Get relative date label
 * @param {Date} date - Date to check
 * @returns {string} 'Today', 'Yesterday', 'Tomorrow', or formatted date
 */
export function getRelativeDateLabel(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((compareDate - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays === 1) return 'Tomorrow'
  
  return formatDate(date)
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isToday(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}
