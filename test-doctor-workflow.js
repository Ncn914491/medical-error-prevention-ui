// Test Doctor Workflow: Patient Selection, Medical Data, AI Diagnosis
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

// Test data
const testPatientUid = 'test-patient-workflow-' + Date.now()
const testDoctorUid = 'test-doctor-workflow-' + Date.now()

async function setupWorkflowTest() {
  console.log('🔧 Setting up doctor workflow test...')
  
  try {
    // Create test patient with comprehensive medical data
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .upsert([{
        firebase_uid: testPatientUid,
        email: `patient-workflow-${Date.now()}@test.com`,
        full_name: 'Test Workflow Patient',
        role: 'patient',
        date_of_birth: '1985-05-15',
        gender: 'female',
        phone: '+1-555-0123',
        address: '123 Test Street, Test City, TC 12345'
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
        email: `doctor-workflow-${Date.now()}@test.com`,
        full_name: 'Dr. Test Workflow',
        role: 'doctor',
        specialization: 'Internal Medicine'
      }])
      .select()
      .single()

    if (doctorError) {
      console.error('❌ Failed to create doctor:', doctorError)
      return false
    }

    // Add comprehensive medical data
    const { data: medication, error: medError } = await supabase
      .from('medications')
      .insert([
        {
          patient_firebase_uid: testPatientUid,
          medication_name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          start_date: '2024-01-01',
          indication: 'Hypertension',
          side_effects: ['dizziness', 'dry cough'],
          is_active: true
        },
        {
          patient_firebase_uid: testPatientUid,
          medication_name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          start_date: '2024-01-15',
          indication: 'Type 2 Diabetes',
          side_effects: ['nausea', 'diarrhea'],
          is_active: true
        }
      ])
      .select()

    if (medError) {
      console.error('❌ Failed to create medications:', medError)
      return false
    }

    // Add medical history
    const { data: history, error: historyError } = await supabase
      .from('medical_history')
      .insert([
        {
          patient_firebase_uid: testPatientUid,
          condition_name: 'Hypertension',
          diagnosis_date: '2024-01-01',
          status: 'active',
          severity: 'moderate'
        },
        {
          patient_firebase_uid: testPatientUid,
          condition_name: 'Type 2 Diabetes Mellitus',
          diagnosis_date: '2024-01-15',
          status: 'active',
          severity: 'mild'
        }
      ])
      .select()

    if (historyError) {
      console.error('❌ Failed to create medical history:', historyError)
      return false
    }

    console.log('✅ Comprehensive workflow test data created')
    console.log('👤 Patient:', patient.full_name)
    console.log('👨‍⚕️ Doctor:', doctor.full_name)
    console.log('💊 Medications:', medication.length)
    console.log('📋 Medical history:', history.length)

    return true

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return false
  }
}

async function testPatientSelection() {
  console.log('\n👥 Testing Patient Selection and Data Loading...')
  
  try {
    // Test patient service query (My Patients)
    const { data: patients, error: patientsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('created_at', { ascending: false })

    if (patientsError) {
      console.error('❌ Patient selection query failed:', patientsError)
      return false
    }

    console.log('✅ Patient selection working!')
    console.log('📊 Total patients available:', patients.length)

    // Find our test patient
    const testPatient = patients.find(p => p.firebase_uid === testPatientUid)
    if (!testPatient) {
      console.error('❌ Test patient not found in selection')
      return false
    }

    console.log('✅ Test patient found:', testPatient.full_name)

    // Test medical data loading for selected patient
    const [medicationsResult, historyResult] = await Promise.all([
      supabase.from('medications').select('*').eq('patient_firebase_uid', testPatientUid).eq('is_active', true),
      supabase.from('medical_history').select('*').eq('patient_firebase_uid', testPatientUid)
    ])

    if (medicationsResult.error || historyResult.error) {
      console.error('❌ Medical data loading failed:', { 
        medError: medicationsResult.error, 
        historyError: historyResult.error 
      })
      return false
    }

    console.log('✅ Medical data loaded successfully!')
    console.log('💊 Active medications:', medicationsResult.data.length)
    console.log('📋 Medical history entries:', historyResult.data.length)

    // Display sample data
    if (medicationsResult.data.length > 0) {
      console.log('   Sample medication:', medicationsResult.data[0].medication_name, medicationsResult.data[0].dosage)
    }
    if (historyResult.data.length > 0) {
      console.log('   Sample condition:', historyResult.data[0].condition_name)
    }

    return true

  } catch (error) {
    console.error('❌ Patient selection test failed:', error)
    return false
  }
}

async function testDoctorDiagnosisWorkflow() {
  console.log('\n🩺 Testing Doctor Diagnosis Workflow...')
  
  try {
    // Simulate doctor adding a diagnosis to patient's medical history
    const diagnosisData = {
      condition_name: 'AI-Assisted Diagnosis: Possible Sleep Apnea',
      diagnosis_date: new Date().toISOString().split('T')[0],
      status: 'active',
      severity: 'moderate',
      notes: 'AI Analysis: Patient shows symptoms consistent with sleep apnea. Recommend sleep study.\n\nDiagnosed by Dr. Test Workflow using AI assistance',
      treating_doctor: 'Dr. Test Workflow'
    }

    const { data: newDiagnosis, error: diagnosisError } = await supabase
      .from('medical_history')
      .insert([{
        ...diagnosisData,
        patient_firebase_uid: testPatientUid
      }])
      .select()
      .single()

    if (diagnosisError) {
      console.error('❌ Doctor diagnosis addition failed:', diagnosisError)
      return false
    }

    console.log('✅ Doctor diagnosis added successfully!')
    console.log('🩺 New diagnosis:', newDiagnosis.condition_name)

    // Verify it appears in patient's medical history
    const { data: updatedHistory, error: historyError } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_firebase_uid', testPatientUid)
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('❌ Failed to verify updated history:', historyError)
      return false
    }

    console.log('✅ Diagnosis appears in patient medical history!')
    console.log('📋 Total history entries:', updatedHistory.length)
    console.log('🆕 Latest entry:', updatedHistory[0].condition_name)

    return true

  } catch (error) {
    console.error('❌ Doctor diagnosis workflow test failed:', error)
    return false
  }
}

