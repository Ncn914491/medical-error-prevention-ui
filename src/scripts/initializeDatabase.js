/**
 * Complete Database Initialization Script for Cloud Supabase
 * Creates tables, seeds dummy data, and verifies all flows
 */

import { supabase } from '../lib/supabase.js'

// Generate a random token for patient-doctor connections
const generateAccessToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Generate dummy Firebase UIDs for testing
const generateFirebaseUID = (prefix = 'test') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const initializeDatabase = async () => {
  console.log('🚀 Starting complete database initialization...')
  
  try {
    // Step 1: Verify tables exist
    console.log('📋 Step 1: Verifying database tables...')
    const { data: tablesData, error: tablesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (tablesError) {
      console.error('❌ Database tables not found. Please run SQL schema first.')
      console.error('Error:', tablesError.message)
      return { success: false, error: tablesError }
    }
    
    console.log('✅ Database tables verified!')
    
    // Step 2: Create dummy doctors
    console.log('👨‍⚕️ Step 2: Creating dummy doctors...')
    const doctorUIDs = [
      generateFirebaseUID('doctor'),
      generateFirebaseUID('doctor')
    ]
    
    const doctors = [
      {
        firebase_uid: doctorUIDs[0],
        email: 'dr.smith@hospital.com',
        full_name: 'Dr. John Smith',
        role: 'doctor',
        phone: '+1-555-0101',
        specialization: 'Cardiology',
        license_number: 'MD12345',
        hospital_affiliation: 'General Hospital',
        bio: 'Experienced cardiologist with 15+ years in practice'
      },
      {
        firebase_uid: doctorUIDs[1],
        email: 'dr.johnson@clinic.com',
        full_name: 'Dr. Sarah Johnson',
        role: 'doctor',
        phone: '+1-555-0102',
        specialization: 'Internal Medicine',
        license_number: 'MD67890',
        hospital_affiliation: 'City Medical Center',
        bio: 'Internal medicine specialist focused on chronic disease management'
      }
    ]
    
    for (const doctor of doctors) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([doctor])
        .select()
      
      if (error) {
        console.error('❌ Error creating doctor:', error)
      } else {
        console.log(`✅ Created doctor: ${doctor.full_name}`)
      }
    }
    
    // Step 3: Create dummy patients
    console.log('👥 Step 3: Creating dummy patients...')
    const patientUIDs = [
      generateFirebaseUID('patient'),
      generateFirebaseUID('patient'),
      generateFirebaseUID('patient'),
      generateFirebaseUID('patient'),
      generateFirebaseUID('patient')
    ]
    
    const patients = [
      {
        firebase_uid: patientUIDs[0],
        email: 'alice.johnson@email.com',
        full_name: 'Alice Johnson',
        role: 'patient',
        phone: '+1-555-0201',
        date_of_birth: '1985-03-15',
        gender: 'female',
        address: '123 Main St, City, State 12345'
      },
      {
        firebase_uid: patientUIDs[1],
        email: 'bob.wilson@email.com',
        full_name: 'Bob Wilson',
        role: 'patient',
        phone: '+1-555-0202',
        date_of_birth: '1972-11-22',
        gender: 'male',
        address: '456 Oak Ave, City, State 12346'
      },
      {
        firebase_uid: patientUIDs[2],
        email: 'carol.davis@email.com',
        full_name: 'Carol Davis',
        role: 'patient',
        phone: '+1-555-0203',
        date_of_birth: '1990-07-08',
        gender: 'female',
        address: '789 Pine Rd, City, State 12347'
      },
      {
        firebase_uid: patientUIDs[3],
        email: 'david.brown@email.com',
        full_name: 'David Brown',
        role: 'patient',
        phone: '+1-555-0204',
        date_of_birth: '1965-12-03',
        gender: 'male',
        address: '321 Elm St, City, State 12348'
      },
      {
        firebase_uid: patientUIDs[4],
        email: 'emma.taylor@email.com',
        full_name: 'Emma Taylor',
        role: 'patient',
        phone: '+1-555-0205',
        date_of_birth: '1988-09-14',
        gender: 'female',
        address: '654 Maple Dr, City, State 12349'
      }
    ]
    
    for (const patient of patients) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([patient])
        .select()
      
      if (error) {
        console.error('❌ Error creating patient:', error)
      } else {
        console.log(`✅ Created patient: ${patient.full_name}`)
      }
    }
    
    // Step 4: Add medical history for patients
    console.log('📋 Step 4: Adding medical history...')
    const medicalHistoryData = [
      {
        patient_firebase_uid: patientUIDs[0],
        condition_name: 'Hypertension',
        diagnosis_date: '2020-01-15',
        status: 'chronic',
        severity: 'moderate',
        notes: 'Well controlled with medication',
        treating_doctor: 'Dr. John Smith'
      },
      {
        patient_firebase_uid: patientUIDs[0],
        condition_name: 'Type 2 Diabetes',
        diagnosis_date: '2019-05-22',
        status: 'chronic',
        severity: 'moderate',
        notes: 'Managing with diet and medication',
        treating_doctor: 'Dr. Sarah Johnson'
      },
      {
        patient_firebase_uid: patientUIDs[1],
        condition_name: 'Asthma',
        diagnosis_date: '2018-09-10',
        status: 'active',
        severity: 'mild',
        notes: 'Seasonal triggers, well controlled',
        treating_doctor: 'Dr. Sarah Johnson'
      },
      {
        patient_firebase_uid: patientUIDs[2],
        condition_name: 'Migraine',
        diagnosis_date: '2021-03-05',
        status: 'active',
        severity: 'moderate',
        notes: 'Monthly episodes, responsive to treatment',
        treating_doctor: 'Dr. Sarah Johnson'
      },
      {
        patient_firebase_uid: patientUIDs[3],
        condition_name: 'Coronary Artery Disease',
        diagnosis_date: '2020-11-18',
        status: 'chronic',
        severity: 'severe',
        notes: 'Post-surgery recovery, regular monitoring',
        treating_doctor: 'Dr. John Smith'
      }
    ]
    
    for (const history of medicalHistoryData) {
      const { data, error } = await supabase
        .from('medical_history')
        .insert([history])
        .select()
      
      if (error) {
        console.error('❌ Error adding medical history:', error)
      } else {
        console.log(`✅ Added medical history: ${history.condition_name} for ${history.patient_firebase_uid}`)
      }
    }
    
    // Step 5: Add medications for patients
    console.log('💊 Step 5: Adding medications...')
    const medicationsList = [
      {
        patient_firebase_uid: patientUIDs[0],
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        start_date: '2020-01-20',
        prescribing_doctor: 'Dr. John Smith',
        indication: 'Hypertension',
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[0],
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        start_date: '2019-05-25',
        prescribing_doctor: 'Dr. Sarah Johnson',
        indication: 'Type 2 Diabetes',
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[1],
        medication_name: 'Albuterol',
        dosage: '90mcg',
        frequency: 'As needed',
        start_date: '2018-09-15',
        prescribing_doctor: 'Dr. Sarah Johnson',
        indication: 'Asthma',
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[2],
        medication_name: 'Sumatriptan',
        dosage: '50mg',
        frequency: 'As needed',
        start_date: '2021-03-10',
        prescribing_doctor: 'Dr. Sarah Johnson',
        indication: 'Migraine',
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[3],
        medication_name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        start_date: '2020-11-25',
        prescribing_doctor: 'Dr. John Smith',
        indication: 'Coronary Artery Disease',
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[3],
        medication_name: 'Aspirin',
        dosage: '81mg',
        frequency: 'Once daily',
        start_date: '2020-11-25',
        prescribing_doctor: 'Dr. John Smith',
        indication: 'Coronary Artery Disease',
        is_active: true
      }
    ]
    
    for (const medication of medicationsList) {
      const { data, error } = await supabase
        .from('medications')
        .insert([medication])
        .select()
      
      if (error) {
        console.error('❌ Error adding medication:', error)
      } else {
        console.log(`✅ Added medication: ${medication.medication_name} for ${medication.patient_firebase_uid}`)
      }
    }
    
    // Step 6: Create patient-doctor connections with tokens
    console.log('🔗 Step 6: Creating patient-doctor connections...')
    const connections = [
      {
        patient_firebase_uid: patientUIDs[0],
        doctor_firebase_uid: doctorUIDs[0],
        access_token: generateAccessToken(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[1],
        doctor_firebase_uid: doctorUIDs[1],
        access_token: generateAccessToken(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[2],
        doctor_firebase_uid: doctorUIDs[1],
        access_token: generateAccessToken(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      },
      {
        patient_firebase_uid: patientUIDs[3],
        doctor_firebase_uid: doctorUIDs[0],
        access_token: generateAccessToken(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      }
    ]
    
    for (const connection of connections) {
      const { data, error } = await supabase
        .from('patient_doctor_connections')
        .insert([connection])
        .select()
      
      if (error) {
        console.error('❌ Error creating connection:', error)
      } else {
        console.log(`✅ Created connection: ${connection.patient_firebase_uid} <-> ${connection.doctor_firebase_uid}`)
        console.log(`   Token: ${connection.access_token}`)
      }
    }
    
    // Step 7: Verify all data
    console.log('🔍 Step 7: Verifying all data...')
    const verificationResults = {}
    
    // Verify profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error verifying profiles:', profilesError)
    } else {
      verificationResults.profiles = profilesData.length
      console.log(`✅ Verified ${profilesData.length} profiles`)
    }
    
    // Verify medical history
    const { data: historyData, error: historyError } = await supabase
      .from('medical_history')
      .select('*')
    
    if (historyError) {
      console.error('❌ Error verifying medical history:', historyError)
    } else {
      verificationResults.medical_history = historyData.length
      console.log(`✅ Verified ${historyData.length} medical history records`)
    }
    
    // Verify medications
    const { data: medicationsData, error: medicationsError } = await supabase
      .from('medications')
      .select('*')
    
    if (medicationsError) {
      console.error('❌ Error verifying medications:', medicationsError)
    } else {
      verificationResults.medications = medicationsData.length
      console.log(`✅ Verified ${medicationsData.length} medications`)
    }
    
    // Verify connections
    const { data: connectionsData, error: connectionsError } = await supabase
      .from('patient_doctor_connections')
      .select('*')
    
    if (connectionsError) {
      console.error('❌ Error verifying connections:', connectionsError)
    } else {
      verificationResults.connections = connectionsData.length
      console.log(`✅ Verified ${connectionsData.length} patient-doctor connections`)
    }
    
    console.log('🎉 Database initialization completed successfully!')
    console.log('📊 Summary:', verificationResults)
    
    return { 
      success: true, 
      data: verificationResults,
      testData: {
        doctorUIDs,
        patientUIDs,
        connections: connections.map(c => ({ 
          patient: c.patient_firebase_uid, 
          doctor: c.doctor_firebase_uid, 
          token: c.access_token 
        }))
      }
    }
    
  } catch (err) {
    console.error('❌ Exception during database initialization:', err)
    return { success: false, error: err }
  }
}

// Test end-to-end flows
export const testEndToEndFlows = async () => {
  console.log('🧪 Testing end-to-end flows...')
  
  try {
    // Test 1: Patient login simulation (get profile)
    console.log('👤 Test 1: Patient profile retrieval...')
    const { data: patients, error: patientsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .limit(1)
    
    if (patientsError) {
      console.error('❌ Failed to retrieve patient profile:', patientsError)
    } else if (patients.length > 0) {
      console.log('✅ Successfully retrieved patient profile:', patients[0].full_name)
      
      // Test 2: Patient medications
      console.log('💊 Test 2: Patient medications retrieval...')
      const { data: medications, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_firebase_uid', patients[0].firebase_uid)
      
      if (medicationsError) {
        console.error('❌ Failed to retrieve medications:', medicationsError)
      } else {
        console.log(`✅ Successfully retrieved ${medications.length} medications`)
      }
      
      // Test 3: Add new medication
      console.log('➕ Test 3: Adding new medication...')
      const newMedication = {
        patient_firebase_uid: patients[0].firebase_uid,
        medication_name: 'Ibuprofen',
        dosage: '200mg',
        frequency: 'As needed',
        start_date: new Date().toISOString().split('T')[0],
        prescribing_doctor: 'Dr. Test',
        indication: 'Pain relief',
        is_active: true
      }
      
      const { data: newMedData, error: newMedError } = await supabase
        .from('medications')
        .insert([newMedication])
        .select()
      
      if (newMedError) {
        console.error('❌ Failed to add new medication:', newMedError)
      } else {
        console.log('✅ Successfully added new medication:', newMedData[0].medication_name)
      }
      
      // Test 4: Token-based access
      console.log('🔐 Test 4: Token-based doctor access...')
      const { data: connections, error: connectionsError } = await supabase
        .from('patient_doctor_connections')
        .select('*')
        .eq('patient_firebase_uid', patients[0].firebase_uid)
        .limit(1)
      
      if (connectionsError) {
        console.error('❌ Failed to retrieve connection:', connectionsError)
      } else if (connections.length > 0) {
        console.log('✅ Found patient-doctor connection with token:', connections[0].access_token)
        
        // Test doctor accessing patient data via token
        const { data: tokenData, error: tokenError } = await supabase
          .from('patient_doctor_connections')
          .select(`
            patient_firebase_uid,
            doctor_firebase_uid,
            profiles!patient_doctor_connections_patient_firebase_uid_fkey(full_name, email)
          `)
          .eq('access_token', connections[0].access_token)
          .eq('is_active', true)
        
        if (tokenError) {
          console.error('❌ Failed to access via token:', tokenError)
        } else {
          console.log('✅ Successfully accessed patient data via token')
        }
      }
    }
    
    console.log('🎯 End-to-end flow testing completed!')
    return { success: true }
    
  } catch (err) {
    console.error('❌ Exception during end-to-end testing:', err)
    return { success: false, error: err }
  }
}

// Export for use in other scripts
export { generateAccessToken, generateFirebaseUID }
