import { supabase } from '../lib/supabase';

// Patient Management Services
export const patientService = {
  // Get all patients for current user (from profiles table)
  async getPatients() {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    console.log('getPatients:', { data, error, status });

    if (error) throw error;
    return data;
  },

  // Get patient by ID (from profiles table)
  async getPatientById(id) {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'patient')
      .maybeSingle();

    console.log('getPatientById:', { data, error, status });

    if (error) throw error;
    return data;
  },

  // Create new patient (in profiles table)
  async createPatient(patientData) {
    const { data: user } = await supabase.auth.getUser();

    const { data, error, status } = await supabase
      .from('profiles')
      .insert([{
        ...patientData,
        firebase_uid: user.user.id,
        role: 'patient'
      }])
      .select()
      .single();

    console.log('createPatient:', { data, error, status });

    if (error) throw error;
    return data;
  },

  // Update patient
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

  // Delete patient
  async deletePatient(id) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Search patients
  async searchPatients(query) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,medical_record_number.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get patient with sessions
  async getPatientWithSessions(id) {
    const { data: patient, error: patientError, status: patientStatus } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    console.log('getPatientWithSessions - patient:', { patient, error: patientError, status: patientStatus });
    
    if (patientError) throw patientError;

    const { data: diagnosisSessions, error: diagnosisError, status: diagnosisStatus } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .eq('patient_id', id)
      .order('session_date', { ascending: false });
    
    console.log('getPatientWithSessions - diagnosis:', { diagnosisSessions, error: diagnosisError, status: diagnosisStatus });
    
    if (diagnosisError) throw diagnosisError;

    const { data: medicationSessions, error: medicationError, status: medicationStatus } = await supabase
      .from('medication_sessions')
      .select('*')
      .eq('patient_id', id)
      .order('session_date', { ascending: false });
    
    console.log('getPatientWithSessions - medication:', { medicationSessions, error: medicationError, status: medicationStatus });
    
    if (medicationError) throw medicationError;

    return {
      ...patient,
      diagnosisSessions,
      medicationSessions
    };
  }
};

