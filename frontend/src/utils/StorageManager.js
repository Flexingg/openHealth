import { get, set, del } from 'idb-keyval'

/**
 * StorageManager handles secure local storage for AI configuration.
 * CRITICAL: AI API keys are NEVER sent to Supabase - they stay in IndexedDB.
 */
class StorageManager {
  static AI_PROVIDER_KEY = 'ai_provider'
  static AI_API_KEY_KEY = 'ai_api_key'
  static AI_MODEL_KEY = 'ai_model_name'

  /**
   * Save AI configuration to IndexedDB
   * @param {Object} config - AI configuration object
   * @param {string} config.provider - 'openai', 'anthropic', or 'gemini'
   * @param {string} config.apiKey - The API key
   * @param {string} config.modelName - The model name/ID
   */
  async saveAIConfig({ provider, apiKey, modelName }) {
    try {
      await set(StorageManager.AI_PROVIDER_KEY, provider)
      await set(StorageManager.AI_API_KEY_KEY, apiKey)
      await set(StorageManager.AI_MODEL_KEY, modelName)
      return true
    } catch (error) {
      console.error('Failed to save AI config:', error)
      throw error
    }
  }

  /**
   * Get AI configuration from IndexedDB
   * @returns {Promise<Object|null>} AI configuration or null if not set
   */
  async getAIConfig() {
    try {
      const provider = await get(StorageManager.AI_PROVIDER_KEY)
      const apiKey = await get(StorageManager.AI_API_KEY_KEY)
      const modelName = await get(StorageManager.AI_MODEL_KEY)

      if (!provider || !apiKey || !modelName) {
        return null
      }

      return { provider, apiKey, modelName }
    } catch (error) {
      console.error('Failed to get AI config:', error)
      return null
    }
  }

  /**
   * Clear all AI configuration from IndexedDB
   */
  async clearAIConfig() {
    try {
      await del(StorageManager.AI_PROVIDER_KEY)
      await del(StorageManager.AI_API_KEY_KEY)
      await del(StorageManager.AI_MODEL_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear AI config:', error)
      throw error
    }
  }

  /**
   * Check if AI configuration exists
   * @returns {Promise<boolean>}
   */
  async hasAIConfig() {
    const config = await this.getAIConfig()
    return config !== null
  }
}

export const storageManager = new StorageManager()
export default storageManager
