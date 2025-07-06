# 🗄️ Supabase Database Setup Guide

## Current Status: Mock Database Active

The application is currently using a **mock database** (localStorage) because the local Supabase instance is not available. This is a fallback solution that allows all features to work without requiring Docker Desktop.

## ✅ **Option 1: Continue with Mock Database (Recommended for Testing)**

The mock database provides full functionality for testing:
- ✅ All CRUD operations work
- ✅ Token sharing system functional
- ✅ Medication management working
- ✅ Data persists in browser localStorage
- ✅ No additional setup required

**Limitations:**
- Data is stored locally in browser
- Data doesn't persist across different browsers/devices
- No real-time collaboration features

## 🌐 **Option 2: Setup Cloud Supabase (Production Ready)**

For production use or if you want a real database, follow these steps:

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a project name (e.g., "medical-error-prevention")
4. Set a strong database password
5. Select a region close to your users

### Step 2: Get Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### Step 3: Update Environment Variables
1. Create a `.env.local` file in your project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Update Supabase Client
Update `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-local-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 5: Create Database Tables
1. In Supabase dashboard, go to **SQL Editor**
2. Run the SQL script from `create-profiles-table.sql`:

```sql
-- Create profiles table
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
    specialization TEXT,
    license_number TEXT,
    hospital_affiliation TEXT,
    profile_picture TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other tables (medications, medical_history, etc.)
-- See create-profiles-table.sql for complete schema
```

### Step 6: Configure Row Level Security (Optional)
1. In Supabase dashboard, go to **Authentication** → **Policies**
2. Enable RLS on your tables
3. Create policies for user access control

### Step 7: Test Connection
1. Restart your development server: `npm run dev`
2. Go to `/test-data` and run the Database Debugger
3. Should show "Real Supabase" instead of "Mock"

## 🔧 **Troubleshooting**

### Mock Database Issues
- **Data not persisting**: Check browser localStorage in DevTools
- **Permissions errors**: Mock database bypasses all permissions
- **Complex queries failing**: Mock database has limited query support

### Real Supabase Issues
- **Connection failed**: Check URL and API key in .env file
- **Table not found**: Run the SQL schema creation script
- **Permission denied**: Check RLS policies and authentication
- **CORS errors**: Ensure domain is added to allowed origins

## 🧪 **Testing Both Setups**

### Mock Database Testing
1. Go to `/test-data`
2. Run Database Debugger - should show "Mock (localStorage)"
3. Create test users and test all functionality
4. Check browser DevTools → Application → Local Storage

### Real Supabase Testing
1. Configure cloud Supabase as above
2. Run Database Debugger - should show "Real Supabase"
3. Check Supabase dashboard for created records
4. Test cross-device data synchronization

## 📊 **Feature Comparison**

| Feature | Mock Database | Real Supabase |
|---------|---------------|---------------|
| Setup Complexity | ✅ None | ⚠️ Medium |
| Data Persistence | ⚠️ Browser only | ✅ Cloud |
| Multi-device Sync | ❌ No | ✅ Yes |
| Real-time Updates | ❌ No | ✅ Yes |
| Production Ready | ❌ No | ✅ Yes |
| Offline Support | ✅ Yes | ⚠️ Limited |
| Development Speed | ✅ Fast | ⚠️ Slower |

## 🚀 **Recommendation**

- **For Development/Testing**: Use mock database (current setup)
- **For Production**: Use cloud Supabase
- **For Demo**: Mock database is sufficient

The mock database provides full functionality for testing the patient-doctor token sharing system without any additional setup requirements.
