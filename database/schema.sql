-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  medical_record_number VARCHAR(50),
  allergies TEXT[],
  chronic_conditions TEXT[],
  current_medications TEXT[],
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnosis_sessions table
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  presenting_symptoms TEXT NOT NULL,
  patient_history TEXT,
  physical_examination TEXT,
  laboratory_results TEXT,
  imaging_results TEXT,
  differential_diagnosis TEXT[],
  final_diagnosis TEXT,
  icd_10_codes TEXT[],
  treatment_plan TEXT,
  medications_prescribed TEXT[],
  follow_up_instructions TEXT,
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  ai_flags TEXT[],
  ai_suggestions TEXT,
  inconsistencies_detected TEXT[],
  missing_diagnoses TEXT[],
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication_sessions table
CREATE TABLE IF NOT EXISTS medication_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  medications_checked TEXT[] NOT NULL,
  drug_interactions TEXT[],
  allergy_alerts TEXT[],
  contraindications TEXT[],
  dosage_warnings TEXT[],
  severity_level VARCHAR(20) DEFAULT 'low' CHECK (severity_level IN ('low', 'moderate', 'high', 'critical')),
  recommendations TEXT,
  alternative_medications TEXT[],
  monitoring_requirements TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_medical_record ON patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_user_id ON diagnosis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_patient_id ON diagnosis_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_date ON diagnosis_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_medication_sessions_user_id ON medication_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_sessions_patient_id ON medication_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_sessions_date ON medication_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_sessions_updated_at BEFORE UPDATE ON diagnosis_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_sessions_updated_at BEFORE UPDATE ON medication_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Patients policies
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- Diagnosis sessions policies
CREATE POLICY "Users can view own diagnosis sessions" ON diagnosis_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnosis sessions" ON diagnosis_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnosis sessions" ON diagnosis_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagnosis sessions" ON diagnosis_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Medication sessions policies
CREATE POLICY "Users can view own medication sessions" ON medication_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication sessions" ON medication_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication sessions" ON medication_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication sessions" ON medication_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data)
    VALUES (OLD.user_id, TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (NEW.user_id, TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, table_name, record_id, action, new_data)
    VALUES (NEW.user_id, TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers
CREATE TRIGGER patients_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER diagnosis_sessions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON diagnosis_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER medication_sessions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON medication_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create sample data function (for testing)
CREATE OR REPLACE FUNCTION create_sample_data()
RETURNS VOID AS $$
DECLARE
  sample_user_id UUID;
  sample_patient_id UUID;
BEGIN
  -- Get the current user ID
  sample_user_id := auth.uid();
  
  -- Insert sample patient
  INSERT INTO patients (
    user_id, first_name, last_name, date_of_birth, gender,
    medical_record_number, allergies, chronic_conditions, current_medications
  ) VALUES (
    sample_user_id, 'John', 'Doe', '1980-05-15', 'Male',
    'MR001', ARRAY['Penicillin', 'Shellfish'], ARRAY['Hypertension', 'Diabetes Type 2'],
    ARRAY['Lisinopril 10mg', 'Metformin 500mg']
  ) RETURNING id INTO sample_patient_id;
  
  -- Insert sample diagnosis session
  INSERT INTO diagnosis_sessions (
    user_id, patient_id, presenting_symptoms, patient_history,
    differential_diagnosis, final_diagnosis, icd_10_codes,
    risk_level, ai_flags, confidence_score
  ) VALUES (
    sample_user_id, sample_patient_id, 'Chest pain, shortness of breath',
    'History of hypertension and diabetes',
    ARRAY['Myocardial infarction', 'Angina pectoris', 'Pulmonary embolism'],
    'Unstable angina', ARRAY['I20.0'],
    'high', ARRAY['Drug interaction with current medications'], 0.85
  );
  
  -- Insert sample medication session
  INSERT INTO medication_sessions (
    user_id, patient_id, medications_checked,
    drug_interactions, allergy_alerts, severity_level, recommendations
  ) VALUES (
    sample_user_id, sample_patient_id, ARRAY['Lisinopril', 'Metformin', 'Aspirin'],
    ARRAY['No significant interactions detected'],
    ARRAY['No allergy conflicts'], 'low',
    'Continue current medications, add cardioprotective therapy'
  );
  
END;
$$ language 'plpgsql';
