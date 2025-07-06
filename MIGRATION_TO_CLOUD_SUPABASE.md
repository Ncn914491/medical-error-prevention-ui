# 🚀 Migration to Cloud Supabase - Complete Guide

## Overview

This guide will help you transition from the mock database (localStorage) to a production-ready cloud Supabase database for the medical error prevention system.

## 🎯 What's Changed

### ✅ **Removed:**
- Mock database fallback system
- localStorage-based data storage
- Automatic fallback to mock when Supabase unavailable

### ✅ **Added:**
- Direct cloud Supabase integration
- Environment variable validation
- Setup verification tools
- Comprehensive error handling
- Connection status monitoring

## 📋 **Step-by-Step Migration**

### **Step 1: Create Cloud Supabase Project**

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up/Login** and create new project
3. **Project Details:**
   - Name: `medical-error-prevention`
   - Database Password: Create strong password (save it!)
   - Region: Choose closest to your users
4. **Wait 2-3 minutes** for project initialization

### **Step 2: Get Your Credentials**

1. **In Supabase dashboard → Settings → API**
2. **Copy these values:**
   ```
   Project URL: https://your-project-id.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **Step 3: Update Environment Variables**

**Replace the placeholder values in `.env`:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

**⚠️ Important:** Replace with your actual values from Step 2!

### **Step 4: Create Database Schema**

1. **In Supabase dashboard → SQL Editor**
2. **Click "New Query"**
3. **Copy and paste this complete schema:**

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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. **Click "Run"** to execute the SQL
5. **Verify tables** in Table Editor

### **Step 5: Restart and Test**

1. **Restart development server:** `npm run dev`
2. **Go to:** `http://localhost:5173/test-data`
3. **Check Supabase Setup Guide** - should show "Connected"
4. **Run Database Debugger** - should show "Cloud Supabase Connected"

## 🧪 **Testing the Migration**

### **Test 1: Database Connection**
- ✅ Setup Guide shows "Setup Complete!"
- ✅ Database Debugger shows "Cloud Supabase Connected"
- ✅ All table tests pass

### **Test 2: User Creation**
- ✅ Create test users at `/test-data`
- ✅ Users appear in Supabase dashboard
- ✅ No localStorage data created

### **Test 3: Medication Management**
- ✅ Login as patient: `john.doe@email.com` / `Patient123!`
- ✅ Add medications in "My Medications"
- ✅ Data saves to cloud database
- ✅ Data persists across browser sessions

### **Test 4: Token Sharing**
- ✅ Patient generates sharing token
- ✅ Token appears in Supabase dashboard
- ✅ Doctor can access patient data
- ✅ Token expiration works correctly

### **Test 5: Cross-Device Sync**
- ✅ Login on different browser/device
- ✅ Same data appears
- ✅ Changes sync in real-time

## 🔧 **Troubleshooting**

### **"Missing Supabase environment variables"**
- Check `.env` file has correct values
- Restart dev server after changes
- Ensure no typos in variable names

### **"Please update placeholder values"**
- Replace `your-project-id` with actual project ID
- Replace `your-anon-key` with actual anon key
- Get values from Supabase dashboard

### **"Connection Failed"**
- Verify URL is correct (https://...)
- Check anon key is complete
- Ensure project is active in Supabase

### **"Table doesn't exist"**
- Run the SQL schema in Supabase SQL Editor
- Check Table Editor to verify creation
- Ensure no SQL errors occurred

## 📊 **Migration Benefits**

| Feature | Before (Mock) | After (Cloud) |
|---------|---------------|---------------|
| Data Persistence | Browser only | Cloud storage |
| Multi-device Access | ❌ No | ✅ Yes |
| Real-time Sync | ❌ No | ✅ Yes |
| Backup & Recovery | ❌ No | ✅ Yes |
| Production Ready | ❌ No | ✅ Yes |
| Collaboration | ❌ No | ✅ Yes |
| Scalability | ❌ Limited | ✅ Unlimited |

## 🎉 **Success Indicators**

When migration is complete, you should see:

✅ **Supabase Setup Guide**: "Setup Complete!"  
✅ **Database Debugger**: "Cloud Supabase Connected"  
✅ **All tests pass** in Database Debugger  
✅ **Medication management** saves to cloud  
✅ **Token sharing** works across devices  
✅ **Data persists** across browser sessions  
✅ **No localStorage** data being created  

## 🚀 **Next Steps**

After successful migration:

1. **Test all features thoroughly**
2. **Create production environment**
3. **Set up database backups**
4. **Configure Row Level Security** (optional)
5. **Monitor usage and performance**
6. **Deploy to production hosting**

**Your medical error prevention system is now running on a production-ready cloud database!**
