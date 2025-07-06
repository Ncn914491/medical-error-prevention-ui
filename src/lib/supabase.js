import { createClient } from '@supabase/supabase-js'

// Cloud Supabase configuration
// Support both Vite and Next.js environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.error('Get these values from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api')
  throw new Error('Supabase configuration missing')
}

if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  console.error('❌ Please update your Supabase credentials in .env file!')
  console.error('Current URL:', supabaseUrl)
  console.error('Get real credentials from: https://supabase.com/dashboard')
  throw new Error('Supabase credentials not configured')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection and log status
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message)
      console.warn('This might be because tables don\'t exist yet - that\'s okay!')
    } else {
      console.log('✅ Successfully connected to cloud Supabase!')
      console.log('📊 Database URL:', supabaseUrl)
    }
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err.message)
  }
}

// Test connection on initialization
testConnection()

// Export connection status checker
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    return !error
  } catch (err) {
    return false
  }
}
