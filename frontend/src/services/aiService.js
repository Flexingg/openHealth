import { supabase } from '../config/supabase.js'
import { storageManager } from '../utils/StorageManager.js'

/**
 * AI service for calling Supabase Edge Functions
 * AI config (provider, API key, model) is retrieved from IndexedDB
 * and passed to edge functions - NEVER stored in Supabase
 */
class AIService {
  /**
   * Smart log - classifies intent and handles food, water, or weight logging
   * @param {string} userInput - Natural language input
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} mealTime - Meal time category (for food logs)
   * @returns {Promise<Object>} Result from edge function with logType field
   */
  async smartLog(userInput, date, mealTime) {
    // Get AI config from IndexedDB
    const aiConfig = await storageManager.getAIConfig()
    
    if (!aiConfig) {
      throw new Error('AI configuration not found. Please configure your AI provider in Settings.')
    }
    
    console.log('smartLog called with:', {
      provider: aiConfig.provider,
      modelName: aiConfig.modelName,
      userInput,
      date,
      mealTime
    })
    
    const { data, error } = await supabase.functions.invoke('smart-log', {
      body: {
        provider: aiConfig.provider,
        ai_api_key: aiConfig.apiKey,
        model_name: aiConfig.modelName,
        user_input: userInput,
        date,
        meal_time: mealTime
      }
    })
    
    console.log('smartLog response:', { data, error })
    
    if (error) {
      console.error('smartLog error details:', error)
      // Try to get the actual error message from the response
      try {
        const errorData = await error.context?.json()
        console.error('Error data from context:', errorData)
        if (errorData?.error) {
          throw new Error(errorData.error)
        }
      } catch (e) {
        // Ignore if we can't parse the error
      }
      throw error
    }
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    return data
  }

  /**
   * Log food using natural language via AI (legacy method - use smartLog instead)
   * @param {string} userInput - Natural language food description
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} mealTime - Meal time category
   * @returns {Promise<Object>} Result from edge function
   */
  async logFoodWithAI(userInput, date, mealTime) {
    // Get AI config from IndexedDB
    const aiConfig = await storageManager.getAIConfig()
    
    if (!aiConfig) {
      throw new Error('AI configuration not found. Please configure your AI provider in Settings.')
    }
    
    const { data, error } = await supabase.functions.invoke('ai-food-log', {
      body: {
        provider: aiConfig.provider,
        ai_api_key: aiConfig.apiKey,
        model_name: aiConfig.modelName,
        user_input: userInput,
        date,
        meal_time: mealTime
      }
    })
    
    if (error) throw error
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    return data
  }

  /**
   * Scan nutrition label or food image using AI vision
   * @param {string} imageBase64 - Base64 encoded image (without data URI prefix)
   * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} Extracted nutrition data
   */
  async scanNutritionLabel(imageBase64, mimeType = 'image/jpeg') {
    // Get AI config from IndexedDB
    const aiConfig = await storageManager.getAIConfig()
    
    if (!aiConfig) {
      throw new Error('AI configuration not found. Please configure your AI provider in Settings.')
    }
    
    const { data, error } = await supabase.functions.invoke('scan-nutrition-label', {
      body: {
        provider: aiConfig.provider,
        ai_api_key: aiConfig.apiKey,
        model_name: aiConfig.modelName,
        imageBase64,
        mimeType
      }
    })
    
    if (error) throw error
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    return data.data
  }

  /**
   * Compress image to max width for upload
   * @param {File} file - Image file
   * @param {number} maxWidth - Maximum width (default 800px)
   * @returns {Promise<{base64: string, mimeType: string}>}
   */
  async compressImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Scale down if needed
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          // Get base64 without data URI prefix
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          const base64 = dataUrl.split(',')[1]
          
          resolve({
            base64,
            mimeType: 'image/jpeg'
          })
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Check if AI is configured
   * @returns {Promise<boolean>}
   */
  async isConfigured() {
    return storageManager.hasAIConfig()
  }
}

export const aiService = new AIService()
export default aiService
