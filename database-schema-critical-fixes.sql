-- Critical Database Schema Fixes for Medical Safety System
-- Project: iznvctyzvtloodzmsfhc
-- Fixes: Missing columns causing schema cache errors

-- =====================================================
-- 1. FIX PATIENT_DOCTOR_CONNECTIONS TABLE
-- =====================================================

-- Add missing access_count column
ALTER TABLE patient_doctor_connections 
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Add missing last_accessed_at column for audit trail
ALTER TABLE patient_doctor_connections 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have default access_count
UPDATE patient_doctor_connections 
SET access_count = 0 
WHERE access_count IS NULL;

-- =====================================================
-- 2. FIX MEDICAL_HISTORY TABLE
-- =====================================================

-- Add missing entry_source column
ALTER TABLE medical_history 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'doctor';

-- Add patient_entered column for tracking self-entries
ALTER TABLE medical_history 
ADD COLUMN IF NOT EXISTS patient_entered BOOLEAN DEFAULT false;

-- Update existing records with default values
UPDATE medical_history 
SET entry_source = 'doctor', patient_entered = false
WHERE entry_source IS NULL OR patient_entered IS NULL;

-- =====================================================
-- 3. FIX MEDICATIONS TABLE (for consistency)
-- =====================================================

-- Add entry_source column to medications table
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'doctor';

-- Add patient_entered column to medications table
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS patient_entered BOOLEAN DEFAULT false;

-- Update existing records with default values
UPDATE medications 
SET entry_source = 'doctor', patient_entered = false
WHERE entry_source IS NULL OR patient_entered IS NULL;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for access_count queries
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_access_count 
ON patient_doctor_connections(access_count);

-- Index for last_accessed_at queries
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_last_accessed 
ON patient_doctor_connections(last_accessed_at);

-- Index for entry_source queries
CREATE INDEX IF NOT EXISTS idx_medical_history_entry_source 
ON medical_history(entry_source);

CREATE INDEX IF NOT EXISTS idx_medications_entry_source 
ON medications(entry_source);

-- Index for patient_entered queries
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_entered 
ON medical_history(patient_firebase_uid, patient_entered);

CREATE INDEX IF NOT EXISTS idx_medications_patient_entered 
ON medications(patient_firebase_uid, patient_entered);

