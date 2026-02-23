import { store } from '../state/store.js'
import { settingsService } from '../services/settingsService.js'

/**
 * Material You Theme Manager
 * Handles dynamic theme generation from accent color and theme mode
 */
class ThemeManager {
  // Preset Material You accent colors
  static ACCENT_COLORS = [
    { name: 'Teal', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Cyan', hex: '#06b6d4' }
  ]

  // Theme mode configurations
  static THEME_MODES = {
    light: {
      background: '#ffffff',
      surface: '#fafafa',
      surfaceVariant: '#f5f5f5',
      onBackground: '#1a1a1a',
      onSurface: '#1a1a1a'
    },
    dark: {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      surfaceVariant: '#3d3d3d',
      onBackground: '#ffffff',
      onSurface: '#ffffff'
    },
    amoled: {
      background: '#000000',
      surface: '#0a0a0a',
      surfaceVariant: '#1a1a1a',
      onBackground: '#ffffff',
      onSurface: '#ffffff'
    }
  }

  constructor() {
    this.initialized = false
  }

  /**
   * Initialize theme manager and load user preferences
   */
  async init() {
    if (this.initialized) return
    
    // Subscribe to store changes
    store.subscribe((state, prevState) => {
      if (state.theme !== prevState.theme) {
        this.applyTheme(state.theme)
      }
    })
    
    // Load theme from backend via settingsService
    await this.loadThemeFromBackend()
    
    // Apply initial theme
    this.applyTheme(store.getState().theme)
    this.initialized = true
  }

  /**
   * Load theme settings from backend via settingsService
   */
  async loadThemeFromBackend() {
    try {
      const settings = await settingsService.getSettings()
      
      if (settings) {
        const theme = {
          mode: settings.theme_mode || 'system',
          accentColor: settings.accent_color || '#10b981'
        }
        
        store.setTheme(theme)
        
        // Also update userSettings in store
        store.setUserSettings({
          themeMode: theme.mode,
          accentColor: theme.accentColor
        })
      }
    } catch (error) {
      console.error('Failed to load theme from backend:', error)
    }
  }

  /**
   * Save theme settings to backend via settingsService
   * @param {Object} theme - Theme settings
   */
  async saveThemeToBackend(theme) {
    try {
      await settingsService.updateTheme(theme.mode, theme.accentColor)
      
      // Update userSettings in store
      store.setUserSettings({
        themeMode: theme.mode,
        accentColor: theme.accentColor
      })
    } catch (error) {
      console.error('Failed to save theme to backend:', error)
      throw error
    }
  }

  /**
   * Apply theme to document
   * @param {Object} theme - Theme settings
   */
  applyTheme(theme) {
    const root = document.documentElement
    
    // Determine effective theme mode (resolve 'system')
    let effectiveMode = theme.mode
    if (theme.mode === 'system') {
      effectiveMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    // Get theme mode colors
    const modeColors = ThemeManager.THEME_MODES[effectiveMode] || ThemeManager.THEME_MODES.light
    
    // Generate accent color palette
    const accentPalette = this.generateAccentPalette(theme.accentColor)
    
    // Apply CSS custom properties
    root.style.setProperty('--md-primary', accentPalette.primary)
    root.style.setProperty('--md-on-primary', accentPalette.onPrimary)
    root.style.setProperty('--md-primary-container', accentPalette.primaryContainer)
    root.style.setProperty('--md-on-primary-container', accentPalette.onPrimaryContainer)
    
    root.style.setProperty('--md-background', modeColors.background)
    root.style.setProperty('--md-surface', modeColors.surface)
    root.style.setProperty('--md-surface-variant', modeColors.surfaceVariant)
    root.style.setProperty('--md-on-background', modeColors.onBackground)
    root.style.setProperty('--md-on-surface', modeColors.onSurface)
    
    // Apply secondary colors (derived from accent)
    root.style.setProperty('--md-secondary', accentPalette.secondary)
    root.style.setProperty('--md-on-secondary', accentPalette.onSecondary)
    
    // Apply semantic colors
    root.style.setProperty('--md-error', '#ef4444')
    root.style.setProperty('--md-on-error', '#ffffff')
    root.style.setProperty('--md-success', '#10b981')
    root.style.setProperty('--md-on-success', '#ffffff')
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', modeColors.background)
    }
    
    // Update body class for theme-specific styling
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-amoled')
    document.body.classList.add(`theme-${effectiveMode}`)
  }

  /**
   * Generate Material You color palette from accent color
   * @param {string} accentColor - Hex color code
   * @returns {Object} Color palette
   */
  generateAccentPalette(accentColor) {
    const hsl = this.hexToHsl(accentColor)
    
    return {
      primary: accentColor,
      onPrimary: this.getContrastColor(accentColor),
      primaryContainer: this.hslToHex(hsl.h, hsl.s * 0.3, Math.min(hsl.l + 35, 95)),
      onPrimaryContainer: this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 30, 10)),
      secondary: this.hslToHex(hsl.h, hsl.s * 0.7, 50),
      onSecondary: this.getContrastColor(this.hslToHex(hsl.h, hsl.s * 0.7, 50))
    }
  }

  /**
   * Convert hex to HSL
   * @param {string} hex - Hex color code
   * @returns {Object} HSL values
   */
  hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    
    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  /**
   * Convert HSL to hex
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color code
   */
  hslToHex(h, s, l) {
    s /= 100
    l /= 100
    
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2
    let r, g, b
    
    if (h < 60) { r = c; g = x; b = 0 }
    else if (h < 120) { r = x; g = c; b = 0 }
    else if (h < 180) { r = 0; g = c; b = x }
    else if (h < 240) { r = 0; g = x; b = c }
    else if (h < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    
    const toHex = (n) => {
      const hex = Math.round((n + m) * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  /**
   * Get contrasting text color (black or white)
   * @param {string} hex - Background hex color
   * @returns {string} '#ffffff' or '#1a1a1a'
   */
  getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
  }

  /**
   * Set theme mode
   * @param {string} mode - 'light', 'dark', 'amoled', or 'system'
   */
  async setThemeMode(mode) {
    const theme = { ...store.getState().theme, mode }
    store.setTheme(theme)
    await this.saveThemeToBackend(theme)
  }

  /**
   * Set accent color
   * @param {string} color - Hex color code
   */
  async setAccentColor(color) {
    const theme = { ...store.getState().theme, accentColor: color }
    store.setTheme(theme)
    await this.saveThemeToBackend(theme)
  }

  /**
   * Get available accent colors
   * @returns {Array} List of accent color options
   */
  getAccentColors() {
    return ThemeManager.ACCENT_COLORS
  }

  /**
   * Get available theme modes
   * @returns {Array} List of theme mode options
   */
  getThemeModes() {
    return [
      { value: 'system', label: 'System' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'amoled', label: 'AMOLED' }
    ]
  }
}

export const themeManager = new ThemeManager()
export default themeManager
