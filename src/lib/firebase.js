import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'

// Firebase configuration
// Get these values from Firebase Console: https://console.firebase.google.com/project/medsafeai/settings/general
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Debug: Log the loaded configuration (remove in production)
console.log('Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'MISSING'
})

// Validate Firebase configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missingEnvVars = requiredEnvVars.filter(envVar =>
  !import.meta.env[envVar] || import.meta.env[envVar].includes('YOUR_') || import.meta.env[envVar].includes('_HERE')
)

if (missingEnvVars.length > 0) {
  console.error('Missing or invalid Firebase environment variables:', missingEnvVars)
  console.error('Please check your .env file and ensure all Firebase credentials are properly set.')
  console.error('Get your Firebase config from: https://console.firebase.google.com/project/medsafeai/settings/general')
} else {
  console.log('✅ All Firebase environment variables loaded successfully')
}

// Initialize Firebase
console.log('🔥 Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING'
})

let app, auth, googleProvider

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  console.log('✅ Firebase initialized successfully')
} catch (initError) {
  console.error('❌ Firebase initialization failed:', initError)
  throw initError
}

// Configure Google provider
googleProvider.addScope('email')
googleProvider.addScope('profile')

// Firebase Auth utilities
export const firebaseAuth = {
  // Sign in with Google popup
  async signInWithGoogle() {
    try {
      console.log('Attempting Firebase Google sign in...')
      const result = await signInWithPopup(auth, googleProvider)
      
      console.log('Firebase Google sign in successful:', result.user.uid)
      
      return {
        user: result.user,
        error: null
      }
    } catch (error) {
      console.error('Firebase Google sign in error:', error)
      
      let errorMessage = 'Google sign in failed'
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign in was cancelled'
          break
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked by browser. Please allow popups and try again.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.'
          break
        default:
          errorMessage = error.message || 'Google sign in failed'
      }
      
      return {
        user: null,
        error: { message: errorMessage, code: error.code }
      }
    }
  },

  // Sign up with email and password
  async signUpWithEmail(email, password) {
    try {
      console.log('🔥 Firebase signUpWithEmail called with:', email)
      console.log('🔥 Auth object:', auth)
      console.log('🔥 Firebase config check:', {
        apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
        projectId: firebaseConfig.projectId
      })

      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: email.split('@')[0] })

      console.log('✅ Firebase email signup successful:', result.user.uid)
      return {
        user: result.user,
        error: null
      }
    } catch (error) {
      console.error('❌ Firebase email signup error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)

      // Provide more helpful error messages
      let userFriendlyMessage = error.message
      if (error.code === 'auth/api-key-not-valid') {
        userFriendlyMessage = 'Firebase configuration error. Please check that Email/Password authentication is enabled in Firebase Console.'
      } else if (error.code?.includes('api-key-not-valid')) {
        userFriendlyMessage = 'Firebase API key error. Please verify Firebase Console settings and ensure Email/Password authentication is enabled.'
      }

      return {
        user: null,
        error: { message: userFriendlyMessage, code: error.code }
      }
    }
  },

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      console.log('🔥 Firebase signInWithEmail called with:', email)
      console.log('🔥 Auth object:', auth)

      const result = await signInWithEmailAndPassword(auth, email, password)

      console.log('✅ Firebase email signin successful:', result.user.uid)
      return {
        user: result.user,
        error: null
      }
    } catch (error) {
      console.error('❌ Firebase email signin error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)

      // Provide more helpful error messages
      let userFriendlyMessage = error.message
      if (error.code === 'auth/api-key-not-valid') {
        userFriendlyMessage = 'Firebase configuration error. Please check that Email/Password authentication is enabled in Firebase Console.'
      } else if (error.code?.includes('api-key-not-valid')) {
        userFriendlyMessage = 'Firebase API key error. Please verify Firebase Console settings and ensure Email/Password authentication is enabled.'
      }

      return {
        user: null,
        error: { message: userFriendlyMessage, code: error.code }
      }
    }
  },
  async signOut() {
    try {
      console.log('Attempting Firebase sign out...')
      await firebaseSignOut(auth)
      console.log('Firebase sign out successful')
      
      return { error: null }
    } catch (error) {
      console.error('Firebase sign out error:', error)
      return { 
        error: { 
          message: 'Sign out failed', 
          code: error.code 
        } 
      }
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser
  },

  // Listen for auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  },

  // Get current user with promise
  async getCurrentUserAsync() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    })
  }
}

export { auth }
export default firebaseAuth
