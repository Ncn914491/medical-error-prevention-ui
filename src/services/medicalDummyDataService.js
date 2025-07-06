/**
 * Medical Dummy Data Service
 * Creates realistic medical data for the medical safety system
 */

import { supabase } from '../lib/supabase'
import { auth } from '../lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

// Realistic medical data
const MEDICAL_CONDITIONS = [
  { name: 'Hypertension', icd10: 'I10', severity: 'moderate' },
  { name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', severity: 'moderate' },
  { name: 'Asthma', icd10: 'J45.9', severity: 'mild' },
  { name: 'Hyperlipidemia', icd10: 'E78.5', severity: 'mild' },
  { name: 'Chronic Kidney Disease', icd10: 'N18.9', severity: 'severe' },
  { name: 'Atrial Fibrillation', icd10: 'I48.91', severity: 'moderate' },
  { name: 'Migraine', icd10: 'G43.909', severity: 'mild' },
  { name: 'Osteoarthritis', icd10: 'M19.90', severity: 'moderate' }
]

const MEDICATIONS = [
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', indication: 'Hypertension', sideEffects: ['Dry cough', 'Dizziness'] },
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', indication: 'Type 2 Diabetes', sideEffects: ['Nausea', 'Diarrhea'] },
  { name: 'Albuterol', dosage: '90mcg', frequency: 'As needed', indication: 'Asthma', sideEffects: ['Tremor', 'Nervousness'] },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', indication: 'High cholesterol', sideEffects: ['Muscle pain', 'Fatigue'] },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', indication: 'Hypertension', sideEffects: ['Swelling', 'Fatigue'] },
  { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily', indication: 'Atrial Fibrillation', sideEffects: ['Bleeding', 'Bruising'] },
  { name: 'Sumatriptan', dosage: '50mg', frequency: 'As needed', indication: 'Migraine', sideEffects: ['Drowsiness', 'Nausea'] },
  { name: 'Ibuprofen', dosage: '400mg', frequency: 'Three times daily', indication: 'Osteoarthritis', sideEffects: ['Stomach upset', 'Dizziness'] }
]

// Doctor profiles
const DOCTORS = [
  {
    email: 'dr.sarah.smith@medsafe.com',
    password: 'Doctor123!',
    full_name: 'Dr. Sarah Smith',
    specialization: 'Internal Medicine',
    license_number: 'MD-12345',
    hospital_affiliation: 'General Hospital',
    phone: '+1-555-0101',
    bio: 'Board-certified internist with 15 years of experience in primary care and chronic disease management.'
  },
  {
    email: 'dr.michael.johnson@medsafe.com',
    password: 'Doctor123!',
    full_name: 'Dr. Michael Johnson',
    specialization: 'Cardiology',
    license_number: 'MD-67890',
    hospital_affiliation: 'Heart Center',
    phone: '+1-555-0102',
    bio: 'Cardiologist specializing in heart disease prevention and treatment of cardiovascular conditions.'
  }
]

// Patient profiles
const PATIENTS = [
  {
    email: 'john.doe@email.com',
    password: 'Patient123!',
    full_name: 'John Doe',
    date_of_birth: '1975-03-15',
    gender: 'male',
    phone: '+1-555-0201',
    address: '123 Main St, Anytown, ST 12345',
    conditions: ['Hypertension', 'Type 2 Diabetes Mellitus'],
    medications: ['Lisinopril', 'Metformin']
  },
  {
    email: 'jane.smith@email.com',
    password: 'Patient123!',
    full_name: 'Jane Smith',
    date_of_birth: '1982-07-22',
    gender: 'female',
    phone: '+1-555-0202',
    address: '456 Oak Ave, Somewhere, ST 67890',
    conditions: ['Asthma'],
    medications: ['Albuterol']
  },
  {
    email: 'robert.wilson@email.com',
    password: 'Patient123!',
    full_name: 'Robert Wilson',
    date_of_birth: '1968-11-08',
    gender: 'male',
    phone: '+1-555-0203',
    address: '789 Pine Rd, Elsewhere, ST 54321',
    conditions: ['Hyperlipidemia', 'Osteoarthritis'],
    medications: ['Atorvastatin', 'Ibuprofen']
  },
  {
    email: 'maria.garcia@email.com',
    password: 'Patient123!',
    full_name: 'Maria Garcia',
    date_of_birth: '1990-05-12',
    gender: 'female',
    phone: '+1-555-0204',
    address: '321 Elm St, Nowhere, ST 98765',
    conditions: ['Migraine'],
    medications: ['Sumatriptan']
  },
  {
    email: 'david.brown@email.com',
    password: 'Patient123!',
    full_name: 'David Brown',
    date_of_birth: '1955-09-30',
    gender: 'male',
    phone: '+1-555-0205',
    address: '654 Maple Dr, Anyplace, ST 13579',
    conditions: ['Atrial Fibrillation', 'Chronic Kidney Disease'],
    medications: ['Warfarin', 'Amlodipine']
  }
]

// Generate secure access token
const generateAccessToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Create Firebase user and Supabase profile
const createUserProfile = async (userData, role) => {
  try {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    const firebaseUser = userCredential.user

    // Create Supabase profile
    const profileData = {
      firebase_uid: firebaseUser.uid,
      email: userData.email,
      full_name: userData.full_name,
      role: role,
      phone: userData.phone,
      date_of_birth: userData.date_of_birth || null,
      gender: userData.gender || null,
      address: userData.address || null,
      specialization: userData.specialization || null,
      license_number: userData.license_number || null,
      hospital_affiliation: userData.hospital_affiliation || null,
      bio: userData.bio || null,
      is_active: true
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return { success: false, error }
    }

    return { success: true, user: firebaseUser, profile }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error }
  }
}

// Create medical history for a patient
const createMedicalHistory = async (patientUid, conditions, doctorUid) => {
  const historyRecords = conditions.map(conditionName => {
    const condition = MEDICAL_CONDITIONS.find(c => c.name === conditionName)
    return {
      patient_firebase_uid: patientUid,
      condition_name: conditionName,
      diagnosis_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      severity: condition?.severity || 'mild',
      icd_10_code: condition?.icd10 || null,
      treating_doctor: 'Dr. Sarah Smith', // Default to first doctor
      doctor_firebase_uid: doctorUid,
      notes: `Patient diagnosed with ${conditionName}. Regular monitoring required.`
    }
  })

  const { data, error } = await supabase
    .from('medical_history')
    .insert(historyRecords)
    .select()

  return { success: !error, data, error }
}

// Create medications for a patient
const createMedications = async (patientUid, medicationNames, doctorUid) => {
  const medicationRecords = medicationNames.map(medName => {
    const medication = MEDICATIONS.find(m => m.name === medName)
    return {
      patient_firebase_uid: patientUid,
      medication_name: medName,
      dosage: medication?.dosage || '10mg',
      frequency: medication?.frequency || 'Once daily',
      start_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      prescribing_doctor: 'Dr. Sarah Smith',
      doctor_firebase_uid: doctorUid,
      indication: medication?.indication || 'Medical condition',
      side_effects: medication?.sideEffects || [],
      is_active: true,
      notes: `Prescribed for ${medication?.indication || 'medical condition'}. Monitor for side effects.`
    }
  })

  const { data, error } = await supabase
    .from('medications')
    .insert(medicationRecords)
    .select()

  return { success: !error, data, error }
}

// Create patient-doctor connections with tokens
const createPatientDoctorConnections = async (patientUid, doctorUids) => {
  const connections = doctorUids.map(doctorUid => ({
    patient_firebase_uid: patientUid,
    doctor_firebase_uid: doctorUid,
    access_token: generateAccessToken(),
    token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    is_active: true,
    permissions: {
      view_medical_history: true,
      view_medications: true,
      view_diagnosis: true
    }
  }))

  const { data, error } = await supabase
    .from('patient_doctor_connections')
    .insert(connections)
    .select()

  return { success: !error, data, error }
}

// Main function to create all dummy data
export const createMedicalDummyData = async () => {
  try {
    console.log('🏥 Creating medical dummy data...')
    
    const results = {
      doctors: [],
      patients: [],
      medicalHistory: [],
      medications: [],
      connections: [],
      errors: []
    }

    // Create doctors
    console.log('👨‍⚕️ Creating doctors...')
    for (const doctorData of DOCTORS) {
      const result = await createUserProfile(doctorData, 'doctor')
      if (result.success) {
        results.doctors.push(result)
        console.log(`✅ Created doctor: ${doctorData.full_name}`)
      } else {
        results.errors.push(`Failed to create doctor ${doctorData.full_name}: ${result.error.message}`)
      }
    }

    // Create patients
    console.log('🏥 Creating patients...')
    for (const patientData of PATIENTS) {
      const result = await createUserProfile(patientData, 'patient')
      if (result.success) {
        results.patients.push(result)
        console.log(`✅ Created patient: ${patientData.full_name}`)

        // Create medical history
        if (patientData.conditions && results.doctors.length > 0) {
          const historyResult = await createMedicalHistory(
            result.user.uid, 
            patientData.conditions, 
            results.doctors[0].user.uid
          )
          if (historyResult.success) {
            results.medicalHistory.push(...historyResult.data)
          }
        }

        // Create medications
        if (patientData.medications && results.doctors.length > 0) {
          const medicationResult = await createMedications(
            result.user.uid, 
            patientData.medications, 
            results.doctors[0].user.uid
          )
          if (medicationResult.success) {
            results.medications.push(...medicationResult.data)
          }
        }

        // Create patient-doctor connections
        if (results.doctors.length > 0) {
          const doctorUids = results.doctors.map(d => d.user.uid)
          const connectionResult = await createPatientDoctorConnections(result.user.uid, doctorUids)
          if (connectionResult.success) {
            results.connections.push(...connectionResult.data)
          }
        }
      } else {
        results.errors.push(`Failed to create patient ${patientData.full_name}: ${result.error.message}`)
      }
    }

    console.log('🎉 Medical dummy data creation completed!')
    console.log(`📊 Summary:
      - Doctors: ${results.doctors.length}
      - Patients: ${results.patients.length}
      - Medical History Records: ${results.medicalHistory.length}
      - Medications: ${results.medications.length}
      - Patient-Doctor Connections: ${results.connections.length}
      - Errors: ${results.errors.length}`)

    return {
      success: true,
      results,
      credentials: {
        doctors: DOCTORS.map(d => ({ email: d.email, password: d.password, name: d.full_name })),
        patients: PATIENTS.map(p => ({ email: p.email, password: p.password, name: p.full_name }))
      }
    }

  } catch (error) {
    console.error('❌ Error creating medical dummy data:', error)
    return { success: false, error }
  }
}

// Get access tokens for testing
export const getPatientAccessTokens = async (patientUid) => {
  const { data, error } = await supabase
    .from('patient_doctor_connections')
    .select('access_token, doctor_firebase_uid, token_expires_at, is_active')
    .eq('patient_firebase_uid', patientUid)
    .eq('is_active', true)

  return { success: !error, tokens: data, error }
}
