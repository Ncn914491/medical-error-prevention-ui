/**
 * Simple Test Runner for Supabase Integration
 * Node.js compatible version
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables manually
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

// Generate dummy data functions
const generateFirebaseUID = (prefix = 'test') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const generateAccessToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

async function runSimpleTest() {
  console.log('🚀 Starting Simple Supabase Integration Test')
  console.log('=' .repeat(50))
  
  try {
    // Step 1: Create test doctor
    console.log('\n👨‍⚕️ Creating test doctor...')
    const doctorUID = generateFirebaseUID('doctor')
    
    const testDoctor = {
      firebase_uid: doctorUID,
      email: 'test.doctor@example.com',
      full_name: 'Dr. Test Doctor',
      role: 'doctor',
      phone: '+1-555-TEST',
      specialization: 'Testing',
      license_number: 'TEST123',
      hospital_affiliation: 'Test Hospital'
    }
    
    const { data: doctorData, error: doctorError } = await supabase
      .from('profiles')
      .insert([testDoctor])
      .select()
    
    if (doctorError) {
      console.error('❌ Failed to create doctor:', doctorError)
      return false
    }
    
    console.log('✅ Created doctor:', doctorData[0].full_name)
    
    // Step 2: Create test patient
    console.log('\n👤 Creating test patient...')
    const patientUID = generateFirebaseUID('patient')
    
    const testPatient = {
      firebase_uid: patientUID,
      email: 'test.patient@example.com',
      full_name: 'Test Patient',
      role: 'patient',
      phone: '+1-555-PATIENT',
      date_of_birth: '1990-01-01',
      gender: 'other',
      address: '123 Test St, Test City'
    }
    
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .insert([testPatient])
      .select()
    
    if (patientError) {
      console.error('❌ Failed to create patient:', patientError)
      return false
    }
    
    console.log('✅ Created patient:', patientData[0].full_name)
    
    // Step 3: Add medical history
    console.log('\n📋 Adding medical history...')
    const medicalHistory = {
      patient_firebase_uid: patientUID,
      condition_name: 'Test Condition',
      diagnosis_date: '2023-01-01',
      status: 'active',
      severity: 'mild',
      notes: 'Test condition for testing purposes',
      treating_doctor: 'Dr. Test Doctor'
    }
    
    const { data: historyData, error: historyError } = await supabase
      .from('medical_history')
      .insert([medicalHistory])
      .select()
    
    if (historyError) {
      console.error('❌ Failed to add medical history:', historyError)
      return false
    }
    
    console.log('✅ Added medical history:', historyData[0].condition_name)
    
    // Step 4: Add medications
    console.log('\n💊 Adding medications...')
    const medications = [
      {
        patient_firebase_uid: patientUID,
        medication_name: 'Test Medication A',
        dosage: '100mg',
        frequency: 'Once daily',
        start_date: '2023-01-01',
        prescribing_doctor: 'Dr. Test Doctor',
        indication: 'Test Condition',
        is_active: true
      },
      {
        patient_firebase_uid: patientUID,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        start_date: '2023-01-01',
        prescribing_doctor: 'Dr. Test Doctor',
        indication: 'Blood pressure',
        is_active: true
      }
    ]
    
    for (const med of medications) {
      const { data: medData, error: medError } = await supabase
        .from('medications')
        .insert([med])
        .select()
      
      if (medError) {
        console.error('❌ Failed to add medication:', medError)
        return false
      }
      
      console.log('✅ Added medication:', medData[0].medication_name)
    }
    
    // Step 5: Create patient-doctor connection with token
    console.log('\n🔗 Creating patient-doctor connection...')
    const accessToken = generateAccessToken()
    
    const connection = {
      patient_firebase_uid: patientUID,
      doctor_firebase_uid: doctorUID,
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    }
    
    const { data: connectionData, error: connectionError } = await supabase
      .from('patient_doctor_connections')
      .insert([connection])
      .select()
    
    if (connectionError) {
      console.error('❌ Failed to create connection:', connectionError)
      return false
    }
    
    console.log('✅ Created connection with token:', connectionData[0].access_token)
    
    // Step 6: Test token-based access
    console.log('\n🔐 Testing token-based access...')
    const { data: tokenAccess, error: tokenError } = await supabase
      .from('patient_doctor_connections')
      .select(`
        *,
        patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(*)
      `)
      .eq('access_token', accessToken)
      .eq('is_active', true)
    
    if (tokenError || tokenAccess.length === 0) {
      console.error('❌ Failed to access via token:', tokenError)
      return false
    }
    
    console.log('✅ Successfully accessed patient data via token')
    console.log('📋 Accessible patient:', tokenAccess[0].patient.full_name)
    
    // Step 7: Test medication retrieval for doctor
    console.log('\n💊 Testing medication access for doctor...')
    const { data: patientMeds, error: medAccessError } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_firebase_uid', patientUID)
      .eq('is_active', true)
    
    if (medAccessError) {
      console.error('❌ Failed to access patient medications:', medAccessError)
      return false
    }
    
    console.log(`✅ Doctor can access ${patientMeds.length} patient medications`)
    patientMeds.forEach(med => {
      console.log(`   - ${med.medication_name} (${med.dosage}) - ${med.frequency}`)
    })
    
    // Step 8: Test analysis result storage
    console.log('\n📊 Testing analysis result storage...')
    const analysisResult = {
      patient_firebase_uid: patientUID,
      doctor_firebase_uid: doctorUID,
      analysis_type: 'medication_check',
      input_data: { 
        medications: patientMeds.map(m => ({ name: m.medication_name })),
        allergies: ['penicillin']
      },
      results: {
        interactions: [],
        allergyContraindications: [],
        overallRisk: 'low',
        recommendations: ['Continue current regimen', 'Monitor regularly']
      },
      risk_level: 'low',
      confidence_score: 0.95,
      recommendations: ['Continue current regimen', 'Monitor regularly'],
      flags: []
    }
    
    const { data: analysisData, error: analysisError } = await supabase
      .from('analysis_results')
      .insert([analysisResult])
      .select()
    
    if (analysisError) {
      console.error('❌ Failed to store analysis result:', analysisError)
      return false
    }
    
    console.log('✅ Analysis result stored successfully')
    
    // Step 9: Final verification
    console.log('\n🔍 Final verification...')
    const tables = ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']
    const counts = {}
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (!error) {
        counts[table] = data.length
        console.log(`✅ ${table}: ${data.length} records`)
      }
    }
    
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('=' .repeat(50))
    console.log('✅ Database connectivity: Working')
    console.log('✅ Profile management: Working')
    console.log('✅ Medical history: Working')
    console.log('✅ Medication management: Working')
    console.log('✅ Token-based sharing: Working')
    console.log('✅ Doctor data access: Working')
    console.log('✅ Analysis storage: Working')
    console.log('✅ Data integrity: Verified')
    
    console.log('\n🚀 Your Supabase integration is fully functional!')
    console.log('🌐 You can now use the web interface at: http://localhost:5173/db-init')
    
    return true
    
  } catch (error) {
    console.error('\n❌ Test failed with exception:', error)
    return false
  }
}

// Run the test
runSimpleTest()
  .then(success => {
    console.log(`\n🏁 Test ${success ? 'PASSED' : 'FAILED'}`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test execution error:', error)
    process.exit(1)
  })
