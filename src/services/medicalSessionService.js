// Medical Session Service - Handle patient-initiated medical sessions for doctor dashboard
import { supabase } from '../lib/supabase'

export const medicalSessionService = {
  /**
   * Create a medical session when patient adds medication
   */
  async createMedicationSession(patientFirebaseUid, medicationData, action = 'added') {
    try {
      console.log('📝 Creating medication session for patient:', patientFirebaseUid)
      
      const sessionData = {
        patient_firebase_uid: patientFirebaseUid,
        doctor_firebase_uid: null, // Patient-initiated, no specific doctor
        analysis_type: 'medication_check',
        input_data: {
          action: action,
          medication: {
            name: medicationData.medication_name,
            dosage: medicationData.dosage,
            frequency: medicationData.frequency,
            indication: medicationData.indication,
            start_date: medicationData.start_date,
            prescribing_doctor: medicationData.prescribing_doctor
          },
          source: 'patient_entry',
          entry_timestamp: new Date().toISOString()
        },
        results: {
          session_type: 'patient_medication_entry',
          action_performed: action,
          medication_name: medicationData.medication_name,
          medication_details: `${medicationData.dosage} - ${medicationData.frequency}`,
          indication: medicationData.indication || 'Not specified',
          prescribing_doctor: medicationData.prescribing_doctor || 'Self-reported',
          patient_notes: medicationData.notes || '',
          status: 'completed',
          entry_method: 'manual_patient_entry'
        },
        risk_level: 'low', // Patient entries are generally low risk
        confidence_score: 1.0, // High confidence for patient-reported data
        recommendations: [
          `Patient ${action} medication: ${medicationData.medication_name}`,
          'Review with patient during next consultation',
          'Verify medication details and interactions'
        ],
        flags: action === 'added' ? ['new_medication'] : ['medication_updated'],
        session_date: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('analysis_results')
        .insert([sessionData])
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to create medication session:', error)
        return { success: false, error }
      }

      console.log('✅ Medication session created successfully:', data.id)
      
      // Notify connected doctors about the new session
      await this.notifyConnectedDoctors(patientFirebaseUid, {
        type: 'medication_session',
        action: action,
        medication: medicationData.medication_name,
        sessionId: data.id
      })

      return { success: true, session: data }

    } catch (error) {
      console.error('❌ Exception creating medication session:', error)
      return { success: false, error }
    }
  },

  /**
   * Create a medical session when patient adds diagnosis/medical history
   */
  async createDiagnosisSession(patientFirebaseUid, diagnosisData, action = 'added') {
    try {
      console.log('📝 Creating diagnosis session for patient:', patientFirebaseUid)
      
      const sessionData = {
        patient_firebase_uid: patientFirebaseUid,
        doctor_firebase_uid: null, // Patient-initiated, no specific doctor
        analysis_type: 'diagnosis_review',
        input_data: {
          action: action,
          diagnosis: {
            condition_name: diagnosisData.condition_name,
            diagnosis_date: diagnosisData.diagnosis_date,
            status: diagnosisData.status,
            severity: diagnosisData.severity,
            treating_doctor: diagnosisData.treating_doctor,
            icd_10_code: diagnosisData.icd_10_code
          },
          source: 'patient_entry',
          entry_timestamp: new Date().toISOString()
        },
        results: {
          session_type: 'patient_diagnosis_entry',
          action_performed: action,
          condition_name: diagnosisData.condition_name,
          diagnosis_date: diagnosisData.diagnosis_date,
          condition_status: diagnosisData.status || 'active',
          severity_level: diagnosisData.severity || 'mild',
          treating_doctor: diagnosisData.treating_doctor || 'Self-reported',
          icd_10_code: diagnosisData.icd_10_code || 'Not specified',
          patient_notes: diagnosisData.notes || '',
          status: 'completed',
          entry_method: 'manual_patient_entry'
        },
        risk_level: this.calculateDiagnosisRiskLevel(diagnosisData.severity),
        confidence_score: 1.0, // High confidence for patient-reported data
        recommendations: [
          `Patient ${action} medical condition: ${diagnosisData.condition_name}`,
          'Review diagnosis details with patient',
          'Verify condition status and treatment plan'
        ],
        flags: action === 'added' ? ['new_diagnosis'] : ['diagnosis_updated'],
        session_date: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('analysis_results')
        .insert([sessionData])
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to create diagnosis session:', error)
        return { success: false, error }
      }

      console.log('✅ Diagnosis session created successfully:', data.id)
      
      // Notify connected doctors about the new session
      await this.notifyConnectedDoctors(patientFirebaseUid, {
        type: 'diagnosis_session',
        action: action,
        condition: diagnosisData.condition_name,
        sessionId: data.id
      })

      return { success: true, session: data }

    } catch (error) {
      console.error('❌ Exception creating diagnosis session:', error)
      return { success: false, error }
    }
  },

  /**
   * Get medical sessions for a specific patient (for doctor dashboard)
   */
  async getPatientSessions(patientFirebaseUid) {
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('patient_firebase_uid', patientFirebaseUid)
        .order('session_date', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch patient sessions:', error)
        return { success: false, error }
      }

      // Transform sessions for doctor dashboard display
      const transformedSessions = data.map(session => ({
        id: session.id,
        type: session.analysis_type === 'medication_check' ? 'medication' : 'diagnosis',
        session_date: session.session_date,
        risk_level: session.risk_level,
        severity_level: session.risk_level, // For compatibility
        status: session.results?.status || 'completed',
        
        // For medication sessions
        medications_checked: session.analysis_type === 'medication_check' 
          ? session.results?.medication_name 
          : null,
        
        // For diagnosis sessions  
        final_diagnosis: session.analysis_type === 'diagnosis_review'
          ? session.results?.condition_name
          : null,
          
        // Additional details
        source: session.results?.entry_method || 'patient_entry',
        action_performed: session.results?.action_performed || 'added',
        patient_initiated: true,
        
        // Raw data for detailed view
        raw_session: session
      }))

      return { success: true, sessions: transformedSessions }

    } catch (error) {
      console.error('❌ Exception fetching patient sessions:', error)
      return { success: false, error }
    }
  },

  /**
   * Notify connected doctors about new patient sessions
   */
  async notifyConnectedDoctors(patientFirebaseUid, sessionInfo) {
    try {
      // Get connected doctors for this patient
      const { data: connections, error } = await supabase
        .from('patient_doctor_connections')
        .select('doctor_firebase_uid, access_token')
        .eq('patient_firebase_uid', patientFirebaseUid)
        .eq('is_active', true)
        .gt('token_expires_at', new Date().toISOString())

      if (error) {
        console.warn('⚠️ Could not fetch connected doctors:', error)
        return
      }

      if (connections.length > 0) {
        console.log(`📢 Notifying ${connections.length} connected doctors about new session`)
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('patientSessionCreated', {
          detail: {
            patientFirebaseUid,
            connectedDoctors: connections.map(c => c.doctor_firebase_uid),
            sessionInfo,
            timestamp: new Date().toISOString()
          }
        }))
      }

    } catch (error) {
      console.warn('⚠️ Error notifying connected doctors:', error)
    }
  },

  /**
   * Calculate risk level based on diagnosis severity
   */
  calculateDiagnosisRiskLevel(severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'critical'
      case 'severe':
        return 'high'
      case 'moderate':
        return 'medium'
      case 'mild':
      default:
        return 'low'
    }
  },

  /**
   * Get all sessions for doctor dashboard (across all connected patients)
   */
  async getDoctorPatientSessions(doctorFirebaseUid) {
    try {
      // Get all patients connected to this doctor
      const { data: connections, error: connectionsError } = await supabase
        .from('patient_doctor_connections')
        .select('patient_firebase_uid')
        .eq('doctor_firebase_uid', doctorFirebaseUid)
        .eq('is_active', true)

      if (connectionsError) {
        console.error('❌ Failed to fetch doctor connections:', connectionsError)
        return { success: false, error: connectionsError }
      }

      if (connections.length === 0) {
        return { success: true, sessions: [] }
      }

      const patientUids = connections.map(c => c.patient_firebase_uid)

      // Get sessions for all connected patients
      const { data: sessions, error: sessionsError } = await supabase
        .from('analysis_results')
        .select(`
          *,
          patient:profiles!analysis_results_patient_firebase_uid_fkey(
            full_name, email
          )
        `)
        .in('patient_firebase_uid', patientUids)
        .order('session_date', { ascending: false })

      if (sessionsError) {
        console.error('❌ Failed to fetch patient sessions:', sessionsError)
        return { success: false, error: sessionsError }
      }

      return { success: true, sessions }

    } catch (error) {
      console.error('❌ Exception fetching doctor patient sessions:', error)
      return { success: false, error }
    }
  }
}

export default medicalSessionService
