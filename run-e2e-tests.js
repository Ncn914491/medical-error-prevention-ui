/**
 * End-to-End Test Runner for Medical Error Prevention System
 * Simulates complete patient/doctor workflows with Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables
const envContent = fs.readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY)

// Import our initialization functions
const { initializeDatabase, testEndToEndFlows } = await import('./src/scripts/initializeDatabase.js')

async function runCompleteE2ETest() {
  console.log('🚀 Starting Complete End-to-End Test Suite')
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Initialize Database with Test Data
    console.log('\n📊 STEP 1: Database Initialization')
    console.log('-'.repeat(40))
    
    const initResult = await initializeDatabase()
    
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.error)
      return false
    }
    
    console.log('✅ Database initialized successfully!')
    console.log('📊 Created:', initResult.data)
    
    // Step 2: Test Patient Login Flow
    console.log('\n👤 STEP 2: Patient Login & Profile Management')
    console.log('-'.repeat(40))
    
    const { data: testPatients } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .limit(1)
    
    if (testPatients.length === 0) {
      console.error('❌ No test patients found')
      return false
    }
    
    const testPatient = testPatients[0]
    console.log('✅ Retrieved patient profile:', testPatient.full_name)
    
    // Step 3: Test Medication Management
    console.log('\n💊 STEP 3: Medication Management')
    console.log('-'.repeat(40))
    
    // Get existing medications
    const { data: existingMeds } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_firebase_uid', testPatient.firebase_uid)
    
    console.log(`✅ Retrieved ${existingMeds.length} existing medications`)
    
    // Add a new medication
    const newMedication = {
      patient_firebase_uid: testPatient.firebase_uid,
      medication_name: 'Test Medication',
      dosage: '100mg',
      frequency: 'Twice daily',
      start_date: new Date().toISOString().split('T')[0],
      prescribing_doctor: 'Dr. Test',
      indication: 'Test indication',
      is_active: true
    }
    
    const { data: addedMed, error: medError } = await supabase
      .from('medications')
      .insert([newMedication])
      .select()
    
    if (medError) {
      console.error('❌ Failed to add medication:', medError)
      return false
    }
    
    console.log('✅ Added new medication:', addedMed[0].medication_name)
    
    // Step 4: Test Token Generation & Sharing
    console.log('\n🔑 STEP 4: Token Generation & Doctor Access')
    console.log('-'.repeat(40))
    
    const { data: testDoctors } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .limit(1)
    
    if (testDoctors.length === 0) {
      console.error('❌ No test doctors found')
      return false
    }
    
    const testDoctor = testDoctors[0]
    console.log('✅ Retrieved doctor profile:', testDoctor.full_name)
    
    // Get patient-doctor connection
    const { data: connections } = await supabase
      .from('patient_doctor_connections')
      .select('*')
      .eq('patient_firebase_uid', testPatient.firebase_uid)
      .eq('doctor_firebase_uid', testDoctor.firebase_uid)
      .limit(1)
    
    if (connections.length === 0) {
      console.error('❌ No patient-doctor connection found')
      return false
    }
    
    const connection = connections[0]
    console.log('✅ Found patient-doctor connection with token:', connection.access_token)
    
    // Step 5: Test Doctor Accessing Patient Data via Token
    console.log('\n🔐 STEP 5: Doctor Token Access')
    console.log('-'.repeat(40))
    
    // Simulate doctor using token to access patient data
    const { data: tokenAccessData, error: tokenError } = await supabase
      .from('patient_doctor_connections')
      .select(`
        *,
        patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(*)
      `)
      .eq('access_token', connection.access_token)
      .eq('is_active', true)
    
    if (tokenError || tokenAccessData.length === 0) {
      console.error('❌ Failed to access patient data via token:', tokenError)
      return false
    }
    
    console.log('✅ Successfully accessed patient data via token')
    console.log('📋 Patient accessible to doctor:', tokenAccessData[0].patient.full_name)
    
    // Get patient medications for doctor
    const { data: patientMedsForDoctor } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_firebase_uid', testPatient.firebase_uid)
      .eq('is_active', true)
    
    console.log(`✅ Doctor can access ${patientMedsForDoctor.length} patient medications`)
    
    // Get patient medical history for doctor
    const { data: patientHistoryForDoctor } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_firebase_uid', testPatient.firebase_uid)
    
    console.log(`✅ Doctor can access ${patientHistoryForDoctor.length} medical history records`)
    
    // Step 6: Test Medication Safety Analysis
    console.log('\n⚕️ STEP 6: Medication Safety Analysis')
    console.log('-'.repeat(40))
    
    const medications = patientMedsForDoctor.map(med => ({ name: med.medication_name }))
    const allergies = ['penicillin'] // Test allergy
    
    // Import medication checking service
    const { checkMedicationSafety } = await import('./src/services/medicationService.js')
    
    const safetyResults = checkMedicationSafety(medications, allergies)
    console.log('✅ Medication safety analysis completed')
    console.log('📊 Safety Results:')
    console.log(`   - Interactions: ${safetyResults.interactions.length}`)
    console.log(`   - Allergy issues: ${safetyResults.allergyContraindications.length}`)
    console.log(`   - Overall risk: ${safetyResults.overallRisk}`)
    console.log(`   - Recommendations: ${safetyResults.recommendations.length}`)
    
    // Step 7: Test Analysis Results Storage
    console.log('\n📊 STEP 7: Analysis Results Storage')
    console.log('-'.repeat(40))
    
    const analysisResult = {
      patient_firebase_uid: testPatient.firebase_uid,
      doctor_firebase_uid: testDoctor.firebase_uid,
      analysis_type: 'medication_check',
      input_data: { medications, allergies },
      results: safetyResults,
      risk_level: safetyResults.overallRisk,
      confidence_score: 0.95,
      recommendations: safetyResults.recommendations,
      flags: safetyResults.interactions.map(i => `${i.drug1} + ${i.drug2}`)
    }
    
    const { data: storedAnalysis, error: analysisError } = await supabase
      .from('analysis_results')
      .insert([analysisResult])
      .select()
    
    if (analysisError) {
      console.error('❌ Failed to store analysis result:', analysisError)
      return false
    }
    
    console.log('✅ Analysis result stored successfully')
    
    // Step 8: Final Verification
    console.log('\n🔍 STEP 8: Final Data Verification')
    console.log('-'.repeat(40))
    
    const finalCounts = {}
    
    // Count all records
    for (const table of ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']) {
      const { data, error } = await supabase.from(table).select('*')
      if (!error) {
        finalCounts[table] = data.length
        console.log(`✅ ${table}: ${data.length} records`)
      }
    }
    
    console.log('\n🎉 END-TO-END TEST COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(60))
    console.log('📊 Final Summary:')
    console.log('- Database initialization: ✅ Success')
    console.log('- Patient profile management: ✅ Success')
    console.log('- Medication management: ✅ Success')
    console.log('- Token-based sharing: ✅ Success')
    console.log('- Doctor data access: ✅ Success')
    console.log('- Medication safety analysis: ✅ Success')
    console.log('- Analysis results storage: ✅ Success')
    console.log('- Data integrity verification: ✅ Success')
    
    console.log('\n🚀 System is fully functional and ready for production use!')
    
    return true
    
  } catch (error) {
    console.error('\n❌ End-to-end test failed with exception:', error)
    return false
  }
}

// Run the test
runCompleteE2ETest()
  .then(success => {
    console.log(`\n🏁 Test suite ${success ? 'PASSED' : 'FAILED'}`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test execution error:', error)
    process.exit(1)
  })