// Diagnosis Session Services
export const diagnosisService = {
  // Get all diagnosis sessions for current user
  async getDiagnosisSessions() {
    const { data, error, status } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number
        )
      `)
      .order('session_date', { ascending: false });
    
    console.log('getDiagnosisSessions:', { data, error, status });
    
    if (error) throw error;
    return data;
  },

  // Get diagnosis session by ID
  async getDiagnosisSessionById(id) {
    const { data, error, status } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number,
          allergies,
          chronic_conditions,
          current_medications
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    console.log('getDiagnosisSessionById:', { data, error, status });
    
    if (error) throw error;
    return data;
  },

  // Create new diagnosis session
  async createDiagnosisSession(sessionData) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error, status } = await supabase
      .from('diagnosis_sessions')
      .insert([{
        ...sessionData,
        user_id: user.user.id
      }])
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number
        )
      `)
      .single();
    
    console.log('createDiagnosisSession:', { data, error, status });
    
    if (error) throw error;
    return data;
  },

  // Update diagnosis session
  async updateDiagnosisSession(id, sessionData) {
    const { data, error, status } = await supabase
      .from('diagnosis_sessions')
      .update(sessionData)
      .eq('id', id)
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number
        )
      `)
      .single();
    
    console.log('updateDiagnosisSession:', { data, error, status });
    
    if (error) throw error;
    return data;
  },

  // Delete diagnosis session
  async deleteDiagnosisSession(id) {
    const { error } = await supabase
      .from('diagnosis_sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get sessions by patient
  async getDiagnosisSessionsByPatient(patientId) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Medication Session Services
export const medicationService = {
  // Get all medication sessions for current user
  async getMedicationSessions() {
    const { data, error } = await supabase
      .from('medication_sessions')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number
        )
      `)
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get medication session by ID
  async getMedicationSessionById(id) {
    const { data, error } = await supabase
      .from('medication_sessions')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number,
          allergies,
          chronic_conditions,
          current_medications
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new medication session
  async createMedicationSession(sessionData) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('medication_sessions')
      .insert([{
        ...sessionData,
        user_id: user.user.id
      }])
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update medication session
  async updateMedicationSession(id, sessionData) {
    const { data, error } = await supabase
      .from('medication_sessions')
      .update(sessionData)
      .eq('id', id)
      .select(`
        *,
        patients (
          first_name,
          last_name,
          medical_record_number
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete medication session
  async deleteMedicationSession(id) {
    const { error } = await supabase
      .from('medication_sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get sessions by patient
  async getMedicationSessionsByPatient(patientId) {
    const { data, error } = await supabase
      .from('medication_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Analytics Services
export const analyticsService = {
  // Get dashboard statistics
  async getDashboardStats() {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user.id;

    // Get patient count
    const { count: patientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get diagnosis session count
    const { count: diagnosisCount } = await supabase
      .from('diagnosis_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get medication session count
    const { count: medicationCount } = await supabase
      .from('medication_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get high-risk diagnosis sessions
    const { count: highRiskCount } = await supabase
      .from('diagnosis_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('risk_level', ['high', 'critical']);

    // Get critical medication sessions
    const { count: criticalMedicationCount } = await supabase
      .from('medication_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('severity_level', ['high', 'critical']);

    return {
      patientCount: patientCount || 0,
      diagnosisCount: diagnosisCount || 0,
      medicationCount: medicationCount || 0,
      highRiskCount: highRiskCount || 0,
      criticalMedicationCount: criticalMedicationCount || 0
    };
  },

  // Get recent activity
  async getRecentActivity(limit = 10) {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user.id;

    // Get recent diagnosis sessions
    const { data: recentDiagnosis } = await supabase
      .from('diagnosis_sessions')
      .select(`
        id,
        session_date,
        final_diagnosis,
        risk_level,
        patients (first_name, last_name)
      `)
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(limit);

    // Get recent medication sessions
    const { data: recentMedication } = await supabase
      .from('medication_sessions')
      .select(`
        id,
        session_date,
        severity_level,
        medications_checked,
        patients (first_name, last_name)
      `)
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(limit);

    // Combine and sort by date
    const allActivity = [
      ...(recentDiagnosis || []).map(item => ({ ...item, type: 'diagnosis' })),
      ...(recentMedication || []).map(item => ({ ...item, type: 'medication' }))
    ].sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
     .slice(0, limit);

    return allActivity;
  },

  // Get risk level distribution
  async getRiskDistribution() {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user.id;

    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select('risk_level')
      .eq('user_id', userId);

    if (error) throw error;

    const distribution = data.reduce((acc, session) => {
      acc[session.risk_level] = (acc[session.risk_level] || 0) + 1;
      return acc;
    }, {});

    return distribution;
  },

  // Get severity level distribution for medications
  async getSeverityDistribution() {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user.id;

    const { data, error } = await supabase
      .from('medication_sessions')
      .select('severity_level')
      .eq('user_id', userId);

    if (error) throw error;

    const distribution = data.reduce((acc, session) => {
      acc[session.severity_level] = (acc[session.severity_level] || 0) + 1;
      return acc;
    }, {});

    return distribution;
  }
};

// Audit Log Services
export const auditService = {
  // Get audit logs for current user
  async getAuditLogs(limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Get audit logs for specific record
  async getAuditLogsForRecord(tableName, recordId) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Utility Services
export const utilityService = {
  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Create sample data for testing
  async createSampleData() {
    const { data, error } = await supabase.rpc('create_sample_data');
    if (error) throw error;
    return data;
  }
};

// Export all services
export default {
  patient: patientService,
  diagnosis: diagnosisService,
  medication: medicationService,
  analytics: analyticsService,
  audit: auditService,
  utility: utilityService
};
