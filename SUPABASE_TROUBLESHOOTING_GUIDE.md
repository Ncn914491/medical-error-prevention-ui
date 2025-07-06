# 🔧 Supabase Connection Troubleshooting Guide

## Quick Diagnostic Steps

### Step 1: Run Diagnostics
1. **Go to**: http://localhost:5174/test-data
2. **Find**: "Supabase Diagnostics" section (top of page)
3. **Click**: "Run Diagnostics" button
4. **Review**: Results for specific error messages

### Step 2: Check Environment Variables
**Expected Configuration:**
```
VITE_SUPABASE_URL=https://iznvctyzvtloodzmsfhc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Common Issues:**
- ❌ Missing environment variables
- ❌ Incorrect URL format
- ❌ Invalid anon key format
- ❌ Server not restarted after .env changes

### Step 3: Verify Database Tables
**Required Tables:**
- ✅ `profiles`
- ✅ `medications`
- ✅ `medical_history`
- ✅ `patient_doctor_connections`
- ✅ `analysis_results`

## Common Error Scenarios & Solutions

### 🚨 Error: "relation 'profiles' does not exist"

**Cause**: Database tables haven't been created

**Solution**:
1. **Manual Setup** (Recommended):
   - Go to: https://supabase.com/dashboard/project/iznvctyzvtloodzmsfhc
   - Navigate to **SQL Editor**
   - Copy contents of `simplified-medical-schema.sql`
   - Paste and click **"Run"**

2. **Automated Setup**:
   - Go to `/test-data`
   - Use "Database Setup" component
   - Click "Setup Tables"

### 🚨 Error: "Invalid API key"

**Cause**: Incorrect or expired anon key

**Solution**:
1. **Get Fresh Key**:
   - Go to Supabase dashboard → Settings → API
   - Copy the **Anon/Public Key**
   - Update `.env` file
   - Restart dev server: `npm run dev`

### 🚨 Error: "Row Level Security policy violation"

**Cause**: RLS policies blocking operations

**Solution**:
1. **Use Simplified Schema**:
   - Run `simplified-medical-schema.sql` (disables RLS)
   - This is hackathon-friendly for testing

2. **Or Disable RLS Manually**:
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
   ALTER TABLE medical_history DISABLE ROW LEVEL SECURITY;
   ALTER TABLE patient_doctor_connections DISABLE ROW LEVEL SECURITY;
   ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;
   ```

### 🚨 Error: "Connection timeout" or "Network error"

**Cause**: Network connectivity issues

**Solution**:
1. **Check Internet Connection**
2. **Verify Supabase Project Status**:
   - Go to: https://supabase.com/dashboard/project/iznvctyzvtloodzmsfhc
   - Ensure project is active and not paused
3. **Check Firewall/VPN**: Disable temporarily to test

### 🚨 Error: "JWT expired" or "Invalid JWT"

**Cause**: Authentication token issues

**Solution**:
1. **Refresh Anon Key**:
   - Get new anon key from Supabase dashboard
   - Update `.env` file
   - Restart server

2. **Check Key Format**:
   - Should start with `eyJ`
   - Should be ~200+ characters long

## Step-by-Step Resolution Process

### Phase 1: Environment Check
```bash
# 1. Verify .env file exists and has correct values
cat .env

# 2. Restart development server
npm run dev
```

### Phase 2: Database Setup
1. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/iznvctyzvtloodzmsfhc
   - Navigate to **SQL Editor**

2. **Run Simplified Schema**:
   - Copy `simplified-medical-schema.sql`
   - Paste in SQL Editor
   - Click **"Run"**
   - Verify success message

### Phase 3: Test Connection
1. **Go to**: http://localhost:5174/test-data
2. **Run**: "Supabase Diagnostics"
3. **Check**: All tests should pass ✅

### Phase 4: Test CRUD Operations
1. **Run**: "Medical Data Setup" to create test data
2. **Login**: As test patient
3. **Test**: Add/edit medications
4. **Verify**: Data persists in Supabase dashboard

## Diagnostic Commands

### Browser Console Tests
```javascript
// Test environment variables
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)

// Test basic connection
import { supabase } from './src/lib/supabase'
supabase.from('profiles').select('count', { count: 'exact', head: true })
  .then(result => console.log('Connection test:', result))
```

### Network Tab Inspection
1. **Open**: Browser DevTools → Network tab
2. **Run**: Any database operation
3. **Look for**: 
   - ❌ 401/403 errors (authentication)
   - ❌ 404 errors (table not found)
   - ❌ 500 errors (server issues)
   - ✅ 200 responses (success)

## Quick Fixes Checklist

### ✅ Environment Issues
- [ ] `.env` file exists in project root
- [ ] Environment variables are correctly formatted
- [ ] Development server restarted after .env changes
- [ ] No typos in variable names

### ✅ Database Issues
- [ ] All 5 tables created in Supabase
- [ ] RLS disabled for testing (hackathon mode)
- [ ] Storage bucket `profile-pictures` exists
- [ ] Test data can be inserted successfully

### ✅ Authentication Issues
- [ ] Anon key is current and valid
- [ ] Project is active in Supabase dashboard
- [ ] No expired or revoked keys

### ✅ Network Issues
- [ ] Internet connection stable
- [ ] No firewall blocking Supabase
- [ ] VPN not interfering with connection

## Success Indicators

When everything is working correctly:

✅ **Diagnostics**: All tests pass with green checkmarks  
✅ **Tables**: All 5 tables accessible  
✅ **Insert**: Test data can be created  
✅ **Read**: Data can be retrieved  
✅ **Update**: Records can be modified  
✅ **Delete**: Records can be removed  

## Emergency Reset Procedure

If all else fails:

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
2. **Restart Dev Server**: `npm run dev`
3. **Reset Database**: Re-run `simplified-medical-schema.sql`
4. **Verify Credentials**: Get fresh anon key from Supabase
5. **Test Minimal Case**: Single table insert/select

## Getting Help

If issues persist:

1. **Check Diagnostics Output**: Copy error messages
2. **Check Browser Console**: Look for JavaScript errors
3. **Check Network Tab**: Look for failed HTTP requests
4. **Check Supabase Logs**: In dashboard → Logs section

**Most Common Solution**: Run the simplified schema SQL to create tables without RLS restrictions.
