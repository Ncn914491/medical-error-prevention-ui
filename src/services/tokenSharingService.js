import { supabase } from '../lib/supabase'

// Generate a secure access token with collision checking
const generateAccessToken = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check if token already exists
    const { data: existing, error, status } = await supabase
      .from('patient_doctor_connections')
      .select('id')
      .eq('access_token', result)
      .maybeSingle()

    console.log('generateAccessToken check:', { existing, error, status, token: result })

    if (!existing && !error) {
      return result
    }

    attempts++
  }

  throw new Error('Failed to generate unique token after multiple attempts')
}

// Validate token and check expiration
const validateToken = async (accessToken) => {
  const { data, error, status } = await supabase
    .from('patient_doctor_connections')
    .select('*')
    .eq('access_token', accessToken)
    .eq('is_active', true)
    .maybeSingle()

  console.log('validateToken:', { data, error, status })

  if (error || !data) {
    return { valid: false, reason: 'Token not found or inactive' }
  }

  const now = new Date()
  const expiresAt = new Date(data.token_expires_at)

  if (now > expiresAt) {
    // Automatically deactivate expired token
    await supabase
      .from('patient_doctor_connections')
      .update({ is_active: false })
      .eq('id', data.id)

    return { valid: false, reason: 'Token expired' }
  }

  return { valid: true, connection: data }
}

// Log token access for audit trail
const logTokenAccess = async (connectionId, doctorUid) => {
  try {
    await supabase
      .from('patient_doctor_connections')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.rpc('increment_access_count', { connection_id: connectionId })
      })
      .eq('id', connectionId)
  } catch (error) {
    console.warn('Failed to log token access:', error)
  }
}

