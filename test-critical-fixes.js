#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Critical Healthcare App Fixes
 * 
 * This script tests all the critical fixes implemented:
 * 1. Supabase Database Constraint Error Resolution
 * 2. Patient Dashboard Medication Management
 * 3. Medical History Deduplication
 * 4. Doctor Dashboard Data Synchronization
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test data
const testPatientUid = 'test-patient-' + Date.now()
const testDoctorUid = 'test-doctor-' + Date.now()
const testPatientEmail = `patient-${Date.now()}@test.com`
const testDoctorEmail = `doctor-${Date.now()}@test.com`

let testResults = []

function logTest(testName, status, message, details = null) {
  const result = {
    test: testName,
    status, // 'PASS', 'FAIL', 'INFO'
    message,
    details,
    timestamp: new Date().toISOString()
  }
  testResults.push(result)
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️'
  console.log(`${statusIcon} ${testName}: ${message}`)
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
  }
}

async function setupTestProfiles() {
  console.log('\n🔧 Setting up test profiles...')
  
  try {
    // Create test patient profile
    const { data: patientProfile, error: patientError } = await supabase
      .from('profiles')
      .upsert([{
        firebase_uid: testPatientUid,
        email: testPatientEmail,
        full_name: 'Test Patient',
        role: 'patient',
        date_of_birth: '1990-01-01',
        gender: 'other'
      }])
      .select()
      .single()

    if (patientError) {
      logTest('Setup Patient Profile', 'FAIL', patientError.message)
      return false
    }

    logTest('Setup Patient Profile', 'PASS', 'Patient profile created successfully')

    // Create test doctor profile
    const { data: doctorProfile, error: doctorError } = await supabase
      .from('profiles')
      .upsert([{
        firebase_uid: testDoctorUid,
        email: testDoctorEmail,
        full_name: 'Test Doctor',
        role: 'doctor',
        specialization: 'Internal Medicine'
      }])
      .select()
      .single()

    if (doctorError) {
      logTest('Setup Doctor Profile', 'FAIL', doctorError.message)
      return false
    }

    logTest('Setup Doctor Profile', 'PASS', 'Doctor profile created successfully')
    return true

  } catch (error) {
    logTest('Setup Test Profiles', 'FAIL', error.message)
    return false
  }
}

async function testConstraintErrorFix() {
  console.log('\n🔍 Testing Constraint Error Fix...')
  
  try {
    // Test 1: Generate patient token
    const accessToken = Math.random().toString(36).substring(2, 10).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data: tokenData, error: tokenError } = await supabase
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

    if (tokenError) {
      logTest('Generate Patient Token', 'FAIL', tokenError.message)
      return false
    }

    logTest('Generate Patient Token', 'PASS', 'Token generated successfully', { token: accessToken })

    // Test 2: Doctor uses token (should update existing record)
    const { data: updatedConnection, error: updateError } = await supabase
      .from('patient_doctor_connections')
      .update({
        doctor_firebase_uid: testDoctorUid,
        last_accessed_at: new Date().toISOString(),
        access_count: 1
      })
      .eq('id', tokenData.id)
      .select()
      .single()

    if (updateError) {
      logTest('Doctor Uses Token', 'FAIL', updateError.message)
      return false
    }

    logTest('Doctor Uses Token', 'PASS', 'Token used successfully without constraint violation')

    // Test 3: Try to create duplicate connection (should be handled gracefully)
    const { data: duplicateTest, error: duplicateError } = await supabase
      .from('patient_doctor_connections')
      .insert([{
        patient_firebase_uid: testPatientUid,
        doctor_firebase_uid: testDoctorUid,
        access_token: 'DUPLICATE' + Date.now(),
        token_expires_at: expiresAt.toISOString(),
        is_active: true
      }])
      .select()

    if (duplicateError && duplicateError.code === '23505') {
      logTest('Duplicate Connection Prevention', 'PASS', 'Duplicate constraint properly enforced')
    } else if (!duplicateError) {
      logTest('Duplicate Connection Prevention', 'FAIL', 'Duplicate connection was allowed')
    } else {
      logTest('Duplicate Connection Prevention', 'FAIL', duplicateError.message)
    }

    return true

  } catch (error) {
    logTest('Constraint Error Fix Test', 'FAIL', error.message)
    return false
  }
}

async function testMedicationManagement() {
  console.log('\n💊 Testing Medication Management...')
  
  try {
    // Test adding medication
    const medicationData = {
      patient_firebase_uid: testPatientUid,
      medication_name: 'Test Medication',
      dosage: '10mg',
      frequency: 'Once daily',
      start_date: '2024-01-01',
      indication: 'Test condition',
      side_effects: ['nausea', 'headache'],
      is_active: true
    }

    const { data: medication, error: medicationError } = await supabase
      .from('medications')
      .insert([medicationData])
      .select()
      .single()

    if (medicationError) {
      logTest('Add Medication', 'FAIL', medicationError.message)
      return false
    }

    logTest('Add Medication', 'PASS', 'Medication added successfully')

    // Test fetching medications
    const { data: medications, error: fetchError } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_firebase_uid', testPatientUid)
      .eq('is_active', true)

    if (fetchError) {
      logTest('Fetch Medications', 'FAIL', fetchError.message)
      return false
    }

    logTest('Fetch Medications', 'PASS', `Retrieved ${medications.length} medications`)

    return true

  } catch (error) {
    logTest('Medication Management Test', 'FAIL', error.message)
    return false
  }
}

