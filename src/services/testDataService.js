import { supabase } from '../lib/supabase'
import { firebaseAuth } from '../lib/firebase'

// Test user credentials for easy access
export const TEST_USERS = {
  doctors: [
    {
      email: 'dr.smith@medsafe.com',
      password: 'Doctor123!',
      profile: {
        full_name: 'Dr. Sarah Smith',
        role: 'doctor',
        phone: '+1-555-0101',
        specialization: 'Internal Medicine',
        license_number: 'MD-12345-NY',
        hospital_affiliation: 'MedSafe General Hospital',
        bio: 'Board-certified internist with 15+ years of experience in primary care and preventive medicine.'
      }
    },
    {
      email: 'dr.johnson@medsafe.com',
      password: 'Doctor123!',
      profile: {
        full_name: 'Dr. Michael Johnson',
        role: 'doctor',
        phone: '+1-555-0102',
        specialization: 'Cardiology',
        license_number: 'MD-67890-CA',
        hospital_affiliation: 'Heart & Vascular Institute',
        bio: 'Experienced cardiologist specializing in interventional cardiology and heart disease prevention.'
      }
    }
  ],
  patients: [
    {
      email: 'john.doe@email.com',
      password: 'Patient123!',
      profile: {
        full_name: 'John Doe',
        role: 'patient',
        phone: '+1-555-0201',
        date_of_birth: '1985-07-10',
        gender: 'male',
        address: '789 Main St, Anytown, AT 54321'
      }
    },
    {
      email: 'jane.smith@email.com',
      password: 'Patient123!',
      profile: {
        full_name: 'Jane Smith',
        role: 'patient',
        phone: '+1-555-0202',
        date_of_birth: '1992-02-28',
        gender: 'female',
        address: '321 Oak Ave, Somewhere, SW 98765'
      }
    },
    {
      email: 'robert.wilson@email.com',
      password: 'Patient123!',
      profile: {
        full_name: 'Robert Wilson',
        role: 'patient',
        phone: '+1-555-0203',
        date_of_birth: '1978-12-05',
        gender: 'male',
        address: '654 Pine St, Elsewhere, EW 13579'
      }
    },
    {
      email: 'maria.garcia@email.com',
      password: 'Patient123!',
      profile: {
        full_name: 'Maria Garcia',
        role: 'patient',
        phone: '+1-555-0204',
        date_of_birth: '1990-09-18',
        gender: 'female',
        address: '987 Elm Dr, Nowhere, NW 24680'
      }
    }
  ]
}

// Sample medical data
export const SAMPLE_MEDICAL_DATA = {
  'john.doe@email.com': {
    medical_history: [
      {
        condition_name: 'Hypertension',
        diagnosis_date: '2020-03-15',
        status: 'chronic',
        severity: 'moderate',
        notes: 'Well-controlled with medication',
        icd_10_code: 'I10',
        treating_doctor: 'Dr. Sarah Smith'
      },
      {
        condition_name: 'Type 2 Diabetes',
        diagnosis_date: '2019-08-22',
        status: 'chronic',
        severity: 'moderate',
        notes: 'Managed with diet and medication',
        icd_10_code: 'E11.9',
        treating_doctor: 'Dr. Sarah Smith'
      }
    ],
    medications: [
      {
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        start_date: '2020-03-15',
        prescribing_doctor: 'Dr. Sarah Smith',
        indication: 'Hypertension',
        side_effects: ['Dry cough', 'Dizziness'],
        is_active: true
      },
      {
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        start_date: '2019-08-22',
        prescribing_doctor: 'Dr. Sarah Smith',
        indication: 'Type 2 Diabetes',
        side_effects: ['Nausea', 'Diarrhea'],
        is_active: true
      }
    ]
  },
  'jane.smith@email.com': {
    medical_history: [
      {
        condition_name: 'Asthma',
        diagnosis_date: '2015-05-10',
        status: 'active',
        severity: 'mild',
        notes: 'Exercise-induced asthma, well-controlled',
        icd_10_code: 'J45.9',
        treating_doctor: 'Dr. Michael Johnson'
      }
    ],
    medications: [
      {
        medication_name: 'Albuterol Inhaler',
        dosage: '90mcg',
        frequency: 'As needed',
        start_date: '2015-05-10',
        prescribing_doctor: 'Dr. Michael Johnson',
        indication: 'Asthma',
        side_effects: ['Tremor', 'Nervousness'],
        is_active: true
      }
    ]
  }
}

