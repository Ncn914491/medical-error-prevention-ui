import { supabase } from '../lib/supabase'

// Enhanced medication data service with proper Firebase UID filtering
export const medicationDataService = {
  // Get all medications for a patient by Firebase UID
  async getMedicationsByFirebaseUid(firebaseUid) {
    try {
      const { data, error, status } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_firebase_uid', firebaseUid)
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      console.log('getMedicationsByFirebaseUid:', { data, error, status, firebaseUid })

      if (error) throw error
      return { success: true, medications: data || [] }
    } catch (error) {
      console.error('Error fetching medications by Firebase UID:', error)
      return { success: false, error }
    }
  },

  // Add a new medication for a patient
  async addMedication(medicationData, patientFirebaseUid) {
    try {
      // Validate required fields
      if (!medicationData.medication_name || !medicationData.dosage || !medicationData.frequency || !medicationData.start_date) {
        return {
          success: false,
          error: { message: 'Missing required fields: medication_name, dosage, frequency, start_date' }
        }
      }

      if (!patientFirebaseUid) {
        return {
          success: false,
          error: { message: 'Patient Firebase UID is required' }
        }
      }

      // Prepare medication data with proper formatting
      const formattedData = {
        ...medicationData,
        patient_firebase_uid: patientFirebaseUid,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Ensure side_effects is properly formatted as array
        side_effects: Array.isArray(medicationData.side_effects)
          ? medicationData.side_effects
          : (medicationData.side_effects ? [medicationData.side_effects] : [])
      }

      console.log('addMedication - formatted data:', { formattedData, patientFirebaseUid })

      const { data, error, status } = await supabase
        .from('medications')
        .insert([formattedData])
        .select()
        .single()

      console.log('addMedication - result:', { data, error, status, patientFirebaseUid })

      if (error) {
        console.error('Supabase error adding medication:', error)
        return { success: false, error }
      }

      return { success: true, medication: data }
    } catch (error) {
      console.error('Exception adding medication:', error)
      return { success: false, error: { message: error.message || 'Unknown error occurred' } }
    }
  },

  // Update medication with upsert for conflict resolution
  async upsertMedication(medicationData, patientFirebaseUid) {
    try {
      // Validate required fields
      if (!medicationData.medication_name || !medicationData.dosage || !medicationData.frequency || !medicationData.start_date) {
        return {
          success: false,
          error: { message: 'Missing required fields: medication_name, dosage, frequency, start_date' }
        }
      }

      if (!patientFirebaseUid) {
        return {
          success: false,
          error: { message: 'Patient Firebase UID is required' }
        }
      }

      // Prepare medication data with proper formatting
      const formattedData = {
        ...medicationData,
        patient_firebase_uid: patientFirebaseUid,
        updated_at: new Date().toISOString(),
        // Ensure side_effects is properly formatted as array
        side_effects: Array.isArray(medicationData.side_effects)
          ? medicationData.side_effects
          : (medicationData.side_effects ? [medicationData.side_effects] : [])
      }

      console.log('upsertMedication - formatted data:', { formattedData, patientFirebaseUid })

      const { data, error, status } = await supabase
        .from('medications')
        .upsert([formattedData])
        .select()
        .single()

      console.log('upsertMedication - result:', { data, error, status, patientFirebaseUid })

      if (error) {
        console.error('Supabase error upserting medication:', error)
        return { success: false, error }
      }

      return { success: true, medication: data }
    } catch (error) {
      console.error('Exception upserting medication:', error)
      return { success: false, error: { message: error.message || 'Unknown error occurred' } }
    }
  },

  // Get medical history for a patient by Firebase UID with deduplication
  async getMedicalHistoryByFirebaseUid(firebaseUid) {
    try {
      const { data, error, status } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_firebase_uid', firebaseUid)
        .order('diagnosis_date', { ascending: false })

      console.log('getMedicalHistoryByFirebaseUid - raw data:', { data, error, status, firebaseUid })

      if (error) throw error

      // Deduplicate medical history entries based on condition_name and diagnosis_date
      const deduplicatedHistory = []
      const seen = new Set()

      if (data && data.length > 0) {
        for (const entry of data) {
          // Create a unique key based on condition name and diagnosis date
          const key = `${entry.condition_name?.toLowerCase()}_${entry.diagnosis_date}_${entry.status}`

          if (!seen.has(key)) {
            seen.add(key)
            deduplicatedHistory.push(entry)
          } else {
            console.log('Duplicate medical history entry filtered out:', entry)
          }
        }
      }

      console.log('getMedicalHistoryByFirebaseUid - deduplicated:', {
        original: data?.length || 0,
        deduplicated: deduplicatedHistory.length,
        firebaseUid
      })

      return { success: true, history: deduplicatedHistory }
    } catch (error) {
      console.error('Error fetching medical history by Firebase UID:', error)
      return { success: false, error }
    }
  },

  // Add medical history entry with duplicate checking
  async addMedicalHistory(historyData, patientFirebaseUid) {
    try {
      // Validate required fields
      if (!historyData.condition_name) {
        return {
          success: false,
          error: { message: 'Condition name is required' }
        }
      }

      if (!patientFirebaseUid) {
        return {
          success: false,
          error: { message: 'Patient Firebase UID is required' }
        }
      }

      // Check for existing similar medical history entry
      const { data: existingHistory, error: checkError } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_firebase_uid', patientFirebaseUid)
        .eq('condition_name', historyData.condition_name)
        .eq('diagnosis_date', historyData.diagnosis_date)
        .eq('status', historyData.status || 'active')
        .maybeSingle()

      console.log('addMedicalHistory - duplicate check:', { existingHistory, error: checkError })

      if (existingHistory) {
        return {
          success: false,
          error: { message: 'Similar medical history entry already exists' },
          existing: existingHistory
        }
      }

      const formattedData = {
        ...historyData,
        patient_firebase_uid: patientFirebaseUid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error, status } = await supabase
        .from('medical_history')
        .insert([formattedData])
        .select()
        .single()

      console.log('addMedicalHistory - result:', { data, error, status, patientFirebaseUid })

      if (error) {
        console.error('Supabase error adding medical history:', error)
        return { success: false, error }
      }

      return { success: true, history: data }
    } catch (error) {
      console.error('Exception adding medical history:', error)
      return { success: false, error: { message: error.message || 'Unknown error occurred' } }
    }
  },

  // Get patient profile by Firebase UID with maybeSingle
  async getPatientProfileByFirebaseUid(firebaseUid) {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .eq('role', 'patient')
        .maybeSingle()

      console.log('getPatientProfileByFirebaseUid:', { data, error, status, firebaseUid })

      if (error) throw error
      return { success: true, profile: data }
    } catch (error) {
      console.error('Error fetching patient profile by Firebase UID:', error)
      return { success: false, error }
    }
  },

  // Upsert patient profile (insert or update if exists)
  async upsertPatientProfile(profileData, firebaseUid) {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .upsert([{
          ...profileData,
          firebase_uid: firebaseUid,
          role: 'patient',
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      console.log('upsertPatientProfile:', { data, error, status, firebaseUid })

      if (error) throw error
      return { success: true, profile: data }
    } catch (error) {
      console.error('Error upserting patient profile:', error)
      return { success: false, error }
    }
  },

  // Get analysis results for a patient by Firebase UID
  async getAnalysisResultsByFirebaseUid(firebaseUid) {
    try {
      const { data, error, status } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('patient_firebase_uid', firebaseUid)
        .order('session_date', { ascending: false })
        .limit(20)

      console.log('getAnalysisResultsByFirebaseUid:', { data, error, status, firebaseUid })

      if (error) throw error
      return { success: true, results: data || [] }
    } catch (error) {
      console.error('Error fetching analysis results by Firebase UID:', error)
      return { success: false, error }
    }
  },

  // Add analysis result
  async addAnalysisResult(resultData, patientFirebaseUid) {
    try {
      const { data, error, status } = await supabase
        .from('analysis_results')
        .insert([{
          ...resultData,
          patient_firebase_uid: patientFirebaseUid,
          session_date: resultData.session_date || new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      console.log('addAnalysisResult:', { data, error, status, patientFirebaseUid })

      if (error) throw error
      return { success: true, result: data }
    } catch (error) {
      console.error('Error adding analysis result:', error)
      return { success: false, error }
    }
  }
}

export default medicationDataService
