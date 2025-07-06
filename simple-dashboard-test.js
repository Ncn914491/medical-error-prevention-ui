// Simple test for dashboard query
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDashboardQuery() {
  console.log('🧪 Testing dashboard query...')
  
  try {
    // Test the exact query from DoctorDashboard
    const { data, error } = await supabase
      .from('patient_doctor_connections')
      .select(`
        *,
        patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(
          id,
          firebase_uid,
          full_name,
          email,
          date_of_birth,
          gender,
          phone,
          address
        )
      `)
      .eq('is_active', true)
      .limit(5)

    if (error) {
      console.error('❌ Query failed:', error)
      return false
    }

    console.log('✅ Query successful!')
    console.log('📊 Results:', data.length, 'connections found')
    
    if (data.length > 0) {
      console.log('📋 Sample connection:')
      console.log('   Patient:', data[0].patient?.full_name || 'Unknown')
      console.log('   Token:', data[0].access_token)
      console.log('   Active:', data[0].is_active)
    }

    return true

  } catch (error) {
    console.error('💥 Exception:', error.message)
    return false
  }
}

async function testProfilesTable() {
  console.log('\n🔍 Testing profiles table structure...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, firebase_uid, full_name, email, role, phone, address')
      .limit(3)

    if (error) {
      console.error('❌ Profiles query failed:', error)
      return false
    }

    console.log('✅ Profiles table accessible!')
    console.log('📊 Sample profiles:', data.length)
    
    data.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name} (${profile.role})`)
    })

    return true

  } catch (error) {
    console.error('💥 Profiles exception:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Simple Dashboard Tests...\n')
  
  const profilesOk = await testProfilesTable()
  const dashboardOk = await testDashboardQuery()
  
  console.log('\n📊 Test Results:')
  console.log(`✅ Profiles Table: ${profilesOk ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Dashboard Query: ${dashboardOk ? 'PASS' : 'FAIL'}`)
  
  if (profilesOk && dashboardOk) {
    console.log('\n🎉 All tests PASSED! Dashboard should work correctly.')
  } else {
    console.log('\n⚠️  Some tests FAILED. Check the errors above.')
  }
}

runTests().catch(console.error)
