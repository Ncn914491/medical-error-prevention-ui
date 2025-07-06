import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { firebaseAuth } from '../lib/firebase'
import FallbackAuthService from '../services/fallbackAuth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [usingFirebase, setUsingFirebase] = useState(true)
  const [fallbackAuth] = useState(() => new FallbackAuthService())

  const fetchUserProfile = async (userId) => {
    if (!userId) return
    
    try {
      if (!usingFirebase) {
        const { data, error } = await fallbackAuth.getUserProfile(userId)
        if (!error && data) {
          setUserProfile(data)
        }
      } else {
        // Try to get profile from Supabase using Firebase user ID
        const { data, error, status } = await supabase
          .from('profiles')
          .select('*')
          .eq('firebase_uid', userId)
          .maybeSingle()
        
        console.log('fetchUserProfile - Firebase user profile:', { data, error, status, userId })
        
        if (!error && data) {
          setUserProfile(data)
        } else {
          // Create default profile for new Firebase users
          const defaultProfile = {
            id: userId,
            role: 'patient', // Default role
            firebase_uid: userId
          }
          console.log('Using default profile for user:', defaultProfile)
          setUserProfile(defaultProfile)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Set default profile on error
      setUserProfile({
        id: userId,
        role: 'patient',
        firebase_uid: userId
      })
    }
  }

  useEffect(() => {
    let unsubscribe
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing Firebase authentication...')
        setLoading(true)
        
        // Get current Firebase user
        const currentUser = await firebaseAuth.getCurrentUserAsync()
        
        if (currentUser) {
          console.log('Firebase user found:', currentUser.uid)
          setUser(currentUser)
          await fetchUserProfile(currentUser.uid)
        } else {
          console.log('No Firebase user found')
          setUser(null)
          setUserProfile(null)
        }
        
        setLoading(false)
        console.log('Firebase authentication initialized')
      } catch (error) {
        console.error('Firebase initialization failed, using fallback auth:', error)
        setUsingFirebase(false)
        
        // Initialize fallback auth
        fallbackAuth.createSampleUsers()
        const { data: { session } } = await fallbackAuth.getSession()
        
        setUser(session?.user ?? null)
        setLoading(false)
        await fetchUserProfile(session?.user?.id)
        
        console.log('Fallback authentication initialized')
      }
    }

    // Listen for Firebase auth state changes
    if (usingFirebase) {
      unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        console.log('Firebase auth state changed:', firebaseUser?.uid || 'signed out')
        
        if (firebaseUser) {
          setUser(firebaseUser)
          await fetchUserProfile(firebaseUser.uid)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        
        if (loading) {
          setLoading(false)
        }
      })
    } else {
      // Fallback auth listener
      const { data: { subscription } } = fallbackAuth.onAuthStateChange(
        async (event, session) => {
          console.log('Fallback auth change:', event)
          setUser(session?.user ?? null)
          await fetchUserProfile(session?.user?.id)
          
          if (loading) {
            setLoading(false)
          }
        }
      )
      unsubscribe = subscription.unsubscribe
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [usingFirebase])

  // Sign up with email and password
  const signUp = async (email, password, options = {}) => {
    try {
      if (!usingFirebase) {
        // Use fallback auth if Firebase is not available
        const result = await fallbackAuth.signUp(email, password, options)
        return {
          data: result.data ? { user: result.data.user } : null,
          error: result.error
        }
      }

      console.log('Attempting Firebase email signup for:', email)
      const { user, error } = await firebaseAuth.signUpWithEmail(email, password)

      if (error) {
        console.error('Firebase email signup error:', error)
        return { data: null, error }
      }

      console.log('Firebase email signup successful:', user.uid)

      // Create user profile in Supabase
      const role = options.role || 'patient'
      await createUserProfile(user.uid, { role })

      return { data: { user }, error: null }
    } catch (err) {
      console.error('Sign up error:', err)
      return { data: null, error: { message: err.message } }
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      if (!usingFirebase) {
        // Use fallback auth if Firebase is not available
        const result = await fallbackAuth.signIn(email, password)
        return {
          data: result.data ? { user: result.data.user } : null,
          error: result.error
        }
      }

      console.log('Attempting Firebase email signin for:', email)
      const { user, error } = await firebaseAuth.signInWithEmail(email, password)

      if (error) {
        console.error('Firebase email signin error:', error)
        return { data: null, error }
      }

      console.log('Firebase email signin successful:', user.uid)
      return { data: { user }, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: { message: err.message } }
    }
  }

  const signInWithGoogle = async (role = 'patient') => {
    try {
      if (!usingFirebase) {
        // Use fallback auth if Firebase is not available
        const result = await fallbackAuth.signIn('demo@firebase.com', 'FirebaseDemo123!')
        return {
          data: result.data ? { user: result.data.user } : null,
          error: result.error
        }
      }
      
      console.log('Attempting Firebase Google sign in with role:', role)
      const { user, error } = await firebaseAuth.signInWithGoogle()
      
      if (error) {
        console.error('Firebase Google sign in error:', error)
        return { data: null, error }
      }
      
      console.log('Firebase Google sign in successful:', user.uid)
      
      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role, firebase_uid')
        .eq('firebase_uid', user.uid)
        .single()
      
      // Only create/update profile if it doesn't exist or needs role update
      if (!existingProfile) {
        console.log('Creating new user profile with role:', role)
        await createUserProfile(user.uid, {
          firebase_uid: user.uid,
          email: user.email,
          full_name: user.displayName,
          role: role
        })
      } else {
        console.log('Existing user profile found with role:', existingProfile.role)
        // Update the local user profile state
        setUserProfile(existingProfile)
      }
      
      return { 
        data: { user }, 
        error: null 
      }
    } catch (err) {
      console.error('Google sign in catch error:', err)
      return { 
        data: null, 
        error: { 
          message: 'Google sign in failed. Please try again.',
          details: err.message 
        } 
      }
    }
  }

  const signOut = async () => {
    try {
      let result
      
      if (!usingFirebase) {
        result = await fallbackAuth.signOut()
      } else {
        result = await firebaseAuth.signOut()
      }
      
      if (!result.error) {
        setUser(null)
        setUserProfile(null)
      }
      
      return result
    } catch (err) {
      console.error('Sign out error:', err)
      return { error: { message: 'Failed to sign out', details: err.message } }
    }
  }

  const createUserProfile = async (userId, profileData) => {
    try {
      // For Firebase users, use firebase_uid as the key
      const profileToCreate = {
        firebase_uid: userId,
        role: profileData.role || 'patient',
        email: profileData.email,
        full_name: profileData.full_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...profileData
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileToCreate])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating user profile:', error)
        // Set a default profile even if Supabase fails
        setUserProfile(profileToCreate)
      } else {
        setUserProfile(data)
      }
      
      return { data: data || profileToCreate, error }
    } catch (err) {
      console.error('Create profile catch error:', err)
      // Set a default profile on error
      const defaultProfile = {
        firebase_uid: userId,
        role: 'patient',
        ...profileData
      }
      setUserProfile(defaultProfile)
      return { data: defaultProfile, error: err }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    userProfile,
    createUserProfile,
    usingFirebase
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
