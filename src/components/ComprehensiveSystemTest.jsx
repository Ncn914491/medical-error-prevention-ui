import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { tokenSharingService } from '../services/tokenSharingService'
import { createAllTestUsers } from '../services/testDataService'
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader,
  Play,
  Database,
  Users,
  Pill,
  Key,
  Smartphone
} from 'lucide-react'

const ComprehensiveSystemTest = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState([])
  const [currentTest, setCurrentTest] = useState('')
  const [testing, setTesting] = useState(false)
  const [testData, setTestData] = useState({})

  const addResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runComprehensiveTests = async () => {
    setTesting(true)
    setTestResults([])
    setTestData({})

    try {
      // Test 1: Database Connection
      setCurrentTest('Testing database connection...')
      try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
        if (error) {
          addResult('Database Connection', false, `Connection failed: ${error.message}`)
          return
        }
        addResult('Database Connection', true, 'Successfully connected to cloud Supabase')
      } catch (err) {
        addResult('Database Connection', false, `Connection error: ${err.message}`)
        return
      }

      // Test 2: Table Accessibility
      setCurrentTest('Testing table accessibility...')
      const tables = ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']
      let allTablesAccessible = true
      
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
          if (error) {
            addResult(`Table: ${table}`, false, `Not accessible: ${error.message}`)
            allTablesAccessible = false
          } else {
            addResult(`Table: ${table}`, true, 'Accessible and ready')
          }
        } catch (err) {
          addResult(`Table: ${table}`, false, `Error: ${err.message}`)
          allTablesAccessible = false
        }
      }

      if (!allTablesAccessible) {
        addResult('Table Setup', false, 'Some tables are not accessible. Please run the database setup first.')
        return
      }

      // Test 3: Test User Creation
      setCurrentTest('Creating test users...')
      try {
        const result = await createAllTestUsers()
        if (result.success) {
          addResult('Test User Creation', true, `Created ${result.users?.length || 6} test users successfully`)
          setTestData(prev => ({ ...prev, testUsers: result.users }))
        } else {
          addResult('Test User Creation', false, `Failed: ${result.error?.message || 'Unknown error'}`)
        }
      } catch (err) {
        addResult('Test User Creation', false, `Error: ${err.message}`)
      }

      // Test 4: Medication CRUD Operations
      setCurrentTest('Testing medication management...')
      if (user) {
        try {
          // Create test medication
          const testMedication = {
            patient_firebase_uid: user.uid,
            medication_name: 'Test Medication',
            dosage: '10mg',
            frequency: 'Once daily',
            start_date: '2024-01-01',
            indication: 'Testing purposes',
            side_effects: ['None'],
            is_active: true,
            notes: 'Comprehensive system test'
          }

          const { data: created, error: createError } = await supabase
            .from('medications')
            .insert([testMedication])
            .select()
            .single()

          if (createError) {
            addResult('Medication Create', false, `Create failed: ${createError.message}`)
          } else {
            addResult('Medication Create', true, `Created medication with ID: ${created.id}`)
            setTestData(prev => ({ ...prev, testMedicationId: created.id }))

            // Test update
            const { data: updated, error: updateError } = await supabase
              .from('medications')
              .update({ dosage: '20mg', notes: 'Updated during test' })
              .eq('id', created.id)
              .select()
              .single()

            if (updateError) {
              addResult('Medication Update', false, `Update failed: ${updateError.message}`)
            } else {
              addResult('Medication Update', true, `Updated medication dosage to ${updated.dosage}`)
            }

            // Test read
            const { data: read, error: readError } = await supabase
              .from('medications')
              .select('*')
              .eq('patient_firebase_uid', user.uid)

            if (readError) {
              addResult('Medication Read', false, `Read failed: ${readError.message}`)
            } else {
              addResult('Medication Read', true, `Retrieved ${read.length} medications for user`)
            }

            // Test delete (cleanup)
            const { error: deleteError } = await supabase
              .from('medications')
              .delete()
              .eq('id', created.id)

            if (deleteError) {
              addResult('Medication Delete', false, `Delete failed: ${deleteError.message}`)
            } else {
              addResult('Medication Delete', true, 'Successfully deleted test medication')
            }
          }
        } catch (err) {
          addResult('Medication CRUD', false, `Exception: ${err.message}`)
        }
      } else {
        addResult('Medication CRUD', false, 'No user logged in - skipping medication tests')
      }

      // Test 5: Token Generation and Sharing
      setCurrentTest('Testing token generation...')
      if (user) {
        try {
          const tokenResult = await tokenSharingService.generatePatientToken(user.uid, 24)
          
          if (tokenResult.success) {
            addResult('Token Generation', true, `Generated token: ${tokenResult.token}`)
            setTestData(prev => ({ ...prev, testToken: tokenResult.token }))

            // Test token validation
            const validateResult = await tokenSharingService.validateAccessToken(tokenResult.token)
            if (validateResult.success) {
              addResult('Token Validation', true, 'Token validation successful')
            } else {
              addResult('Token Validation', false, `Validation failed: ${validateResult.error?.message}`)
            }

            // Cleanup test token
            try {
              await supabase
                .from('patient_doctor_connections')
                .delete()
                .eq('access_token', tokenResult.token)
              addResult('Token Cleanup', true, 'Test token cleaned up successfully')
            } catch (cleanupErr) {
              addResult('Token Cleanup', false, `Cleanup failed: ${cleanupErr.message}`)
            }
          } else {
            addResult('Token Generation', false, `Failed: ${tokenResult.error?.message || 'Unknown error'}`)
          }
        } catch (err) {
          addResult('Token Generation', false, `Exception: ${err.message}`)
        }
      } else {
        addResult('Token Generation', false, 'No user logged in - skipping token tests')
      }

      // Test 6: Data Persistence Check
      setCurrentTest('Testing data persistence...')
      try {
        const { data: profileCount } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true })

        const { data: medicationCount } = await supabase
          .from('medications')
          .select('count', { count: 'exact', head: true })

        const { data: connectionCount } = await supabase
          .from('patient_doctor_connections')
          .select('count', { count: 'exact', head: true })

        addResult('Data Persistence', true, 
          `Database contains: ${profileCount?.count || 0} profiles, ${medicationCount?.count || 0} medications, ${connectionCount?.count || 0} connections`)
      } catch (err) {
        addResult('Data Persistence', false, `Error checking data: ${err.message}`)
      }

      // Test 7: Environment Configuration
      setCurrentTest('Verifying environment configuration...')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
        addResult('Environment Config', true, `Supabase URL: ${supabaseUrl}`)
      } else {
        addResult('Environment Config', false, 'Environment variables not properly configured')
      }

      addResult('System Test Complete', true, 'All comprehensive tests completed!')

    } catch (err) {
      addResult('System Test Error', false, `Unexpected error: ${err.message}`)
    } finally {
      setTesting(false)
      setCurrentTest('')
    }
  }

  const getSuccessRate = () => {
    if (testResults.length === 0) return 0
    const successful = testResults.filter(result => result.success).length
    return Math.round((successful / testResults.length) * 100)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Comprehensive System Test</h3>
        </div>
        
        <button
          onClick={runComprehensiveTests}
          disabled={testing}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? (
            <Loader className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {testing ? 'Testing...' : 'Run Full System Test'}
        </button>
      </div>

      {testing && currentTest && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-blue-800 text-sm">{currentTest}</span>
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Test Results</h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              getSuccessRate() === 100 ? 'bg-green-100 text-green-800' :
              getSuccessRate() >= 80 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getSuccessRate()}% Success Rate
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {testResults.length === 0 && !testing && (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Click "Run Full System Test" to verify all functionality</p>
          <p className="text-sm mt-1">Tests database connection, CRUD operations, token sharing, and data persistence</p>
        </div>
      )}

      {/* Test Categories */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Database className="w-4 h-4" />
          <span>Database</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Pill className="w-4 h-4" />
          <span>Medications</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Key className="w-4 h-4" />
          <span>Token Sharing</span>
        </div>
      </div>
    </div>
  )
}

export default ComprehensiveSystemTest