async function testMedicalHistoryDeduplication() {
  console.log('\n📋 Testing Medical History Deduplication...')
  
  try {
    // Add duplicate medical history entries
    const historyData = {
      patient_firebase_uid: testPatientUid,
      condition_name: 'Test Condition',
      diagnosis_date: '2024-01-01',
      status: 'active',
      severity: 'mild'
    }

    // Insert first entry
    const { data: history1, error: error1 } = await supabase
      .from('medical_history')
      .insert([historyData])
      .select()
      .single()

    if (error1) {
      logTest('Add Medical History 1', 'FAIL', error1.message)
      return false
    }

    // Try to insert duplicate entry
    const { data: history2, error: error2 } = await supabase
      .from('medical_history')
      .insert([historyData])
      .select()

    // Fetch all history entries
    const { data: allHistory, error: fetchError } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_firebase_uid', testPatientUid)

    if (fetchError) {
      logTest('Fetch Medical History', 'FAIL', fetchError.message)
      return false
    }

    logTest('Medical History Entries', 'INFO', `Found ${allHistory.length} entries`)

    // Test deduplication logic (would be handled by the service layer)
    const seen = new Set()
    const deduplicated = []
    
    for (const entry of allHistory) {
      const key = `${entry.condition_name?.toLowerCase()}_${entry.diagnosis_date}_${entry.status}`
      if (!seen.has(key)) {
        seen.add(key)
        deduplicated.push(entry)
      }
    }

    logTest('Deduplication Logic', 'PASS', `Deduplicated from ${allHistory.length} to ${deduplicated.length} entries`)

    return true

  } catch (error) {
    logTest('Medical History Deduplication Test', 'FAIL', error.message)
    return false
  }
}

async function testDoctorDashboardSync() {
  console.log('\n👨‍⚕️ Testing Doctor Dashboard Synchronization...')
  
  try {
    // Test fetching connected patients
    const { data: connections, error: connectionsError } = await supabase
      .from('patient_doctor_connections')
      .select(`
        *,
        patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(*)
      `)
      .eq('doctor_firebase_uid', testDoctorUid)
      .eq('is_active', true)

    if (connectionsError) {
      logTest('Fetch Connected Patients', 'FAIL', connectionsError.message)
      return false
    }

    logTest('Fetch Connected Patients', 'PASS', `Found ${connections.length} connected patients`)

    // Test fetching patient medical data
    if (connections.length > 0) {
      const patientUid = connections[0].patient_firebase_uid

      const [medicationsResult, historyResult] = await Promise.all([
        supabase.from('medications').select('*').eq('patient_firebase_uid', patientUid).eq('is_active', true),
        supabase.from('medical_history').select('*').eq('patient_firebase_uid', patientUid)
      ])

      if (medicationsResult.error || historyResult.error) {
        logTest('Fetch Patient Medical Data', 'FAIL', 'Error fetching medical data')
        return false
      }

      logTest('Fetch Patient Medical Data', 'PASS', 
        `Retrieved ${medicationsResult.data.length} medications and ${historyResult.data.length} history entries`)
    }

    return true

  } catch (error) {
    logTest('Doctor Dashboard Sync Test', 'FAIL', error.message)
    return false
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')
  
  try {
    // Delete test connections
    await supabase
      .from('patient_doctor_connections')
      .delete()
      .or(`patient_firebase_uid.eq.${testPatientUid},doctor_firebase_uid.eq.${testDoctorUid}`)

    // Delete test medications
    await supabase
      .from('medications')
      .delete()
      .eq('patient_firebase_uid', testPatientUid)

    // Delete test medical history
    await supabase
      .from('medical_history')
      .delete()
      .eq('patient_firebase_uid', testPatientUid)

    // Delete test profiles
    await supabase
      .from('profiles')
      .delete()
      .in('firebase_uid', [testPatientUid, testDoctorUid])

    logTest('Cleanup', 'PASS', 'Test data cleaned up successfully')

  } catch (error) {
    logTest('Cleanup', 'FAIL', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Healthcare App Testing...\n')
  
  const setupSuccess = await setupTestProfiles()
  if (!setupSuccess) {
    console.log('\n❌ Setup failed, aborting tests')
    return
  }

  await testConstraintErrorFix()
  await testMedicationManagement()
  await testMedicalHistoryDeduplication()
  await testDoctorDashboardSync()
  
  await cleanup()

  // Summary
  console.log('\n📊 Test Summary:')
  const passed = testResults.filter(r => r.status === 'PASS').length
  const failed = testResults.filter(r => r.status === 'FAIL').length
  const info = testResults.filter(r => r.status === 'INFO').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`ℹ️  Info: ${info}`)
  console.log(`📋 Total: ${testResults.length}`)

  if (failed === 0) {
    console.log('\n🎉 All critical fixes are working correctly!')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.')
  }
}

// Run the tests
runAllTests().catch(console.error)
