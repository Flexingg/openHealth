/**
 * Text formatting utilities
 */

/**
 * Converts a string to Sentence Caps (first letter of the string capitalized)
 * @param {string} str - The string to format
 * @returns {string} The formatted string with first letter capitalized
 */
export function toSentenceCaps(str) {
  if (!str || typeof str !== 'string') return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}