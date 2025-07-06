import { supabase } from './supabaseClient';

// Patient management functions
export const patientService = {
  // Get all patients for the current user
  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get a specific patient by ID
  async getPatient(id) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create a new patient
  async createPatient(patientData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        ...patientData,
        user_id: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a patient
  async updatePatient(id, patientData) {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a patient
  async deletePatient(id) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Search patients by name or medical record number
  async searchPatients(query) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,medical_record_number.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Diagnosis session functions
export const diagnosisService = {
  // Get all diagnosis sessions for a patient
  async getPatientDiagnosisSessions(patientId) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create a new diagnosis session
  async createDiagnosisSession(sessionData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .insert([{
        ...sessionData,
        user_id: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a diagnosis session
  async updateDiagnosisSession(id, sessionData) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .update(sessionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a diagnosis session
  async deleteDiagnosisSession(id) {
    const { error } = await supabase
      .from('diagnosis_sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Medication session functions
export const medicationService = {
  // Get all medication sessions for a patient
  async getPatientMedicationSessions(patientId) {
    const { data, error } = await supabase
      .from('medication_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create a new medication session
  async createMedicationSession(sessionData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('medication_sessions')
      .insert([{
        ...sessionData,
        user_id: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a medication session
  async updateMedicationSession(id, sessionData) {
    const { data, error } = await supabase
      .from('medication_sessions')
      .update(sessionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a medication session
  async deleteMedicationSession(id) {
    const { error } = await supabase
      .from('medication_sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Analytics functions
export const analyticsService = {
  // Get dashboard statistics
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get patient count
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
    
    if (patientsError) throw patientsError;

    // Get diagnosis sessions count
    const { data: diagnosisSessions, error: diagnosisError } = await supabase
      .from('diagnosis_sessions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
    
    if (diagnosisError) throw diagnosisError;

    // Get medication sessions count
    const { data: medicationSessions, error: medicationError } = await supabase
      .from('medication_sessions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
    
    if (medicationError) throw medicationError;

    // Get recent high-risk sessions
    const { data: recentHighRisk, error: highRiskError } = await supabase
      .from('diagnosis_sessions')
      .select('id, risk_level, session_date')
      .eq('user_id', user.id)
      .in('risk_level', ['high', 'critical'])
      .order('session_date', { ascending: false })
      .limit(5);
    
    if (highRiskError) throw highRiskError;

    return {
      patientCount: patients.length,
      diagnosisSessionCount: diagnosisSessions.length,
      medicationSessionCount: medicationSessions.length,
      recentHighRiskSessions: recentHighRisk
    };
  },

  // Get recent activity
  async getRecentActivity(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get recent diagnosis sessions
    const { data: recentDiagnosis, error: diagnosisError } = await supabase
      .from('diagnosis_sessions')
      .select(`
        id,
        session_date,
        risk_level,
        patients (first_name, last_name)
      `)
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(limit);
    
    if (diagnosisError) throw diagnosisError;

    // Get recent medication sessions
    const { data: recentMedication, error: medicationError } = await supabase
      .from('medication_sessions')
      .select(`
        id,
        session_date,
        severity_level,
        patients (first_name, last_name)
      `)
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(limit);
    
    if (medicationError) throw medicationError;

    return {
      recentDiagnosis,
      recentMedication
    };
  }
};
