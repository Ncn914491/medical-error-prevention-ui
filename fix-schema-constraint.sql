-- Fix for patient_doctor_connections constraint issue
-- This script removes the problematic unique constraint that prevents token-based sharing

-- Step 1: Drop the existing unique constraint
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_doctor_fire_key;

-- Step 2: Drop any other similar constraints that might exist
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_doctor_firebase_uid_key;

-- Step 3: Add a more appropriate constraint that allows the token workflow
-- This constraint ensures that each active token is unique per patient-doctor pair
-- but allows multiple inactive tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_doctor_active_connection 
ON patient_doctor_connections (patient_firebase_uid, doctor_firebase_uid) 
WHERE is_active = true AND doctor_firebase_uid IS NOT NULL;

-- Step 4: Ensure access_token remains unique (this should already exist)
-- This is the primary constraint we need for token-based sharing
ALTER TABLE patient_doctor_connections 
ADD CONSTRAINT IF NOT EXISTS patient_doctor_connections_access_token_unique 
UNIQUE (access_token);

-- Step 5: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_patient_uid 
ON patient_doctor_connections (patient_firebase_uid);

CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_doctor_uid 
ON patient_doctor_connections (doctor_firebase_uid);

CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_token 
ON patient_doctor_connections (access_token);

CREATE INDEX IF NOT EXISTS idx_patient_doctor_connections_active 
ON patient_doctor_connections (is_active, token_expires_at);

-- Step 6: Clean up any duplicate or problematic records
-- Deactivate old connections that might cause issues
UPDATE patient_doctor_connections 
SET is_active = false 
WHERE token_expires_at < NOW();

-- Step 7: Add a comment explaining the new constraint strategy
COMMENT ON TABLE patient_doctor_connections IS 
'Token-based patient-doctor connections. Each access_token is unique. 
Multiple connections between same patient-doctor pair are allowed for different time periods,
but only one can be active at a time (enforced by partial unique index).';

-- Verification query to check the constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patient_doctor_connections'::regclass;
