import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabase } from './lib/supabase.js'

// Debug: Test Supabase connection
console.log('🔍 Testing Supabase connection...')
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('*')
    console.log('✅ Profiles test:', { data, error })
    if (error) {
      console.warn('⚠️  Database test showed error (this is normal if tables don\'t exist yet):', error.message)
    } else {
      console.log('🎉 Successfully connected to Supabase database!')
    }
  } catch (err) {
    console.error('❌ Failed to test Supabase connection:', err)
  }
}

// Run test
testSupabaseConnection()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
