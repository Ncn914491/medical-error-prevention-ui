# 🗄️ Manual Database Setup for medsafeai Project

## Project Details
- **Project Name**: medsafeai
- **Project ID**: izncvtyzvtloodzmsfhc
- **Project URL**: https://izncvtyzvtloodzmsfhc.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/izncvtyzvtloodzmsfhc

## Step-by-Step Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/izncvtyzvtloodzmsfhc
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### Step 2: Execute Database Schema
Copy and paste the following SQL into the SQL Editor and click **"Run"**:

```sql
-- Medical Error Prevention System - Database Schema
-- Project: medsafeai (izncvtyzvtloodzmsfhc)

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
    patient_firebase_uid TEXT,
    doctor_firebase_uid TEXT,
    access_token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"view_medical_history": true, "view_medications": true, "view_diagnosis": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT,
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
    patient_firebase_uid TEXT,
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
    patient_firebase_uid TEXT,
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

-- Insert a test record to verify setup
INSERT INTO profiles (firebase_uid, email, full_name, role) 
VALUES ('test-setup-uid', 'test@medsafeai.com', 'Database Setup Test', 'patient')
ON CONFLICT (firebase_uid) DO NOTHING;

-- Verify the setup worked
SELECT 'Database setup completed successfully!' as status, 
       COUNT(*) as test_records_created 
FROM profiles 
WHERE firebase_uid = 'test-setup-uid';
```

### Step 3: Verify Table Creation
1. After running the SQL, you should see a success message
2. Go to **"Table Editor"** in the left sidebar
3. Verify these 5 tables were created:
   - ✅ profiles
   - ✅ patient_doctor_connections
   - ✅ medical_history
   - ✅ medications
   - ✅ analysis_results

### Step 4: Test Application Connection
1. Go to: http://localhost:5174/test-data
2. Check **"Supabase Setup Guide"** - should show "Setup Complete!"
3. Run **"Database Debugger"** - should show "Cloud Supabase Connected"
4. All table tests should pass ✅

## Expected Results

### ✅ Success Indicators:
- **SQL Execution**: No errors, success message displayed
- **Tables Created**: 5 tables visible in Table Editor
- **Test Record**: 1 test record created in profiles table
- **App Connection**: "Cloud Supabase Connected" status
- **All Tests Pass**: Database Debugger shows all green checkmarks

### ❌ Troubleshooting:
- **Permission Errors**: Check project permissions and API keys
- **Table Exists Errors**: Normal if running multiple times (IF NOT EXISTS)
- **Connection Failed**: Verify environment variables in .env file
- **Missing Tables**: Re-run the SQL script completely

## Next Steps After Setup

1. **Create Test Users**: Use the test data creation tools
2. **Test Medication Management**: Add/edit patient medications
3. **Test Token Sharing**: Generate and use patient-doctor tokens
4. **Verify Data Persistence**: Check data survives browser restart

Your medsafeai database is now ready for the medical error prevention system! 🎉
