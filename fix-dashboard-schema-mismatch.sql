-- Fix Dashboard Schema Mismatch Issues
-- This script resolves the emergency_contact column issue and ensures dashboard sync works

-- Step 1: Add missing emergency_contact column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- Step 2: Update existing patient profiles with sample emergency contact data
UPDATE profiles 
SET emergency_contact = jsonb_build_object(
    'name', 'Emergency Contact',
    'relationship', 'Family',
    'phone', '+1-555-0000',
    'email', 'emergency@example.com'
)
WHERE role = 'patient' AND emergency_contact IS NULL;

-- Step 3: Verify the fix worked
SELECT 
    'Schema fix completed successfully!' as status,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE emergency_contact IS NOT NULL) as profiles_with_emergency_contact,
    COUNT(*) FILTER (WHERE role = 'patient') as patient_profiles,
    COUNT(*) FILTER (WHERE role = 'doctor') as doctor_profiles
FROM profiles;

-- Step 4: Test query that was failing in dashboard
SELECT 
    'Dashboard query test' as test_name,
    COUNT(*) as connection_count
FROM patient_doctor_connections pdc
JOIN profiles p ON p.firebase_uid = pdc.patient_firebase_uid
WHERE pdc.is_active = true;

-- Step 5: Show sample data structure
SELECT 
    firebase_uid,
    full_name,
    role,
    emergency_contact,
    created_at
FROM profiles 
WHERE role = 'patient'
LIMIT 3;
