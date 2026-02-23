import { get, set, del } from 'idb-keyval'

/**
 * StorageManager handles local storage for temporary/cached data.
 * Note: AI configuration has been moved to backend (user_settings table).
 * This class is kept for potential future local caching needs.
 */
class StorageManager {
  // Legacy keys - kept for migration purposes
  static AI_PROVIDER_KEY = 'ai_provider'
  static AI_API_KEY_KEY = 'ai_api_key'
  static AI_MODEL_KEY = 'ai_model_name'

  /**
   * Clear any legacy AI configuration from IndexedDB
   * Call this once after user migrates to backend-stored settings
   */
  async clearLegacyAIConfig() {
    try {
      await del(StorageManager.AI_PROVIDER_KEY)
      await del(StorageManager.AI_API_KEY_KEY)
      await del(StorageManager.AI_MODEL_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear legacy AI config:', error)
      return false
    }
  }

  /**
   * Check if legacy AI config exists (for migration detection)
   * @returns {Promise<boolean>}
   */
  async hasLegacyAIConfig() {
    try {
      const provider = await get(StorageManager.AI_PROVIDER_KEY)
      const apiKey = await get(StorageManager.AI_API_KEY_KEY)
      const modelName = await get(StorageManager.AI_MODEL_KEY)
      return !!(provider && apiKey && modelName)
    } catch (error) {
      return false
    }
  }

  /**
   * Get legacy AI config for migration purposes
   * @returns {Promise<Object|null>}
   */
  async getLegacyAIConfig() {
    try {
      const provider = await get(StorageManager.AI_PROVIDER_KEY)
      const apiKey = await get(StorageManager.AI_API_KEY_KEY)
      const modelName = await get(StorageManager.AI_MODEL_KEY)

      if (!provider || !apiKey || !modelName) {
        return null
      }

      return { provider, apiKey, modelName }
    } catch (error) {
      console.error('Failed to get legacy AI config:', error)
      return null
    }
  }

  // ==========================================
  // GENERAL PURPOSE STORAGE (for future use)
  // ==========================================

  /**
   * Save a value to IndexedDB
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  async set(key, value) {
    try {
      await set(key, value)
      return true
    } catch (error) {
      console.error('Failed to save to storage:', error)
      throw error
    }
  }

  /**
   * Get a value from IndexedDB
   * @param {string} key - Storage key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      return await get(key)
    } catch (error) {
      console.error('Failed to get from storage:', error)
      return null
    }
  }

  /**
   * Delete a value from IndexedDB
   * @param {string} key - Storage key
   */
  async delete(key) {
    try {
      await del(key)
      return true
    } catch (error) {
      console.error('Failed to delete from storage:', error)
      throw error
    }
  }
}

export const storageManager = new StorageManager()
export default storageManager
