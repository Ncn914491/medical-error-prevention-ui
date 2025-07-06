-- Database Schema Fixes for Medical Safety System
-- Project: iznvctyzvtloodzmsfhc
-- Fixes: Missing columns, tables, and foreign key constraints

-- =====================================================
-- 1. ADD MISSING EMERGENCY_CONTACT COLUMN
-- =====================================================

-- Add emergency_contact column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- =====================================================
-- 2. CREATE PATIENTS VIEW (COMPATIBILITY)
-- =====================================================

-- Create a view called 'patients' that maps to profiles with role='patient'
-- This maintains compatibility with existing queries expecting a 'patients' table
CREATE OR REPLACE VIEW patients AS
SELECT 
    id,
    firebase_uid,
    email,
    full_name,
    phone,
    date_of_birth,
    gender,
    address,
    emergency_contact,
    profile_picture,
    bio,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE role = 'patient';

-- Create a similar view for doctors
CREATE OR REPLACE VIEW doctors AS
SELECT 
    id,
    firebase_uid,
    email,
    full_name,
    phone,
    specialization,
    license_number,
    hospital_affiliation,
    profile_picture,
    bio,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE role = 'doctor';

-- =====================================================
-- 3. FIX FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_fkey;

ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_doctor_firebase_uid_fkey;

ALTER TABLE medical_history 
DROP CONSTRAINT IF EXISTS medical_history_patient_firebase_uid_fkey;

ALTER TABLE medical_history 
DROP CONSTRAINT IF EXISTS medical_history_doctor_firebase_uid_fkey;

ALTER TABLE medications 
DROP CONSTRAINT IF EXISTS medications_patient_firebase_uid_fkey;

ALTER TABLE medications 
DROP CONSTRAINT IF EXISTS medications_doctor_firebase_uid_fkey;

ALTER TABLE analysis_results 
DROP CONSTRAINT IF EXISTS analysis_results_patient_firebase_uid_fkey;

ALTER TABLE analysis_results 
DROP CONSTRAINT IF EXISTS analysis_results_doctor_firebase_uid_fkey;

-- Add proper foreign key constraints
ALTER TABLE patient_doctor_connections 
ADD CONSTRAINT patient_doctor_connections_patient_firebase_uid_fkey 
FOREIGN KEY (patient_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE CASCADE;

ALTER TABLE patient_doctor_connections 
ADD CONSTRAINT patient_doctor_connections_doctor_firebase_uid_fkey 
FOREIGN KEY (doctor_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE SET NULL;

ALTER TABLE medical_history 
ADD CONSTRAINT medical_history_patient_firebase_uid_fkey 
FOREIGN KEY (patient_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE CASCADE;

ALTER TABLE medical_history 
ADD CONSTRAINT medical_history_doctor_firebase_uid_fkey 
FOREIGN KEY (doctor_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE SET NULL;

ALTER TABLE medications 
ADD CONSTRAINT medications_patient_firebase_uid_fkey 
FOREIGN KEY (patient_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE CASCADE;

ALTER TABLE medications 
ADD CONSTRAINT medications_doctor_firebase_uid_fkey 
FOREIGN KEY (doctor_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE SET NULL;

ALTER TABLE analysis_results 
ADD CONSTRAINT analysis_results_patient_firebase_uid_fkey 
FOREIGN KEY (patient_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE CASCADE;

ALTER TABLE analysis_results 
ADD CONSTRAINT analysis_results_doctor_firebase_uid_fkey 
FOREIGN KEY (doctor_firebase_uid) REFERENCES profiles(firebase_uid) ON DELETE SET NULL;

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get patient data for doctor dashboard
CREATE OR REPLACE FUNCTION get_doctor_patients(doctor_uid TEXT)
RETURNS TABLE (
    patient_id UUID,
    patient_firebase_uid TEXT,
    patient_name TEXT,
    patient_email TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER,
    connection_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.firebase_uid,
        p.full_name,
        p.email,
        pdc.access_token,
        pdc.token_expires_at,
        pdc.last_accessed_at,
        pdc.access_count,
        pdc.created_at
    FROM profiles p
    INNER JOIN patient_doctor_connections pdc ON p.firebase_uid = pdc.patient_firebase_uid
    WHERE pdc.doctor_firebase_uid = doctor_uid
    AND pdc.is_active = true
    AND pdc.token_expires_at > NOW()
    ORDER BY pdc.last_accessed_at DESC NULLS LAST, pdc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient medical summary
CREATE OR REPLACE FUNCTION get_patient_medical_summary(patient_uid TEXT)
RETURNS TABLE (
    patient_name TEXT,
    medication_count BIGINT,
    condition_count BIGINT,
    active_medications JSONB,
    recent_conditions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.full_name,
        (SELECT COUNT(*) FROM medications m WHERE m.patient_firebase_uid = patient_uid AND m.is_active = true),
        (SELECT COUNT(*) FROM medical_history mh WHERE mh.patient_firebase_uid = patient_uid AND mh.status = 'active'),
        (SELECT COALESCE(json_agg(json_build_object(
            'name', medication_name,
            'dosage', dosage,
            'frequency', frequency
        )), '[]'::json) FROM medications WHERE patient_firebase_uid = patient_uid AND is_active = true LIMIT 5),
        (SELECT COALESCE(json_agg(json_build_object(
            'condition', condition_name,
            'severity', severity,
            'status', status
        )), '[]'::json) FROM medical_history WHERE patient_firebase_uid = patient_uid AND status = 'active' LIMIT 5)
    FROM profiles p
    WHERE p.firebase_uid = patient_uid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. UPDATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Add indexes for the new emergency_contact column
CREATE INDEX IF NOT EXISTS idx_profiles_emergency_contact ON profiles USING GIN (emergency_contact);

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_active_tokens 
ON patient_doctor_connections(doctor_firebase_uid, is_active, token_expires_at) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_medications_patient_active 
ON medications(patient_firebase_uid, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_medical_history_patient_active 
ON medical_history(patient_firebase_uid, status) 
WHERE status = 'active';

-- =====================================================
-- 6. INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample emergency contact data for existing patients
UPDATE profiles 
SET emergency_contact = jsonb_build_object(
    'name', 'Emergency Contact',
    'relationship', 'Family',
    'phone', '+1-555-0000',
    'email', 'emergency@example.com'
)
WHERE role = 'patient' AND emergency_contact IS NULL;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify the fixes
SELECT 
    'Schema fixes completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact') as emergency_contact_column_added,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'patients') as patients_view_created,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'doctors') as doctors_view_created,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_name LIKE '%_fkey') as foreign_keys_created,
    (SELECT COUNT(*) FROM profiles WHERE emergency_contact IS NOT NULL) as profiles_with_emergency_contact;