export const tokenSharingService = {
  // Generate a new access token for a patient
  async generatePatientToken(patientFirebaseUid, expirationHours = 24) {
    try {
      // Check if patient exists
      const { data: patient, error: patientError, status: patientStatus } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('firebase_uid', patientFirebaseUid)
        .eq('role', 'patient')
        .maybeSingle()

      console.log('generatePatientToken - patient lookup:', { patient, error: patientError, status: patientStatus })

      if (patientError || !patient) {
        return { success: false, error: patientError || { message: 'Patient profile not found' } }
      }

      const accessToken = await generateAccessToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expirationHours)

      // Check for existing active tokens for this patient (without doctor assigned yet)
      const { data: existingToken, error: existingError } = await supabase
        .from('patient_doctor_connections')
        .select('*')
        .eq('patient_firebase_uid', patientFirebaseUid)
        .is('doctor_firebase_uid', null)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .maybeSingle()

      console.log('generatePatientToken - existing token check:', { existingToken, error: existingError })

      if (existingToken) {
        // Return the existing active token instead of creating a new one
        console.log(`🔑 Returning existing active token ${existingToken.access_token} for patient ${patient.full_name}`)
        return {
          success: true,
          token: existingToken.access_token,
          expiresAt: new Date(existingToken.token_expires_at),
          patient: patient,
          isExisting: true
        }
      }

      // Create new token record
      const { data, error, status } = await supabase
        .from('patient_doctor_connections')
        .insert([{
          patient_firebase_uid: patientFirebaseUid,
          doctor_firebase_uid: null, // Will be set when doctor uses the token
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

      console.log('generatePatientToken - insert result:', { data, error, status })

      if (error) {
        console.error('Error generating token:', error)
        return { success: false, error }
      }

      console.log(`🔑 Generated access token ${accessToken} for patient ${patient.full_name}`)

      return {
        success: true,
        token: accessToken,
        expiresAt: expiresAt,
        patientName: patient.full_name,
        data
      }
    } catch (error) {
      console.error('Error in generatePatientToken:', error)
      return { success: false, error }
    }
  },

  // Doctor uses token to access patient data
  async useAccessToken(accessToken, doctorFirebaseUid) {
    try {
      // First, ensure doctor profile exists to avoid foreign key constraint violation
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('firebase_uid', doctorFirebaseUid)
        .eq('role', 'doctor')
        .single()

      if (doctorError || !doctorProfile) {
        console.error('Doctor profile not found:', doctorError)
        return {
          success: false,
          error: 'Doctor profile not found. Please ensure you have a valid doctor account.'
        }
      }

      // Find the token and check if it's valid
      const { data: connection, error: findError, status: findStatus } = await supabase
        .from('patient_doctor_connections')
        .select(`
          *,
          patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(*)
        `)
        .eq('access_token', accessToken)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .maybeSingle()

      console.log('useAccessToken - find token:', { connection, error: findError, status: findStatus })

      if (findError || !connection) {
        return {
          success: false,
          error: findError?.message || 'Invalid or expired token'
        }
      }

      // Simply update the current connection with doctor information
      // No need to check for existing connections since we removed the unique constraint

      // Update the current connection with doctor information and increment access count
      const currentAccessCount = connection.access_count || 0
      const { data: updatedConnection, error: updateError } = await supabase
        .from('patient_doctor_connections')
        .update({
          doctor_firebase_uid: doctorFirebaseUid,
          last_accessed_at: new Date().toISOString(),
          access_count: currentAccessCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id)
        .select(`
          *,
          patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(*),
          doctor:profiles!patient_doctor_connections_doctor_firebase_uid_fkey(*)
        `)
        .single()

      console.log('useAccessToken - update result:', { data: updatedConnection, error: updateError })

      if (updateError) {
        console.error('Error updating connection:', updateError)
        return { success: false, error: updateError.message }
      }

      console.log(`🔗 Doctor ${doctorProfile.full_name} successfully connected to patient ${connection.patient.full_name}`)

      return {
        success: true,
        connection: updatedConnection,
        patient: connection.patient,
        doctor: doctorProfile
      }
    } catch (error) {
      console.error('Error in useAccessToken:', error)
      return { success: false, error: error.message }
    }
  },

  // Get patient data that doctor has access to
  async getPatientDataForDoctor(patientFirebaseUid, doctorFirebaseUid) {
    try {
      // Check if doctor has active access to this patient
      const { data: connection, error: connectionError, status: connectionStatus } = await supabase
        .from('patient_doctor_connections')
        .select('permissions')
        .eq('patient_firebase_uid', patientFirebaseUid)
        .eq('doctor_firebase_uid', doctorFirebaseUid)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .maybeSingle()

      console.log('getPatientDataForDoctor - connection check:', { connection, error: connectionError, status: connectionStatus })

      if (connectionError || !connection) {
        return { 
          success: false, 
          error: connectionError || 'No active access to this patient' 
        }
      }

      const permissions = connection.permissions
      const patientData = {}

      // Get patient profile
      const { data: profile, error: profileError, status: profileStatus } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', patientFirebaseUid)
        .maybeSingle()

      console.log('getPatientDataForDoctor - profile:', { profile, error: profileError, status: profileStatus })

      if (!profileError && profile) {
        patientData.profile = profile
      }

      // Get medical history if permitted
      if (permissions.view_medical_history) {
        const { data: medicalHistory, error: historyError } = await supabase
          .from('medical_history')
          .select('*')
          .eq('patient_firebase_uid', patientFirebaseUid)
          .order('diagnosis_date', { ascending: false })

        if (!historyError) {
          patientData.medical_history = medicalHistory || []
        }
      }

      // Get medications if permitted
      if (permissions.view_medications) {
        const { data: medications, error: medicationsError } = await supabase
          .from('medications')
          .select('*')
          .eq('patient_firebase_uid', patientFirebaseUid)
          .eq('is_active', true)
          .order('start_date', { ascending: false })

        if (!medicationsError) {
          patientData.medications = medications || []
        }
      }

      // Get analysis results if permitted
      if (permissions.view_diagnosis) {
        const { data: analysisResults, error: analysisError } = await supabase
          .from('analysis_results')
          .select('*')
          .eq('patient_firebase_uid', patientFirebaseUid)
          .order('session_date', { ascending: false })
          .limit(10)

        if (!analysisError) {
          patientData.analysis_results = analysisResults || []
        }
      }

      return { 
        success: true, 
        data: patientData,
        permissions 
      }
    } catch (error) {
      console.error('Error in getPatientDataForDoctor:', error)
      return { success: false, error }
    }
  },

  // Get all active tokens for a patient
  async getPatientTokens(patientFirebaseUid) {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_connections')
        .select(`
          *,
          doctor:profiles!patient_doctor_connections_doctor_firebase_uid_fkey(full_name, specialization)
        `)
        .eq('patient_firebase_uid', patientFirebaseUid)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting patient tokens:', error)
        return { success: false, error }
      }

      return { success: true, tokens: data || [] }
    } catch (error) {
      console.error('Error in getPatientTokens:', error)
      return { success: false, error }
    }
  },

  // Revoke a token
  async revokeToken(tokenId, userFirebaseUid) {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_connections')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .eq('patient_firebase_uid', userFirebaseUid)
        .select()
        .single()

      if (error) {
        console.error('Error revoking token:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in revokeToken:', error)
      return { success: false, error }
    }
  },

  // Get doctor's connected patients
  async getDoctorConnectedPatients(doctorFirebaseUid) {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_connections')
        .select(`
          *,
          patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(*)
        `)
        .eq('doctor_firebase_uid', doctorFirebaseUid)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting connected patients:', error)
        return { success: false, error }
      }

      return { success: true, patients: data || [] }
    } catch (error) {
      console.error('Error in getDoctorConnectedPatients:', error)
      return { success: false, error }
    }
  }
}
