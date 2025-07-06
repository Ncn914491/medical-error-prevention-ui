-- CRITICAL FIX: Remove problematic unique constraint from patient_doctor_connections
-- Run this in Supabase SQL Editor to fix the token sharing issue

-- Step 1: Drop the problematic unique constraint
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_doctor_fire_key;

-- Step 2: Drop any variations of the constraint name
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_doctor_firebase_uid_key;

-- Step 3: Ensure access_token uniqueness (this is what we actually need)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patient_doctor_connections_access_token_key'
    ) THEN
        ALTER TABLE patient_doctor_connections 
        ADD CONSTRAINT patient_doctor_connections_access_token_key UNIQUE (access_token);
    END IF;
END $$;

-- Step 4: Clean up expired tokens to prevent future issues
UPDATE patient_doctor_connections 
SET is_active = false 
WHERE token_expires_at < NOW();

-- Step 5: Verify the fix worked
SELECT 
    'Constraint fix completed successfully' as status,
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE is_active = true) as active_connections,
    COUNT(*) FILTER (WHERE token_expires_at > NOW()) as valid_tokens
FROM patient_doctor_connections;