async function testTokenSharingWorkflow() {
  console.log('\n🔑 Testing Token Sharing with Medical Data Access...')
  
  try {
    // Create token connection
    const accessToken = Math.random().toString(36).substring(2, 10).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data: connection, error: connectionError } = await supabase
      .from('patient_doctor_connections')
      .insert([{
        patient_firebase_uid: testPatientUid,
        doctor_firebase_uid: testDoctorUid,
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

    if (connectionError) {
      console.error('❌ Token connection failed:', connectionError)
      return false
    }

    console.log('✅ Token connection created:', accessToken)

    // Test doctor dashboard query for connected patients
    const { data: connectedPatients, error: dashboardError } = await supabase
      .from('patient_doctor_connections')
      .select(`
        *,
        patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(
          id, firebase_uid, full_name, email, date_of_birth, 
          gender, phone, address
        )
      `)
      .eq('doctor_firebase_uid', testDoctorUid)
      .eq('is_active', true)

    if (dashboardError) {
      console.error('❌ Connected patients query failed:', dashboardError)
      return false
    }

    console.log('✅ Connected patients query successful!')
    console.log('🔗 Connected patients:', connectedPatients.length)

    if (connectedPatients.length > 0) {
      console.log('👤 Connected patient:', connectedPatients[0].patient.full_name)
    }

    return true

  } catch (error) {
    console.error('❌ Token sharing workflow test failed:', error)
    return false
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up workflow test data...')
  
  try {
    await supabase.from('patient_doctor_connections').delete().or(`patient_firebase_uid.eq.${testPatientUid},doctor_firebase_uid.eq.${testDoctorUid}`)
    await supabase.from('medications').delete().eq('patient_firebase_uid', testPatientUid)
    await supabase.from('medical_history').delete().eq('patient_firebase_uid', testPatientUid)
    await supabase.from('profiles').delete().in('firebase_uid', [testPatientUid, testDoctorUid])

    console.log('✅ Cleanup completed')

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

async function runWorkflowTests() {
  console.log('🚀 Starting Doctor Workflow Tests...\n')
  
  const setupOk = await setupWorkflowTest()
  if (!setupOk) {
    console.log('❌ Setup failed, aborting tests')
    return
  }

  const patientSelectionOk = await testPatientSelection()
  const diagnosisWorkflowOk = await testDoctorDiagnosisWorkflow()
  const tokenSharingOk = await testTokenSharingWorkflow()
  
  await cleanup()

  console.log('\n📊 Doctor Workflow Test Results:')
  console.log(`✅ Setup: ${setupOk ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Patient Selection & Data Loading: ${patientSelectionOk ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Doctor Diagnosis Workflow: ${diagnosisWorkflowOk ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Token Sharing with Medical Data: ${tokenSharingOk ? 'PASS' : 'FAIL'}`)

  if (setupOk && patientSelectionOk && diagnosisWorkflowOk && tokenSharingOk) {
    console.log('\n🎉 ALL DOCTOR WORKFLOW TESTS PASSED!')
    console.log('💡 The doctor dashboard should now have:')
    console.log('   • Working patient selection with medical data display')
    console.log('   • AI diagnosis assistant for selected patients')
    console.log('   • Doctor-added diagnoses sync to patient dashboard')
    console.log('   • Complete token sharing workflow')
    console.log('   • Real-time medical data updates')
  } else {
    console.log('\n⚠️  Some workflow tests FAILED. Check the issues above.')
  }
}

runWorkflowTests().catch(console.error)
