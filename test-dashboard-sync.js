#!/usr/bin/env node

/**
 * Test Script for Doctor Dashboard Synchronization
 * 
 * This script tests the token sharing and dashboard synchronization functionality
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test data
const testPatientUid = 'test-patient-dashboard-' + Date.now()
const testDoctorUid = 'test-doctor-dashboard-' + Date.now()

async function setupTestData() {
  console.log('🔧 Setting up test data...')
  
  try {
    // Create test patient
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .upsert([{
        firebase_uid: testPatientUid,
        email: `patient-${Date.now()}@test.com`,
        full_name: 'Test Dashboard Patient',
        role: 'patient'
      }])
      .select()
      .single()

    if (patientError) {
      console.error('❌ Failed to create patient:', patientError)
      return false
    }

    // Create test doctor
    const { data: doctor, error: doctorError } = await supabase
      .from('profiles')
      .upsert([{
        firebase_uid: testDoctorUid,
        email: `doctor-${Date.now()}@test.com`,
        full_name: 'Test Dashboard Doctor',
        role: 'doctor'
      }])
      .select()
      .single()

    if (doctorError) {
      console.error('❌ Failed to create doctor:', doctorError)
      return false
    }

    console.log('✅ Test profiles created successfully')
    return true

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return false
  }
}

async function testTokenGeneration() {
  console.log('\n🔑 Testing token generation...')
  
  try {
    const accessToken = Math.random().toString(36).substring(2, 10).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data, error } = await supabase
      .from('patient_doctor_connections')
      .insert([{
        patient_firebase_uid: testPatientUid,
        doctor_firebase_uid: null, // Initially null
        access_token: accessToken,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        permissions: {
          view_medical_history: true,
          view_medications: true,
          view_diagnosis: true
        }
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Token generation failed:', error)
      return null
    }

    console.log('✅ Token generated:', accessToken)
    return accessToken

  } catch (error) {
    console.error('❌ Token generation exception:', error)
    return null
  }
}

async function testTokenUsage(accessToken) {
  console.log('\n👨‍⚕️ Testing token usage by doctor...')
  
  try {
    // Find the token
    const { data: connection, error: findError } = await supabase
      .from('patient_doctor_connections')
      .select('*')
      .eq('access_token', accessToken)
      .eq('is_active', true)
      .gte('token_expires_at', new Date().toISOString())
      .single()

    if (findError || !connection) {
      console.error('❌ Token not found:', findError)
      return false
    }

    // Update with doctor information
    const { data: updatedConnection, error: updateError } = await supabase
      .from('patient_doctor_connections')
      .update({
        doctor_firebase_uid: testDoctorUid,
        last_accessed_at: new Date().toISOString(),
        access_count: 1
      })
      .eq('id', connection.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Token usage failed:', updateError)
      return false
    }

    console.log('✅ Token used successfully by doctor')
    return true

  } catch (error) {
    console.error('❌ Token usage exception:', error)
    return false
  }
}

async function testDashboardQuery() {
  console.log('\n📊 Testing doctor dashboard query...')
  
  try {
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
      .eq('doctor_firebase_uid', testDoctorUid)
      .eq('is_active', true)
      .gte('token_expires_at', new Date().toISOString())
      .order('last_accessed_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('❌ Dashboard query failed:', error)
      return false
    }

    console.log('✅ Dashboard query successful')
    console.log('📋 Connected patients:', data.length)
    
    if (data.length > 0) {
      data.forEach((connection, index) => {
        console.log(`   ${index + 1}. ${connection.patient?.full_name || 'Unknown'} (${connection.patient?.email || 'No email'})`)
        console.log(`      Token: ${connection.access_token}`)
        console.log(`      Access count: ${connection.access_count || 0}`)
        console.log(`      Last accessed: ${connection.last_accessed_at || 'Never'}`)
      })
    }

    return data.length > 0

  } catch (error) {
    console.error('❌ Dashboard query exception:', error)
    return false
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')
  
  try {
    // Delete connections
    await supabase
      .from('patient_doctor_connections')
      .delete()
      .or(`patient_firebase_uid.eq.${testPatientUid},doctor_firebase_uid.eq.${testDoctorUid}`)

    // Delete profiles
    await supabase
      .from('profiles')
      .delete()
      .in('firebase_uid', [testPatientUid, testDoctorUid])

    console.log('✅ Cleanup completed')

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

async function runDashboardSyncTest() {
  console.log('🚀 Starting Doctor Dashboard Synchronization Test...\n')
  
  const setupSuccess = await setupTestData()
  if (!setupSuccess) {
    console.log('❌ Setup failed, aborting test')
    return
  }

  const accessToken = await testTokenGeneration()
  if (!accessToken) {
    console.log('❌ Token generation failed, aborting test')
    await cleanup()
    return
  }

  const tokenUsageSuccess = await testTokenUsage(accessToken)
  if (!tokenUsageSuccess) {
    console.log('❌ Token usage failed, aborting test')
    await cleanup()
    return
  }

  const dashboardQuerySuccess = await testDashboardQuery()
  
  await cleanup()

  console.log('\n📊 Test Results:')
  console.log(`✅ Setup: ${setupSuccess ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Token Generation: ${accessToken ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Token Usage: ${tokenUsageSuccess ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Dashboard Query: ${dashboardQuerySuccess ? 'PASS' : 'FAIL'}`)

  if (setupSuccess && accessToken && tokenUsageSuccess && dashboardQuerySuccess) {
    console.log('\n🎉 All dashboard synchronization tests PASSED!')
    console.log('💡 The token sharing and dashboard sync should work correctly in the UI.')
  } else {
    console.log('\n⚠️  Some tests FAILED. Please check the issues above.')
  }
}

// Run the test
runDashboardSyncTest().catch(console.error)
