-- Critical Issues Schema Fix for Medical Safety System
-- Project: iznvctyzvtloodzmsfhc
-- Fixes: Missing access_count column and other critical schema issues

-- =====================================================
-- 1. ADD MISSING ACCESS_COUNT COLUMN
-- =====================================================

-- Add access_count column to patient_doctor_connections if it doesn't exist
ALTER TABLE patient_doctor_connections 
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Add last_accessed_at column if it doesn't exist
ALTER TABLE patient_doctor_connections 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have default access_count
UPDATE patient_doctor_connections 
SET access_count = 0 
WHERE access_count IS NULL;

-- =====================================================
-- 2. ENHANCE MEDICAL_HISTORY TABLE FOR MANUAL ENTRY
-- =====================================================

-- Add columns for manual patient entry
ALTER TABLE medical_history 
ADD COLUMN IF NOT EXISTS patient_entered BOOLEAN DEFAULT false;

ALTER TABLE medical_history 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'doctor';

-- Add index for patient-entered records
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_entered 
ON medical_history(patient_firebase_uid, patient_entered);

-- =====================================================
-- 3. ENHANCE MEDICATIONS TABLE FOR MANUAL ENTRY
-- =====================================================

-- Add columns for manual patient entry
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS patient_entered BOOLEAN DEFAULT false;

ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'doctor';

-- Add index for patient-entered medications
CREATE INDEX IF NOT EXISTS idx_medications_patient_entered 
ON medications(patient_firebase_uid, patient_entered);

-- =====================================================
-- 4. CREATE FUNCTION TO INCREMENT ACCESS COUNT
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

-- =====================================================
-- 5. CREATE REAL-TIME NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to notify when medications are updated
CREATE OR REPLACE FUNCTION notify_medication_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify about medication changes for real-time sync
    PERFORM pg_notify(
        'medication_change',
        json_build_object(
            'patient_firebase_uid', COALESCE(NEW.patient_firebase_uid, OLD.patient_firebase_uid),
            'action', TG_OP,
            'medication_id', COALESCE(NEW.id, OLD.id),
            'timestamp', NOW()
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for medication changes
DROP TRIGGER IF EXISTS medication_change_trigger ON medications;
CREATE TRIGGER medication_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON medications
    FOR EACH ROW EXECUTE FUNCTION notify_medication_change();

-- Function to notify when medical history is updated
CREATE OR REPLACE FUNCTION notify_medical_history_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify about medical history changes for real-time sync
    PERFORM pg_notify(
        'medical_history_change',
        json_build_object(
            'patient_firebase_uid', COALESCE(NEW.patient_firebase_uid, OLD.patient_firebase_uid),
            'action', TG_OP,
            'history_id', COALESCE(NEW.id, OLD.id),
            'timestamp', NOW()
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for medical history changes
DROP TRIGGER IF EXISTS medical_history_change_trigger ON medical_history;
CREATE TRIGGER medical_history_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION notify_medical_history_change();

-- =====================================================
-- 6. CREATE HELPER VIEWS FOR PATIENT DATA
-- =====================================================

-- View for patient's complete medical profile
CREATE OR REPLACE VIEW patient_medical_profile AS
SELECT 
    p.id,
    p.firebase_uid,
    p.full_name,
    p.email,
    p.date_of_birth,
    p.gender,
    p.emergency_contact,
    -- Medication summary
    (SELECT COUNT(*) FROM medications m WHERE m.patient_firebase_uid = p.firebase_uid AND m.is_active = true) as active_medications_count,
    (SELECT COUNT(*) FROM medications m WHERE m.patient_firebase_uid = p.firebase_uid AND m.patient_entered = true) as patient_entered_medications_count,
    -- Medical history summary
    (SELECT COUNT(*) FROM medical_history mh WHERE mh.patient_firebase_uid = p.firebase_uid AND mh.status = 'active') as active_conditions_count,
    (SELECT COUNT(*) FROM medical_history mh WHERE mh.patient_firebase_uid = p.firebase_uid AND mh.patient_entered = true) as patient_entered_conditions_count,
    -- Connection summary
    (SELECT COUNT(*) FROM patient_doctor_connections pdc WHERE pdc.patient_firebase_uid = p.firebase_uid AND pdc.is_active = true) as active_doctor_connections
FROM profiles p
WHERE p.role = 'patient';

-- =====================================================
-- 7. UPDATE EXISTING DATA
-- =====================================================

-- Set default values for existing records
UPDATE patient_doctor_connections 
SET access_count = 0 
WHERE access_count IS NULL;

UPDATE medical_history 
SET patient_entered = false, entry_source = 'doctor'
WHERE patient_entered IS NULL;

UPDATE medications 
SET patient_entered = false, entry_source = 'doctor'
WHERE patient_entered IS NULL;

-- =====================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for access tracking
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_access_count 
ON patient_doctor_connections(access_count);

CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_last_accessed 
ON patient_doctor_connections(last_accessed_at);

-- Composite index for active connections with access info
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_active_access 
ON patient_doctor_connections(doctor_firebase_uid, is_active, last_accessed_at) 
WHERE is_active = true;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify the schema fixes
SELECT 
    'Critical schema fixes completed!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patient_doctor_connections' AND column_name = 'access_count') as access_count_column_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medical_history' AND column_name = 'patient_entered') as medical_history_patient_entered_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'patient_entered') as medications_patient_entered_exists,
    (SELECT COUNT(*) FROM patient_doctor_connections WHERE access_count IS NOT NULL) as connections_with_access_count,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'increment_access_count') as increment_function_exists;
