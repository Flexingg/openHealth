/**
 * SPA Router using History API
 */
class Router {
  constructor() {
    this.routes = new Map()
    this.currentRoute = null
    this.onRouteChange = null
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      this.handleRouteChange(window.location.pathname)
    })
  }

  /**
   * Register a route handler
   * @param {string} path - Route path
   * @param {Function} handler - Route handler function
   */
  register(path, handler) {
    this.routes.set(path, handler)
  }

  /**
   * Navigate to a path
   * @param {string} path - Target path
   */
  navigate(path) {
    window.history.pushState({}, '', path)
    this.handleRouteChange(path)
  }

  /**
   * Handle route change
   * @param {string} path - Current path
   */
  handleRouteChange(path) {
    // Find matching route
    let handler = this.routes.get(path)
    
    // If no exact match, try to find a matching pattern
    if (!handler) {
      for (const [routePath, routeHandler] of this.routes) {
        if (this.matchRoute(routePath, path)) {
          handler = routeHandler
          break
        }
      }
    }
    
    // If still no match, redirect to dashboard
    if (!handler) {
      handler = this.routes.get('/')
    }
    
    this.currentRoute = path
    
    if (handler) {
      handler(path)
    }
    
    if (this.onRouteChange) {
      this.onRouteChange(path)
    }
  }

  /**
   * Check if a route pattern matches a path
   * @param {string} pattern - Route pattern (e.g., '/food/:id')
   * @param {string} path - Actual path
   * @returns {boolean}
   */
  matchRoute(pattern, path) {
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')
    
    if (patternParts.length !== pathParts.length) {
      return false
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        continue // Dynamic segment
      }
      if (patternParts[i] !== pathParts[i]) {
        return false
      }
    }
    
    return true
  }

  /**
   * Extract parameters from a path
   * @param {string} pattern - Route pattern
   * @param {string} path - Actual path
   * @returns {Object} Parameters object
   */
  extractParams(pattern, path) {
    const params = {}
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1)
        params[paramName] = pathParts[i]
      }
    }
    
    return params
  }

  /**
   * Initialize router with current path
   */
  init() {
    this.handleRouteChange(window.location.pathname)
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back()
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward()
  }
}

export const router = new Router()
export default router
