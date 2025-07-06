import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, checkSupabaseConnection } from '../lib/supabase'
import { tokenSharingService } from '../services/tokenSharingService'
import { 
  Database, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Pill,
  Key,
  User
} from 'lucide-react'

const DatabaseDebugger = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState('unknown')

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const isConnected = await checkSupabaseConnection()
      setDbStatus(isConnected ? 'cloud' : 'disconnected')
    } catch (err) {
      setDbStatus('error')
    }
  }

  const addTestResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runDatabaseTests = async () => {
    setLoading(true)
    setTestResults([])

    try {
      // Test 1: Check database connection
      const connectionStatus = dbStatus === 'cloud' ? 'Cloud Supabase' :
                              dbStatus === 'disconnected' ? 'Disconnected' : 'Error'
      addTestResult('Database Connection', dbStatus === 'cloud', `Status: ${connectionStatus}`)

      // Test environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const hasValidUrl = supabaseUrl && !supabaseUrl.includes('your-project-id')
      addTestResult('Environment Config', hasValidUrl,
        hasValidUrl ? `URL configured: ${supabaseUrl}` : 'Please configure VITE_SUPABASE_URL in .env file')

      // Test 2: Test profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        if (error) {
          addTestResult('Profiles Table', false, `Error: ${error.message}`)
        } else {
          addTestResult('Profiles Table', true, `Accessible, ${data?.length || 0} records found`)
        }
      } catch (err) {
        addTestResult('Profiles Table', false, `Exception: ${err.message}`)
      }

      // Test 3: Test medications table
      try {
        const { data, error } = await supabase
          .from('medications')
          .select('*')
          .limit(1)
        
        if (error) {
          addTestResult('Medications Table', false, `Error: ${error.message}`)
        } else {
          addTestResult('Medications Table', true, `Accessible, ${data?.length || 0} records found`)
        }
      } catch (err) {
        addTestResult('Medications Table', false, `Exception: ${err.message}`)
      }

      // Test 4: Test patient_doctor_connections table
      try {
        const { data, error } = await supabase
          .from('patient_doctor_connections')
          .select('*')
          .limit(1)
        
        if (error) {
          addTestResult('Token Connections Table', false, `Error: ${error.message}`)
        } else {
          addTestResult('Token Connections Table', true, `Accessible, ${data?.length || 0} records found`)
        }
      } catch (err) {
        addTestResult('Token Connections Table', false, `Exception: ${err.message}`)
      }

      // Test 5: Test medication insertion (if user is logged in)
      if (user) {
        try {
          const testMedication = {
            patient_firebase_uid: user.uid,
            medication_name: 'Test Medication',
            dosage: '10mg',
            frequency: 'Once daily',
            start_date: '2024-01-01',
            is_active: true
          }

          const { data, error } = await supabase
            .from('medications')
            .insert([testMedication])
            .select()
            .single()

          if (error) {
            addTestResult('Medication Insert', false, `Error: ${error.message}`)
          } else {
            addTestResult('Medication Insert', true, `Success: Created medication with ID ${data.id}`)
            
            // Clean up test data
            await supabase
              .from('medications')
              .delete()
              .eq('id', data.id)
          }
        } catch (err) {
          addTestResult('Medication Insert', false, `Exception: ${err.message}`)
        }

        // Test 6: Test token generation
        try {
          const result = await tokenSharingService.generatePatientToken(user.uid, 1)
          
          if (result.success) {
            addTestResult('Token Generation', true, `Success: Generated token ${result.token}`)
            
            // Clean up test token
            try {
              await supabase
                .from('patient_doctor_connections')
                .delete()
                .eq('access_token', result.token)
            } catch (cleanupErr) {
              console.warn('Token cleanup failed:', cleanupErr)
            }
          } else {
            addTestResult('Token Generation', false, `Error: ${result.error?.message || 'Unknown error'}`)
          }
        } catch (err) {
          addTestResult('Token Generation', false, `Exception: ${err.message}`)
        }
      } else {
        addTestResult('User Authentication', false, 'No user logged in - skipping user-specific tests')
      }

    } catch (err) {
      addTestResult('General Error', false, `Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Database Debugger</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={clearTestResults}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={runDatabaseTests}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {loading ? 'Testing...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {/* Database Status */}
      <div className={`mb-4 p-3 border rounded-lg ${
        dbStatus === 'cloud' ? 'bg-green-50 border-green-200' :
        dbStatus === 'disconnected' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Database className={`w-4 h-4 ${
            dbStatus === 'cloud' ? 'text-green-600' :
            dbStatus === 'disconnected' ? 'text-yellow-600' :
            'text-red-600'
          }`} />
          <span className={`font-medium ${
            dbStatus === 'cloud' ? 'text-green-800' :
            dbStatus === 'disconnected' ? 'text-yellow-800' :
            'text-red-800'
          }`}>
            Database Status: {
              dbStatus === 'cloud' ? 'Cloud Supabase Connected' :
              dbStatus === 'disconnected' ? 'Not Connected' :
              'Configuration Error'
            }
          </span>
        </div>
        {dbStatus === 'cloud' && (
          <p className="text-green-700 text-sm mt-1">
            ✅ Connected to cloud Supabase database
          </p>
        )}
        {dbStatus === 'disconnected' && (
          <p className="text-yellow-700 text-sm mt-1">
            ⚠️ Please configure Supabase credentials in .env file
          </p>
        )}
        {dbStatus === 'error' && (
          <p className="text-red-700 text-sm mt-1">
            ❌ Error connecting to database - check configuration
          </p>
        )}
      </div>

      {/* User Status */}
      {user && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-green-800 font-medium">
              User: {user.email} (UID: {user.uid.substring(0, 8)}...)
            </span>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Test Results:</h4>
          {testResults.map((result, index) => (
            <div key={index} className={`p-3 rounded border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.test}
                </span>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              <p className={`text-sm mt-1 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>
              {result.data && (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Click "Run Tests" to check database connectivity and operations</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Running database tests...
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabaseDebugger
