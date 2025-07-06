/**
 * Script to create test user accounts in Firebase and Supabase
 * Run with: node scripts/create-test-users.js
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Initialize Supabase
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')

// Test user data
const testUsers = [
  // Doctors
  {
    email: 'dr.smith@medsafe.com',
    password: 'Doctor123!',
    role: 'doctor',
    profile: {
      full_name: 'Dr. Sarah Smith',
      phone: '+1-555-0101',
      date_of_birth: '1975-03-15',
      gender: 'female',
      address: '123 Medical Center Dr, Healthcare City, HC 12345',
      specialization: 'Internal Medicine',
      license_number: 'MD-12345-NY',
      hospital_affiliation: 'MedSafe General Hospital',
      bio: 'Board-certified internist with 15+ years of experience in primary care and preventive medicine.'
    }
  },
  {
    email: 'dr.johnson@medsafe.com',
    password: 'Doctor123!',
    role: 'doctor',
    profile: {
      full_name: 'Dr. Michael Johnson',
      phone: '+1-555-0102',
      date_of_birth: '1968-11-22',
      gender: 'male',
      address: '456 Cardiology Ave, Heart City, HC 12346',
      specialization: 'Cardiology',
      license_number: 'MD-67890-CA',
      hospital_affiliation: 'Heart & Vascular Institute',
      bio: 'Experienced cardiologist specializing in interventional cardiology and heart disease prevention.'
    }
  },
  // Patients
  {
    email: 'john.doe@email.com',
    password: 'Patient123!',
    role: 'patient',
    profile: {
      full_name: 'John Doe',
      phone: '+1-555-0201',
      date_of_birth: '1985-07-10',
      gender: 'male',
      address: '789 Main St, Anytown, AT 54321'
    }
  },
  {
    email: 'jane.smith@email.com',
    password: 'Patient123!',
    role: 'patient',
    profile: {
      full_name: 'Jane Smith',
      phone: '+1-555-0202',
      date_of_birth: '1992-02-28',
      gender: 'female',
      address: '321 Oak Ave, Somewhere, SW 98765'
    }
  },
  {
    email: 'robert.wilson@email.com',
    password: 'Patient123!',
    role: 'patient',
    profile: {
      full_name: 'Robert Wilson',
      phone: '+1-555-0203',
      date_of_birth: '1978-12-05',
      gender: 'male',
      address: '654 Pine St, Elsewhere, EW 13579'
    }
  },
  {
    email: 'maria.garcia@email.com',
    password: 'Patient123!',
    role: 'patient',
    profile: {
      full_name: 'Maria Garcia',
      phone: '+1-555-0204',
      date_of_birth: '1990-09-18',
      gender: 'female',
      address: '987 Elm Dr, Nowhere, NW 24680'
    }
  }
]

// Sample medical data for patients
const sampleMedicalData = {
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
  },
  'robert.wilson@email.com': {
    medical_history: [
      {
        condition_name: 'High Cholesterol',
        diagnosis_date: '2021-01-20',
        status: 'active',
        severity: 'moderate',
        notes: 'Familial hypercholesterolemia',
        icd_10_code: 'E78.0',
        treating_doctor: 'Dr. Michael Johnson'
      }
    ],
    medications: [
      {
        medication_name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily at bedtime',
        start_date: '2021-01-20',
        prescribing_doctor: 'Dr. Michael Johnson',
        indication: 'High Cholesterol',
        side_effects: ['Muscle pain', 'Liver enzyme elevation'],
        is_active: true
      }
    ]
  },
  'maria.garcia@email.com': {
    medical_history: [
      {
        condition_name: 'Migraine',
        diagnosis_date: '2018-06-12',
        status: 'active',
        severity: 'moderate',
        notes: 'Hormonal migraines, responds well to triptans',
        icd_10_code: 'G43.9',
        treating_doctor: 'Dr. Sarah Smith'
      }
    ],
    medications: [
      {
        medication_name: 'Sumatriptan',
        dosage: '50mg',
        frequency: 'As needed for migraine',
        start_date: '2018-06-12',
        prescribing_doctor: 'Dr. Sarah Smith',
        indication: 'Migraine',
        side_effects: ['Chest tightness', 'Drowsiness'],
        is_active: true
      }
    ]
  }
}

async function createTestUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`)
    
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    const user = userCredential.user
    
    // Update display name
    await updateProfile(user, {
      displayName: userData.profile.full_name
    })
    
    console.log(`✅ Firebase user created: ${user.uid}`)
    
    // Create profile in Supabase
    const profileData = {
      firebase_uid: user.uid,
      email: userData.email,
      role: userData.role,
      ...userData.profile
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      return null
    }
    
    console.log(`✅ Supabase profile created for: ${userData.profile.full_name}`)
    
    // Add medical data for patients
    if (userData.role === 'patient' && sampleMedicalData[userData.email]) {
      const medicalData = sampleMedicalData[userData.email]
      
      // Add medical history
      if (medicalData.medical_history) {
        for (const history of medicalData.medical_history) {
          const { error: historyError } = await supabase
            .from('medical_history')
            .insert([{
              patient_firebase_uid: user.uid,
              ...history
            }])
          
          if (historyError) {
            console.error('❌ Error creating medical history:', historyError)
          }
        }
        console.log(`✅ Medical history added for: ${userData.profile.full_name}`)
      }
      
      // Add medications
      if (medicalData.medications) {
        for (const medication of medicalData.medications) {
          const { error: medicationError } = await supabase
            .from('medications')
            .insert([{
              patient_firebase_uid: user.uid,
              ...medication
            }])
          
          if (medicationError) {
            console.error('❌ Error creating medication:', medicationError)
          }
        }
        console.log(`✅ Medications added for: ${userData.profile.full_name}`)
      }
    }
    
    return {
      email: userData.email,
      password: userData.password,
      role: userData.role,
      firebase_uid: user.uid,
      profile: userData.profile
    }
    
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message)
    return null
  }
}

async function createAllTestUsers() {
  console.log('🚀 Starting test user creation...\n')
  
  const createdUsers = []
  
  for (const userData of testUsers) {
    const result = await createTestUser(userData)
    if (result) {
      createdUsers.push(result)
    }
    console.log('') // Add spacing between users
  }
  
  console.log('📋 Test User Credentials Summary:')
  console.log('=====================================')
  
  const doctors = createdUsers.filter(u => u.role === 'doctor')
  const patients = createdUsers.filter(u => u.role === 'patient')
  
  console.log('\n👨‍⚕️ DOCTORS:')
  doctors.forEach(user => {
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log(`Name: ${user.profile.full_name}`)
    console.log(`Specialization: ${user.profile.specialization}`)
    console.log('---')
  })
  
  console.log('\n🏥 PATIENTS:')
  patients.forEach(user => {
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log(`Name: ${user.profile.full_name}`)
    console.log('---')
  })
  
  console.log('\n✅ Test user creation completed!')
  console.log(`Total users created: ${createdUsers.length}`)
  console.log(`Doctors: ${doctors.length}`)
  console.log(`Patients: ${patients.length}`)
}

// Run the script
createAllTestUsers().catch(console.error)
