-- Medical Safety System - Complete Database Schema
-- Project: medsafeai (iznvctyzvtloodzmsfhc)
-- Stack: Firebase Auth + Supabase Data Storage

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

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
    -- Doctor-specific fields
    specialization TEXT,
    license_number TEXT,
    hospital_affiliation TEXT,
    -- Profile picture stored in Supabase Storage
    profile_picture TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient_doctor_connections table for token-based sharing
CREATE TABLE IF NOT EXISTS patient_doctor_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT NOT NULL,
    doctor_firebase_uid TEXT NOT NULL,
    access_token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"view_medical_history": true, "view_medications": true, "view_diagnosis": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    UNIQUE(patient_firebase_uid, doctor_firebase_uid)
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT NOT NULL,
    condition_name TEXT NOT NULL,
    diagnosis_date DATE,
    status TEXT CHECK (status IN ('active', 'resolved', 'chronic', 'monitoring')) DEFAULT 'active',
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')) DEFAULT 'mild',
    notes TEXT,
    icd_10_code TEXT,
    treating_doctor TEXT,
    doctor_firebase_uid TEXT, -- Link to doctor who added this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    prescribing_doctor TEXT,
    doctor_firebase_uid TEXT, -- Link to doctor who prescribed
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
    patient_firebase_uid TEXT NOT NULL,
    doctor_firebase_uid TEXT,
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

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_patient ON patient_doctor_connections(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_doctor ON patient_doctor_connections(doctor_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_token ON patient_doctor_connections(access_token);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_active ON patient_doctor_connections(is_active, token_expires_at);

CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_medical_history_doctor ON medical_history(doctor_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_medical_history_status ON medical_history(status);

CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_medications_doctor ON medications(doctor_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(patient_firebase_uid, is_active);

CREATE INDEX IF NOT EXISTS idx_analysis_results_patient ON analysis_results(patient_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_analysis_results_doctor ON analysis_results(doctor_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type);

-- =====================================================
-- 3. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_doctor_connections_updated_at ON patient_doctor_connections;
CREATE TRIGGER update_patient_doctor_connections_updated_at BEFORE UPDATE ON patient_doctor_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_history_updated_at ON medical_history;
CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- =====================================================

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. CREATE RLS POLICIES (Hackathon-friendly)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/write their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- Patient-Doctor Connections: Patients and doctors can manage their connections
CREATE POLICY "Users can view their connections" ON patient_doctor_connections
  FOR SELECT USING (
    patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub' OR
    doctor_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Patients can create connections" ON patient_doctor_connections
  FOR INSERT WITH CHECK (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their connections" ON patient_doctor_connections
  FOR UPDATE USING (
    patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub' OR
    doctor_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Medical History: Patients own their data, doctors can view with valid tokens
CREATE POLICY "Patients can manage their medical history" ON medical_history
  FOR ALL USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- Medications: Patients own their data, doctors can view with valid tokens
CREATE POLICY "Patients can manage their medications" ON medications
  FOR ALL USING (patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- Analysis Results: Patients and involved doctors can view
CREATE POLICY "Users can view relevant analysis results" ON analysis_results
  FOR SELECT USING (
    patient_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub' OR
    doctor_firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Storage policy for profile pictures
CREATE POLICY "Public profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload own profile picture" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 6. VERIFICATION QUERY
-- =====================================================

-- Verify setup
SELECT 
  'Database setup completed successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'profile-pictures') as storage_buckets_created;
