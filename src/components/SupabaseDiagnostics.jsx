import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Database, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader,
  Play,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react'

const SupabaseDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState([])
  const [testing, setTesting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState({})

  useEffect(() => {
    checkEnvironmentVariables()
  }, [])

  const addDiagnostic = (test, status, message, details = null, error = null) => {
    setDiagnostics(prev => [...prev, {
      test,
      status, // 'success', 'error', 'warning', 'info'
      message,
      details,
      error,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const checkEnvironmentVariables = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    setConnectionInfo({
      url: supabaseUrl,
      keyLength: supabaseKey ? supabaseKey.length : 0,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl && supabaseUrl.includes('supabase.co'),
      keyValid: supabaseKey && supabaseKey.startsWith('eyJ')
    })
  }

  const runComprehensiveDiagnostics = async () => {
    setTesting(true)
    setDiagnostics([])
    
    try {
      // Test 1: Environment Variables
      addDiagnostic('Environment Variables', 'info', 'Checking configuration...')
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        addDiagnostic('Environment Variables', 'error', 'Missing environment variables', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        })
        return
      }
      
      if (!supabaseUrl.includes('supabase.co') || !supabaseKey.startsWith('eyJ')) {
        addDiagnostic('Environment Variables', 'error', 'Invalid environment variable format', {
          urlValid: supabaseUrl.includes('supabase.co'),
          keyValid: supabaseKey.startsWith('eyJ')
        })
        return
      }
      
      addDiagnostic('Environment Variables', 'success', 'Environment variables are properly configured', {
        url: supabaseUrl,
        keyLength: supabaseKey.length
      })

      // Test 2: Basic Connection
      addDiagnostic('Basic Connection', 'info', 'Testing Supabase connection...')
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true })
        
        if (error) {
          addDiagnostic('Basic Connection', 'error', 'Connection failed', { error: error.message }, error)
          return
        }
        
        addDiagnostic('Basic Connection', 'success', 'Successfully connected to Supabase', {
          profileCount: data?.count || 0
        })
      } catch (err) {
        addDiagnostic('Basic Connection', 'error', 'Connection exception', { error: err.message }, err)
        return
      }

      // Test 3: Table Existence
      addDiagnostic('Table Verification', 'info', 'Checking database tables...')
      
      const tables = ['profiles', 'medications', 'medical_history', 'patient_doctor_connections', 'analysis_results']
      const tableResults = {}
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true })
          
          if (error) {
            tableResults[table] = { exists: false, error: error.message }
            addDiagnostic(`Table: ${table}`, 'error', `Table not accessible: ${error.message}`, null, error)
          } else {
            tableResults[table] = { exists: true, count: data?.count || 0 }
            addDiagnostic(`Table: ${table}`, 'success', `Table accessible with ${data?.count || 0} records`)
          }
        } catch (err) {
          tableResults[table] = { exists: false, error: err.message }
          addDiagnostic(`Table: ${table}`, 'error', `Table check failed: ${err.message}`, null, err)
        }
      }

      // Test 4: Insert Operation
      addDiagnostic('Insert Test', 'info', 'Testing data insertion...')
      
      try {
        const testProfile = {
          firebase_uid: `test-${Date.now()}`,
          email: 'test@diagnostics.com',
          full_name: 'Diagnostic Test User',
          role: 'patient'
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .insert([testProfile])
          .select()
          .single()
        
        if (error) {
          addDiagnostic('Insert Test', 'error', `Insert failed: ${error.message}`, { testProfile }, error)
        } else {
          addDiagnostic('Insert Test', 'success', 'Insert operation successful', { insertedId: data.id })
          
          // Clean up test data
          await supabase
            .from('profiles')
            .delete()
            .eq('id', data.id)
          
          addDiagnostic('Cleanup', 'success', 'Test data cleaned up successfully')
        }
      } catch (err) {
        addDiagnostic('Insert Test', 'error', `Insert exception: ${err.message}`, null, err)
      }

      // Test 5: RLS Policy Check
      addDiagnostic('RLS Policies', 'info', 'Checking Row Level Security policies...')
      
      try {
        // Try to query without authentication context
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        if (error && error.message.includes('RLS')) {
          addDiagnostic('RLS Policies', 'warning', 'RLS is enabled and may be blocking operations', { error: error.message })
        } else if (error) {
          addDiagnostic('RLS Policies', 'error', `RLS check failed: ${error.message}`, null, error)
        } else {
          addDiagnostic('RLS Policies', 'success', 'RLS policies allow data access', { recordCount: data?.length || 0 })
        }
      } catch (err) {
        addDiagnostic('RLS Policies', 'error', `RLS check exception: ${err.message}`, null, err)
      }

      // Test 6: Storage Bucket
      addDiagnostic('Storage Bucket', 'info', 'Checking storage configuration...')
      
      try {
        const { data, error } = await supabase.storage.listBuckets()
        
        if (error) {
          addDiagnostic('Storage Bucket', 'error', `Storage check failed: ${error.message}`, null, error)
        } else {
          const profileBucket = data.find(bucket => bucket.id === 'profile-pictures')
          if (profileBucket) {
            addDiagnostic('Storage Bucket', 'success', 'Profile pictures bucket exists', { bucket: profileBucket })
          } else {
            addDiagnostic('Storage Bucket', 'warning', 'Profile pictures bucket not found', { availableBuckets: data.map(b => b.id) })
          }
        }
      } catch (err) {
        addDiagnostic('Storage Bucket', 'error', `Storage exception: ${err.message}`, null, err)
      }

      addDiagnostic('Diagnostics Complete', 'success', 'All diagnostic tests completed')

    } catch (error) {
      addDiagnostic('Diagnostics Error', 'error', `Unexpected error: ${error.message}`, null, error)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <Database className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'green'
      case 'error': return 'red'
      case 'warning': return 'yellow'
      default: return 'blue'
    }
  }

  const getOverallStatus = () => {
    if (diagnostics.length === 0) return 'unknown'
    
    const hasErrors = diagnostics.some(d => d.status === 'error')
    const hasWarnings = diagnostics.some(d => d.status === 'warning')
    
    if (hasErrors) return 'error'
    if (hasWarnings) return 'warning'
    return 'success'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Supabase Diagnostics</h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          <button
            onClick={runComprehensiveDiagnostics}
            disabled={testing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            {testing ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* Environment Info */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Connection Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Supabase URL:</span>
            <span className={connectionInfo.urlValid ? 'text-green-600' : 'text-red-600'}>
              {connectionInfo.hasUrl ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Anon Key:</span>
            <span className={connectionInfo.keyValid ? 'text-green-600' : 'text-red-600'}>
              {connectionInfo.hasKey ? `✅ ${connectionInfo.keyLength} chars` : '❌ Missing'}
            </span>
          </div>
        </div>
        {connectionInfo.url && (
          <div className="mt-2 text-xs text-gray-600">
            <strong>URL:</strong> {connectionInfo.url}
          </div>
        )}
      </div>

      {/* Overall Status */}
      {diagnostics.length > 0 && (
        <div className={`mb-4 p-3 border rounded-lg bg-${getStatusColor(getOverallStatus())}-50 border-${getStatusColor(getOverallStatus())}-200`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon(getOverallStatus())}
            <span className={`font-medium text-${getStatusColor(getOverallStatus())}-800`}>
              Overall Status: {getOverallStatus().charAt(0).toUpperCase() + getOverallStatus().slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnostics.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className={`p-3 rounded border bg-${getStatusColor(diagnostic.status)}-50 border-${getStatusColor(diagnostic.status)}-200`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(diagnostic.status)}
                <span className={`font-medium text-${getStatusColor(diagnostic.status)}-800`}>
                  {diagnostic.test}
                </span>
                <span className="text-xs text-gray-500">{diagnostic.timestamp}</span>
              </div>
              <p className={`text-sm mt-1 text-${getStatusColor(diagnostic.status)}-700`}>
                {diagnostic.message}
              </p>
              
              {showDetails && diagnostic.details && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <strong>Details:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(diagnostic.details, null, 2)}</pre>
                </div>
              )}
              
              {showDetails && diagnostic.error && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                  <strong>Error:</strong>
                  <pre className="mt-1 whitespace-pre-wrap text-red-800">{JSON.stringify(diagnostic.error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {diagnostics.length === 0 && !testing && (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Click "Run Diagnostics" to test Supabase connection and database operations</p>
          <p className="text-sm mt-1">This will check connectivity, tables, permissions, and CRUD operations</p>
        </div>
      )}
    </div>
  )
}

export default SupabaseDiagnostics
