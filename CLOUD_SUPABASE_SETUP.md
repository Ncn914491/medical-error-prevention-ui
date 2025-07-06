# 🌐 Cloud Supabase Setup Guide

## Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up/Login** with your account
3. **Click "New Project"**
4. **Fill in project details:**
   - **Organization**: Select or create one
   - **Name**: `medical-error-prevention` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

5. **Click "Create new project"**
6. **Wait 2-3 minutes** for project initialization

## Step 2: Get Project Credentials

1. **In your Supabase dashboard, go to Settings → API**
2. **Copy the following values:**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJ...` (long string starting with eyJ)

## Step 3: Update Environment Variables

**Replace the placeholder values in your `.env` file:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key-here
```

**⚠️ Important**: Replace `your-actual-project-id` and the anon key with your real values!

## Step 4: Create Database Tables

1. **In Supabase dashboard, go to SQL Editor**
2. **Click "New Query"**
3. **Copy and paste the following SQL schema:**

```sql
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
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    doctor_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    access_token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"view_medical_history": true, "view_medications": true, "view_diagnosis": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_firebase_uid, doctor_firebase_uid)
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
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
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
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
    patient_firebase_uid TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
    doctor_firebase_uid TEXT REFERENCES profiles(firebase_uid),
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
  FOR EACH ROW EXECUTE FUNCTION update_medications_updated_at_column();
```

4. **Click "Run"** to execute the SQL
5. **Verify tables were created** in the Table Editor

## Step 5: Configure Authentication (Optional)

1. **Go to Authentication → Settings**
2. **Enable Email/Password** if you want users to sign up directly
3. **Configure OAuth providers** if needed
4. **Set up email templates** for password reset, etc.

## Step 6: Test Connection

1. **Restart your development server**: `npm run dev`
2. **Go to**: `http://localhost:5173/test-data`
3. **Run Database Debugger**
4. **Should show**: "Database Status: Real Supabase" ✅
5. **All tests should pass** ✅

## Step 7: Test Complete Workflow

1. **Create test users** at `/test-data`
2. **Login as patient**: `john.doe@email.com` / `Patient123!`
3. **Add medications** - should save to cloud database
4. **Generate sharing token** - should create in cloud database
5. **Login as doctor**: `dr.smith@medsafe.com` / `Doctor123!`
6. **Enter patient token** - should retrieve data from cloud database
7. **Verify data persistence** across browser sessions

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Check your `.env` file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Restart your dev server after updating .env

### "Supabase credentials not configured"
- Make sure you replaced the placeholder values with real ones from your Supabase dashboard
- URL should be `https://your-project-id.supabase.co` (not localhost)

### "Table doesn't exist" errors
- Run the SQL schema in Supabase SQL Editor
- Check the Table Editor to verify tables were created

### "Permission denied" errors
- Tables are created without RLS by default for development
- For production, enable Row Level Security and create appropriate policies

## 🎯 Success Indicators

✅ **Environment variables configured**  
✅ **Database tables created**  
✅ **Connection test passes**  
✅ **Medication management works**  
✅ **Token generation works**  
✅ **Doctor access works**  
✅ **Data persists across sessions**  

## 🚀 Next Steps

Once cloud Supabase is working:
1. Remove mock database fallback code
2. Test all features thoroughly
3. Consider enabling Row Level Security for production
4. Set up database backups
5. Monitor usage and performance

**Your medical error prevention system is now running on a production-ready cloud database!**
