import { supabase } from '../../config/supabase.js'

/**
 * AuthScreen component for login/signup
 */
class AuthScreen {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess
    this.isLogin = true
    this.loading = false
    this.error = null
  }

  render() {
    return `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-logo">
            <h1>PWAte</h1>
            <p>AI-powered food tracking</p>
          </div>
          
          <form id="auth-form" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                class="form-input" 
                placeholder="••••••••"
                required
                autocomplete="current-password"
                minlength="6"
              />
            </div>
            
            ${this.error ? `<div class="form-error">${this.error}</div>` : ''}
            
            <button type="submit" class="btn btn-primary btn-full btn-lg mt-md" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? '<span class="spinner"></span>' : (this.isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          
          <div class="auth-toggle mt-md text-center">
            <button type="button" class="btn btn-text" id="toggle-auth-mode">
              ${this.isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    `
  }

  mount(container) {
    container.innerHTML = this.render()
    this.attachEventListeners()
  }

  attachEventListeners() {
    const form = document.getElementById('auth-form')
    const toggleBtn = document.getElementById('toggle-auth-mode')

    form.addEventListener('submit', (e) => this.handleSubmit(e))
    toggleBtn.addEventListener('click', () => this.toggleMode())
  }

  toggleMode() {
    this.isLogin = !this.isLogin
    this.error = null
    this.mount(document.getElementById('app'))
  }

  async handleSubmit(e) {
    e.preventDefault()
    
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    
    if (!email || !password) {
      this.error = 'Please fill in all fields'
      this.mount(document.getElementById('app'))
      return
    }

    this.loading = true
    this.error = null
    this.mount(document.getElementById('app'))

    try {
      let result
      
      if (this.isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ email, password })
      }

      if (result.error) {
        this.error = result.error.message
        this.loading = false
        this.mount(document.getElementById('app'))
        return
      }

      // Success - onAuthSuccess will be called by auth state listener
      if (this.onAuthSuccess) {
        this.onAuthSuccess(result.data.user)
      }
    } catch (err) {
      this.error = 'An unexpected error occurred'
      this.loading = false
      this.mount(document.getElementById('app'))
    }
  }
}

export default AuthScreen
