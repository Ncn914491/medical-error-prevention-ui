/**
 * Test Script for Supabase Configuration
 * Run this to verify the complete setup is working
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Test environment variable loading
console.log('🔍 Testing environment variable configuration...')

// Read .env file
let envVars = {}
try {
  const envContent = fs.readFileSync('.env', 'utf8')
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  console.log('✅ Successfully loaded .env file')
} catch (err) {
  console.error('❌ Failed to load .env file:', err.message)
}

// Read .env.local file
let envLocalVars = {}
try {
  const envLocalContent = fs.readFileSync('.env.local', 'utf8')
  envLocalContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envLocalVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  console.log('✅ Successfully loaded .env.local file')
} catch (err) {
  console.error('❌ Failed to load .env.local file:', err.message)
}

// Check Supabase configuration
const supabaseUrl = envVars.VITE_SUPABASE_URL || envLocalVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || envLocalVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n📊 Configuration Status:')
console.log('- Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('- Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing')
console.log('- URL matches expected:', supabaseUrl === 'https://izncvtyzvtloodzmsfhc.supabase.co' ? '✅ Correct' : '❌ Incorrect')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing required Supabase configuration!')
  process.exit(1)
}

// Test Supabase connection
console.log('\n🔗 Testing Supabase connection...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseConnection() {
  try {
    // Test 1: Basic connectivity
    console.log('📡 Test 1: Basic connectivity...')
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('⚠️  Connection test returned error (this is normal if tables don\'t exist):')
      console.log('   Error:', error.message)
      
      // Check if it's a "relation does not exist" error
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('✅ Connected to Supabase, but tables need to be created')
        console.log('   This means the credentials are working!')
        return true
      } else {
        console.error('❌ Connection failed with unexpected error')
        return false
      }
    } else {
      console.log('✅ Successfully connected to Supabase!')
      console.log('✅ Tables exist and are accessible')
      return true
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

async function testDatabaseSchema() {
  console.log('\n🗄️  Testing database schema...')
  
  const requiredTables = ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']
  const tableStatus = {}
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true })
      
      if (error) {
        tableStatus[table] = { exists: false, error: error.message }
        console.log(`❌ Table '${table}': ${error.message}`)
      } else {
        tableStatus[table] = { exists: true, count: data?.length || 0 }
        console.log(`✅ Table '${table}': Accessible`)
      }
    } catch (err) {
      tableStatus[table] = { exists: false, error: err.message }
      console.log(`❌ Table '${table}': ${err.message}`)
    }
  }
  
  const existingTables = Object.values(tableStatus).filter(status => status.exists).length
  console.log(`\n📊 Schema Status: ${existingTables}/${requiredTables.length} tables accessible`)
  
  return existingTables === requiredTables.length
}

async function testTokenGeneration() {
  console.log('\n🔑 Testing token generation...')
  
  try {
    // Test random token generation
    const testToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    console.log('✅ Token generation working:', testToken)
    
    // Test date operations
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    console.log('✅ Date operations working:', futureDate.toISOString())
    
    return true
  } catch (err) {
    console.error('❌ Token generation failed:', err.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting comprehensive Supabase setup tests...\n')
  
  const results = {
    connection: await testSupabaseConnection(),
    schema: await testDatabaseSchema(),
    tokenGeneration: await testTokenGeneration()
  }
  
  console.log('\n📋 Test Results Summary:')
  console.log('- Connection:', results.connection ? '✅ Pass' : '❌ Fail')
  console.log('- Database Schema:', results.schema ? '✅ Pass' : '❌ Fail')
  console.log('- Token Generation:', results.tokenGeneration ? '✅ Pass' : '❌ Fail')
  
  const allPassed = Object.values(results).every(result => result === true)
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Setup is complete and ready for use.')
    console.log('\n📝 Next steps:')
    console.log('1. Open your browser to http://localhost:5173')
    console.log('2. Navigate to http://localhost:5173/db-init')
    console.log('3. Click "Test Connection" to verify in the UI')
    console.log('4. Click "Initialize DB" to seed test data')
    console.log('5. Click "Test Flows" to run end-to-end tests')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.')
    
    if (!results.connection) {
      console.log('\n🔧 Connection Issues:')
      console.log('- Verify your Supabase URL and anon key are correct')
      console.log('- Check your internet connection')
      console.log('- Ensure your Supabase project is active')
    }
    
    if (!results.schema) {
      console.log('\n🔧 Schema Issues:')
      console.log('- Tables need to be created in your Supabase database')
      console.log('- Run the SQL schema from medical-safety-schema.sql')
      console.log('- Or use the DatabaseInitializer UI component')
    }
  }
  
  return allPassed
}

// Execute tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('❌ Test execution failed:', err)
    process.exit(1)
  })