-- Composite index for doctor dashboard queries
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_doctor_active 
ON patient_doctor_connections(doctor_firebase_uid, is_active, last_accessed_at) 
WHERE is_active = true;

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to safely increment access count
CREATE OR REPLACE FUNCTION increment_access_count(connection_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE patient_doctor_connections 
    SET 
        access_count = COALESCE(access_count, 0) + 1,
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE id = connection_id
    RETURNING access_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor's connected patients with full details
CREATE OR REPLACE FUNCTION get_doctor_connected_patients(doctor_uid TEXT)
RETURNS TABLE (
    connection_id UUID,
    patient_firebase_uid TEXT,
    patient_name TEXT,
    patient_email TEXT,
    access_token TEXT,
    access_count INTEGER,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connection_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pdc.id,
        pdc.patient_firebase_uid,
        p.full_name,
        p.email,
        pdc.access_token,
        COALESCE(pdc.access_count, 0),
        pdc.last_accessed_at,
        pdc.token_expires_at,
        pdc.created_at
    FROM patient_doctor_connections pdc
    INNER JOIN profiles p ON p.firebase_uid = pdc.patient_firebase_uid
    WHERE pdc.doctor_firebase_uid = doctor_uid
    AND pdc.is_active = true
    AND pdc.token_expires_at > NOW()
    ORDER BY pdc.last_accessed_at DESC NULLS LAST, pdc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient medical summary for doctors
CREATE OR REPLACE FUNCTION get_patient_medical_summary(patient_uid TEXT)
RETURNS TABLE (
    patient_name TEXT,
    total_conditions INTEGER,
    patient_entered_conditions INTEGER,
    doctor_entered_conditions INTEGER,
    total_medications INTEGER,
    patient_entered_medications INTEGER,
    doctor_entered_medications INTEGER,
    active_medications INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.full_name,
        (SELECT COUNT(*)::INTEGER FROM medical_history mh WHERE mh.patient_firebase_uid = patient_uid),
        (SELECT COUNT(*)::INTEGER FROM medical_history mh WHERE mh.patient_firebase_uid = patient_uid AND mh.patient_entered = true),
        (SELECT COUNT(*)::INTEGER FROM medical_history mh WHERE mh.patient_firebase_uid = patient_uid AND mh.patient_entered = false),
        (SELECT COUNT(*)::INTEGER FROM medications m WHERE m.patient_firebase_uid = patient_uid),
        (SELECT COUNT(*)::INTEGER FROM medications m WHERE m.patient_firebase_uid = patient_uid AND m.patient_entered = true),
        (SELECT COUNT(*)::INTEGER FROM medications m WHERE m.patient_firebase_uid = patient_uid AND m.patient_entered = false),
        (SELECT COUNT(*)::INTEGER FROM medications m WHERE m.patient_firebase_uid = patient_uid AND m.is_active = true)
    FROM profiles p
    WHERE p.firebase_uid = patient_uid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- View for patient-entered medical history
CREATE OR REPLACE VIEW patient_entered_medical_history AS
SELECT 
    mh.*,
    p.full_name as patient_name,
    p.email as patient_email
FROM medical_history mh
INNER JOIN profiles p ON p.firebase_uid = mh.patient_firebase_uid
WHERE mh.patient_entered = true;

-- View for doctor-entered medical history
CREATE OR REPLACE VIEW doctor_entered_medical_history AS
SELECT 
    mh.*,
    p.full_name as patient_name,
    p.email as patient_email,
    dp.full_name as doctor_name
FROM medical_history mh
INNER JOIN profiles p ON p.firebase_uid = mh.patient_firebase_uid
LEFT JOIN profiles dp ON dp.firebase_uid = mh.doctor_firebase_uid
WHERE mh.patient_entered = false;

-- View for active patient-doctor connections with details
CREATE OR REPLACE VIEW active_patient_doctor_connections AS
SELECT 
    pdc.*,
    p.full_name as patient_name,
    p.email as patient_email,
    p.date_of_birth as patient_dob,
    dp.full_name as doctor_name,
    dp.email as doctor_email,
    dp.specialization as doctor_specialization
FROM patient_doctor_connections pdc
INNER JOIN profiles p ON p.firebase_uid = pdc.patient_firebase_uid
LEFT JOIN profiles dp ON dp.firebase_uid = pdc.doctor_firebase_uid
WHERE pdc.is_active = true
AND pdc.token_expires_at > NOW();

-- =====================================================
-- 7. INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample patient-entered medical history (if profiles exist)
INSERT INTO medical_history (
    patient_firebase_uid, 
    condition_name, 
    diagnosis_date, 
    status, 
    severity, 
    notes,
    entry_source,
    patient_entered
)
SELECT 
    firebase_uid,
    'Self-reported Hypertension',
    '2023-01-15',
    'active',
    'moderate',
    'Patient reported family history of high blood pressure',
    'patient',
    true
FROM profiles 
WHERE role = 'patient' 
AND firebase_uid LIKE '%test%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Verify all columns exist
SELECT 
    'Schema fixes completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patient_doctor_connections' AND column_name = 'access_count') as access_count_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patient_doctor_connections' AND column_name = 'last_accessed_at') as last_accessed_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medical_history' AND column_name = 'entry_source') as medical_history_entry_source_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medical_history' AND column_name = 'patient_entered') as medical_history_patient_entered_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'entry_source') as medications_entry_source_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'patient_entered') as medications_patient_entered_exists;

-- Verify data integrity
SELECT 
    'Data integrity check' as check_type,
    (SELECT COUNT(*) FROM patient_doctor_connections WHERE access_count IS NOT NULL) as connections_with_access_count,
    (SELECT COUNT(*) FROM medical_history WHERE entry_source IS NOT NULL) as history_with_entry_source,
    (SELECT COUNT(*) FROM medications WHERE entry_source IS NOT NULL) as medications_with_entry_source;

-- Test helper functions
SELECT 'Function test' as test_type, * FROM get_patient_medical_summary('test-patient-uid') LIMIT 1;
