-- Simplified Medical Safety System Schema
-- For troubleshooting database connection issues
-- Project: medsafeai (iznvctyzvtloodzmsfhc)

-- =====================================================
-- 1. CREATE TABLES (WITHOUT RLS FOR TESTING)
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
    -- Patient-specific fields
    emergency_contact JSONB,
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
    doctor_firebase_uid TEXT,
    access_token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"view_medical_history": true, "view_medications": true, "view_diagnosis": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0
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
    doctor_firebase_uid TEXT,
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
    doctor_firebase_uid TEXT,
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

-- Create storage bucket for profile pictures (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. DISABLE RLS FOR TESTING (HACKATHON MODE)
-- =====================================================

-- Disable RLS on all tables for easier testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their connections" ON patient_doctor_connections;
DROP POLICY IF EXISTS "Patients can create connections" ON patient_doctor_connections;
DROP POLICY IF EXISTS "Users can update their connections" ON patient_doctor_connections;
DROP POLICY IF EXISTS "Patients can manage their medical history" ON medical_history;
DROP POLICY IF EXISTS "Patients can manage their medications" ON medications;
DROP POLICY IF EXISTS "Users can view relevant analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Public profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile picture" ON storage.objects;

-- =====================================================
-- 6. INSERT TEST DATA FOR VERIFICATION
-- =====================================================

-- Insert a test profile to verify everything works
INSERT INTO profiles (firebase_uid, email, full_name, role) 
VALUES ('test-setup-uid-' || extract(epoch from now()), 'test@setup.com', 'Database Setup Test', 'patient')
ON CONFLICT (firebase_uid) DO NOTHING;

-- Insert a test medication
INSERT INTO medications (patient_firebase_uid, medication_name, dosage, frequency, start_date)
VALUES ('test-setup-uid-' || extract(epoch from now()), 'Test Medication', '10mg', 'Once daily', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Insert a test connection
INSERT INTO patient_doctor_connections (patient_firebase_uid, access_token, token_expires_at)
VALUES ('test-setup-uid-' || extract(epoch from now()), 'TEST1234', NOW() + INTERVAL '24 hours')
ON CONFLICT (access_token) DO NOTHING;

-- =====================================================
-- 7. VERIFICATION QUERY
-- =====================================================

-- Verify setup with detailed information
SELECT 
  'Database setup completed successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results')) as tables_created,
  (SELECT COUNT(*) FROM profiles) as profile_records,
  (SELECT COUNT(*) FROM medications) as medication_records,
  (SELECT COUNT(*) FROM patient_doctor_connections) as connection_records,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'profile-pictures') as storage_buckets_created;
