// Fallback authentication service for when Supabase is not available
// This is for development and testing purposes only

class FallbackAuthService {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('fallback_users') || '[]')
    this.currentUser = JSON.parse(localStorage.getItem('fallback_current_user') || 'null')
    this.listeners = []
  }

  // Generate a simple user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Sign up a new user
  async signUp(email, password, options = {}) {
    try {
      // Check if user already exists
      const existingUser = this.users.find(u => u.email === email)
      if (existingUser) {
        return {
          data: null,
          error: { message: 'User already registered' }
        }
      }

      // Create new user
      const newUser = {
        id: this.generateUserId(),
        email,
        password, // In real app, this would be hashed
        role: options.role || 'patient',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(), // Auto-confirm for demo
        user_metadata: options.userData || {}
      }

      this.users.push(newUser)
      localStorage.setItem('fallback_users', JSON.stringify(this.users))

      // Create user session
      const sessionUser = { ...newUser }
      delete sessionUser.password // Don't include password in session

      return {
        data: { user: sessionUser },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: { message: 'Sign up failed: ' + error.message }
      }
    }
  }

  // Sign in existing user
  async signIn(email, password) {
    try {
      const user = this.users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        return {
          data: null,
          error: { message: 'Invalid email or password' }
        }
      }

      // Create user session
      const sessionUser = { ...user }
      delete sessionUser.password

      this.currentUser = sessionUser
      localStorage.setItem('fallback_current_user', JSON.stringify(sessionUser))

      // Notify listeners
      this.listeners.forEach(listener => {
        listener('SIGNED_IN', { user: sessionUser })
      })

      return {
        data: { user: sessionUser },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: { message: 'Sign in failed: ' + error.message }
      }
    }
  }

  // Sign out current user
  async signOut() {
    try {
      this.currentUser = null
      localStorage.removeItem('fallback_current_user')

      // Notify listeners
      this.listeners.forEach(listener => {
        listener('SIGNED_OUT', { user: null })
      })

      return { error: null }
    } catch (error) {
      return { error: { message: 'Sign out failed: ' + error.message } }
    }
  }

  // Get current session
  async getSession() {
    return {
      data: {
        session: this.currentUser ? {
          user: this.currentUser,
          access_token: 'fallback_token'
        } : null
      }
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback) {
    this.listeners.push(callback)
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback)
            if (index > -1) {
              this.listeners.splice(index, 1)
            }
          }
        }
      }
    }
  }

  // Get user profile (simulate database call)
  async getUserProfile(userId) {
    const user = this.users.find(u => u.id === userId)
    if (user) {
      return {
        data: {
          id: user.id,
          role: user.role,
          email: user.email,
          created_at: user.created_at
        },
        error: null
      }
    }
    return {
      data: null,
      error: { message: 'User not found' }
    }
  }

  // Create sample users for testing
  createSampleUsers() {
    const sampleUsers = [
      {
        id: 'patient_demo_1',
        email: 'patient@demo.com',
        password: 'Patient123!',
        role: 'patient',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { full_name: 'Demo Patient' }
      },
      {
        id: 'doctor_demo_1',
        email: 'doctor@demo.com',
        password: 'Doctor123!',
        role: 'doctor',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { full_name: 'Dr. Demo' }
      }
    ]

    // Only add if they don't exist
    sampleUsers.forEach(sampleUser => {
      const exists = this.users.find(u => u.email === sampleUser.email)
      if (!exists) {
        this.users.push(sampleUser)
      }
    })

    localStorage.setItem('fallback_users', JSON.stringify(this.users))
    console.log('Sample users created:', sampleUsers.map(u => ({ email: u.email, password: u.password, role: u.role })))
  }
}

export default FallbackAuthService
