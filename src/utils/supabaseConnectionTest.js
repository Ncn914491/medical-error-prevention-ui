/**
 * Supabase Connection Test Utility
 * Quick tests to diagnose connection issues
 */

import { supabase } from '../lib/supabase'

// Test basic connectivity
export const testBasicConnection = async () => {
  try {
    console.log('🔍 Testing basic Supabase connection...')
    
    // Test 1: Simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Basic connection failed:', error)
      return { success: false, error: error.message, details: error }
    }
    
    console.log('✅ Basic connection successful')
    return { success: true, message: 'Connected successfully', count: data?.count }
    
  } catch (err) {
    console.error('❌ Connection exception:', err)
    return { success: false, error: err.message, details: err }
  }
}

// Test table existence
export const testTableExistence = async () => {
  const tables = ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']
  const results = {}
  
  console.log('🔍 Testing table existence...')
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message)
        results[table] = { exists: false, error: error.message }
      } else {
        console.log(`✅ Table ${table} exists with ${data?.count || 0} records`)
        results[table] = { exists: true, count: data?.count || 0 }
      }
    } catch (err) {
      console.error(`❌ Table ${table} check failed:`, err.message)
      results[table] = { exists: false, error: err.message }
    }
  }
  
  return results
}

// Test insert operation
export const testInsertOperation = async () => {
  try {
    console.log('🔍 Testing insert operation...')
    
    const testData = {
      firebase_uid: `test-insert-${Date.now()}`,
      email: 'test@insert.com',
      full_name: 'Insert Test User',
      role: 'patient'
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([testData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Insert operation failed:', error)
      return { success: false, error: error.message, details: error }
    }
    
    console.log('✅ Insert operation successful:', data.id)
    
    // Clean up test data
    await supabase
      .from('profiles')
      .delete()
      .eq('id', data.id)
    
    console.log('✅ Test data cleaned up')
    
    return { success: true, message: 'Insert operation successful', insertedId: data.id }
    
  } catch (err) {
    console.error('❌ Insert exception:', err)
    return { success: false, error: err.message, details: err }
  }
}

// Test environment variables
export const testEnvironmentVariables = () => {
  console.log('🔍 Testing environment variables...')
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  const results = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlValid: supabaseUrl && supabaseUrl.includes('supabase.co'),
    keyValid: supabaseKey && supabaseKey.startsWith('eyJ'),
    url: supabaseUrl,
    keyLength: supabaseKey ? supabaseKey.length : 0
  }
  
  if (!results.hasUrl || !results.hasKey) {
    console.error('❌ Missing environment variables')
    return { success: false, error: 'Missing environment variables', results }
  }
  
  if (!results.urlValid || !results.keyValid) {
    console.error('❌ Invalid environment variable format')
    return { success: false, error: 'Invalid environment variable format', results }
  }
  
  console.log('✅ Environment variables are properly configured')
  return { success: true, message: 'Environment variables configured', results }
}

// Run all tests
export const runAllConnectionTests = async () => {
  console.log('🚀 Running comprehensive connection tests...')
  
  const results = {
    environment: testEnvironmentVariables(),
    connection: null,
    tables: null,
    insert: null,
    timestamp: new Date().toISOString()
  }
  
  // Only proceed if environment is configured
  if (results.environment.success) {
    results.connection = await testBasicConnection()
    
    if (results.connection.success) {
      results.tables = await testTableExistence()
      results.insert = await testInsertOperation()
    }
  }
  
  // Summary
  const allSuccessful = results.environment.success && 
                       results.connection?.success && 
                       results.insert?.success
  
  console.log(allSuccessful ? '🎉 All tests passed!' : '⚠️ Some tests failed')
  
  return {
    success: allSuccessful,
    results,
    summary: {
      environment: results.environment.success,
      connection: results.connection?.success || false,
      tables: results.tables ? Object.values(results.tables).every(t => t.exists) : false,
      insert: results.insert?.success || false
    }
  }
}

// Quick diagnostic for debugging
export const quickDiagnostic = async () => {
  console.log('⚡ Running quick diagnostic...')
  
  try {
    // Check environment
    const env = testEnvironmentVariables()
    if (!env.success) {
      return { issue: 'environment', details: env }
    }
    
    // Check basic connection
    const conn = await testBasicConnection()
    if (!conn.success) {
      return { issue: 'connection', details: conn }
    }
    
    // Check if profiles table exists
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      return { issue: 'tables', details: { error: error.message, suggestion: 'Run database setup SQL' } }
    }
    
    return { issue: 'none', message: 'All basic checks passed', profileCount: data?.count }
    
  } catch (err) {
    return { issue: 'exception', details: { error: err.message } }
  }
}