// Check if database tables exist
export const checkDatabaseTables = async () => {
  try {
    // Try to query each table to see if it exists
    const tables = ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']
    const results = {}

    for (const table of tables) {
      try {
        await supabase.from(table).select('count', { count: 'exact', head: true })
        results[table] = true
      } catch (error) {
        results[table] = false
      }
    }

    return { success: true, tables: results }
  } catch (error) {
    console.error('Error checking database tables:', error)
    return { success: false, error }
  }
}

// Create a single test user
export const createTestUser = async (userData) => {
  try {
    console.log(`Creating test user: ${userData.email}`)
    
    // Create user in Firebase
    const { user, error: authError } = await firebaseAuth.signUpWithEmail(userData.email, userData.password)
    
    if (authError) {
      console.error('Firebase auth error:', authError)
      return { success: false, error: authError }
    }
    
    // Create profile in Supabase
    const profileData = {
      firebase_uid: user.uid,
      email: userData.email,
      ...userData.profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { success: false, error: profileError }
    }
    
    console.log(`✅ Test user created: ${userData.profile.full_name}`)
    
    // Add medical data for patients
    if (userData.profile.role === 'patient' && SAMPLE_MEDICAL_DATA[userData.email]) {
      await addMedicalDataForPatient(user.uid, userData.email)
    }
    
    return { 
      success: true, 
      user: {
        email: userData.email,
        password: userData.password,
        firebase_uid: user.uid,
        profile: userData.profile
      }
    }
    
  } catch (error) {
    console.error(`Error creating test user ${userData.email}:`, error)
    return { success: false, error }
  }
}

// Add medical data for a patient
const addMedicalDataForPatient = async (firebaseUid, email) => {
  const medicalData = SAMPLE_MEDICAL_DATA[email]
  if (!medicalData) return
  
  try {
    // Add medical history
    if (medicalData.medical_history) {
      for (const history of medicalData.medical_history) {
        await supabase
          .from('medical_history')
          .insert([{
            patient_firebase_uid: firebaseUid,
            ...history
          }])
      }
    }
    
    // Add medications
    if (medicalData.medications) {
      for (const medication of medicalData.medications) {
        await supabase
          .from('medications')
          .insert([{
            patient_firebase_uid: firebaseUid,
            ...medication
          }])
      }
    }
    
    console.log(`✅ Medical data added for patient: ${email}`)
  } catch (error) {
    console.error('Error adding medical data:', error)
  }
}

// Create all test users
export const createAllTestUsers = async () => {
  console.log('🚀 Creating test users...')
  
  const results = {
    doctors: [],
    patients: [],
    errors: []
  }
  
  // Create doctors
  for (const doctorData of TEST_USERS.doctors) {
    const result = await createTestUser(doctorData)
    if (result.success) {
      results.doctors.push(result.user)
    } else {
      results.errors.push({ email: doctorData.email, error: result.error })
    }
  }
  
  // Create patients
  for (const patientData of TEST_USERS.patients) {
    const result = await createTestUser(patientData)
    if (result.success) {
      results.patients.push(result.user)
    } else {
      results.errors.push({ email: patientData.email, error: result.error })
    }
  }
  
  return results
}

// Get test user credentials for display
export const getTestUserCredentials = () => {
  const allUsers = [...TEST_USERS.doctors, ...TEST_USERS.patients]
  return allUsers.map(user => ({
    email: user.email,
    password: user.password,
    role: user.profile.role,
    name: user.profile.full_name
  }))
}
