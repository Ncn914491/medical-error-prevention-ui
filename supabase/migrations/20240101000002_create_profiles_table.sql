-- Create profiles table for user profile information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    specialization TEXT, -- For doctors
    license_number TEXT, -- For doctors
    hospital_affiliation TEXT, -- For doctors
    profile_picture TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient_doctor_connections table for token-based sharing
CREATE TABLE IF NOT EXISTS patient_doctor_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    doctor_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    access_token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"view_medical_history": true, "view_medications": true, "view_diagnosis": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_firebase_uid, doctor_firebase_uid)
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    diagnosis_date DATE,
    status TEXT CHECK (status IN ('active', 'resolved', 'chronic', 'monitoring')) DEFAULT 'active',
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')) DEFAULT 'mild',
    notes TEXT,
    icd_10_code TEXT,
    treating_doctor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    prescribing_doctor TEXT,
    indication TEXT,
    side_effects TEXT[],
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    doctor_firebase_uid TEXT REFERENCES profiles(firebase_uid),
    analysis_type TEXT CHECK (analysis_type IN ('medication_check', 'diagnosis_review', 'drug_interaction')) NOT NULL,
    input_data JSONB NOT NULL,
    results JSONB NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    confidence_score DECIMAL(3,2),
    recommendations TEXT[],
    flags TEXT[],
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_patient ON patient_doctor_connections(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_doctor ON patient_doctor_connections(doctor_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_token ON patient_doctor_connections(access_token);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(patient_firebase_uid, is_active);
CREATE INDEX IF NOT EXISTS idx_analysis_results_patient ON analysis_results(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_analysis_results_doctor ON analysis_results(doctor_firebase_uid);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_doctor_connections_updated_at BEFORE UPDATE ON patient_doctor_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

-- Create RLS policies for medical_history
CREATE POLICY "Patients can view own medical history" ON medical_history
  FOR SELECT USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Patients can manage own medical history" ON medical_history
  FOR ALL USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

-- Create RLS policies for medications
CREATE POLICY "Patients can view own medications" ON medications
  FOR SELECT USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Patients can manage own medications" ON medications
  FOR ALL USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

-- Create RLS policies for analysis_results
CREATE POLICY "Patients can view own analysis results" ON analysis_results
  FOR SELECT USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Patients can create own analysis results" ON analysis_results
  FOR INSERT WITH CHECK (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

-- Create RLS policies for patient_doctor_connections
CREATE POLICY "Patients can view own connections" ON patient_doctor_connections
  FOR SELECT USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Doctors can view their connections" ON patient_doctor_connections
  FOR SELECT USING (doctor_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');

CREATE POLICY "Patients can manage own connections" ON patient_doctor_connections
  FOR ALL USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'firebase_uid');
