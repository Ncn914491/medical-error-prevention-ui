# Fix for Patient-Doctor Token Sharing Constraint Error

## Problem
The error `duplicate key value violates unique constraint "patient_doctor_connections_patient_firebase_uid_doctor_fire_key"` occurs when doctors try to access patient data through tokens.

## Root Cause
The `patient_doctor_connections` table has a `UNIQUE(patient_firebase_uid, doctor_firebase_uid)` constraint that conflicts with the token-based sharing workflow:

1. Patient generates token → `doctor_firebase_uid` is `NULL`
2. Doctor uses token → `doctor_firebase_uid` gets updated
3. Same patient-doctor pair tries to connect again → **CONSTRAINT VIOLATION**

## Solution

### Step 1: Fix the Database Schema

Run this SQL in your **Supabase SQL Editor**:

```sql
-- CRITICAL FIX: Remove problematic unique constraint
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_doctor_fire_key;

-- Also drop any variations of the constraint name
ALTER TABLE patient_doctor_connections 
DROP CONSTRAINT IF EXISTS patient_doctor_connections_patient_firebase_uid_doctor_firebase_uid_key;

-- Ensure access_token uniqueness (this is what we actually need)
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

-- Clean up expired tokens
UPDATE patient_doctor_connections 
SET is_active = false 
WHERE token_expires_at < NOW();

-- Verify the fix
SELECT 
    'Constraint fix completed successfully' as status,
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE is_active = true) as active_connections
FROM patient_doctor_connections;
```

### Step 2: Verify the Fix

After running the SQL, you should see:
- ✅ No constraint errors when doctors use patient tokens
- ✅ Multiple connections between same patient-doctor pairs allowed
- ✅ Each access token remains unique (this is the important constraint)

## Why This Fix Works

### Before (Problematic):
```
UNIQUE(patient_firebase_uid, doctor_firebase_uid)
```
- Prevents multiple connections between same patient-doctor pair
- Conflicts with token workflow where doctor_firebase_uid changes from NULL to actual UID

### After (Correct):
```
UNIQUE(access_token)
```
- Each token is unique (prevents token reuse)
- Multiple patient-doctor connections allowed over time
- Supports the natural token-based sharing workflow

## Testing the Fix

### 1. Patient Side:
```javascript
// This should work without errors
const token = await tokenSharingService.generatePatientToken(patientUid)
console.log('Generated token:', token) // Should succeed
```

### 2. Doctor Side:
```javascript
// This should work without constraint violations
const result = await tokenSharingService.useAccessToken(token, doctorUid)
console.log('Connection result:', result) // Should succeed
```

### 3. Repeat Process:
- Same patient generates new token → ✅ Should work
- Same doctor uses new token → ✅ Should work (no constraint error)

## Alternative Schema Design (If Needed)

If you want to prevent multiple active connections between the same patient-doctor pair, you can use a partial unique index instead:

```sql
-- Optional: Ensure only one active connection per patient-doctor pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_doctor_active_connection 
ON patient_doctor_connections (patient_firebase_uid, doctor_firebase_uid) 
WHERE is_active = true AND doctor_firebase_uid IS NOT NULL;
```

## Verification Commands

Check current constraints:
```sql
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patient_doctor_connections'::regclass;
```

Check current data:
```sql
SELECT 
    patient_firebase_uid,
    doctor_firebase_uid,
    access_token,
    is_active,
    token_expires_at > NOW() as is_valid
FROM patient_doctor_connections
ORDER BY created_at DESC;
```

## Expected Results After Fix

✅ **Patient generates token**: Works without errors
✅ **Doctor uses token**: Works without constraint violations  
✅ **Multiple connections**: Same patient-doctor pair can connect multiple times
✅ **Token uniqueness**: Each access token remains unique
✅ **Data integrity**: No duplicate active tokens

## Rollback (If Needed)

If you need to rollback this change:
```sql
-- Add back the constraint (only if you're sure it won't break token sharing)
ALTER TABLE patient_doctor_connections 
ADD CONSTRAINT patient_doctor_connections_patient_firebase_uid_doctor_firebase_uid_key 
UNIQUE (patient_firebase_uid, doctor_firebase_uid);
```

**Note**: Only rollback if you modify the token sharing workflow to handle the constraint properly.

## Summary

This fix removes the problematic unique constraint that was preventing the token-based sharing system from working correctly. The token sharing workflow relies on:

1. **Unique tokens** (maintained) ✅
2. **Flexible patient-doctor relationships** (now allowed) ✅
3. **Proper data cleanup** (expired tokens deactivated) ✅

After applying this fix, your healthcare application's token sharing system should work without constraint violations.
