import React, { useState } from 'react'
import { initializeDatabase, testEndToEndFlows } from '../scripts/initializeDatabase.js'
import { supabase } from '../lib/supabase.js'

const DatabaseInitializer = () => {
  const [status, setStatus] = useState('ready')
  const [results, setResults] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
  }

  const handleInitializeDatabase = async () => {
    setStatus('initializing')
    setLogs([])
    addLog('🚀 Starting database initialization...', 'info')
    
    try {
      const result = await initializeDatabase()
      
      if (result.success) {
        addLog('✅ Database initialization completed successfully!', 'success')
        setResults(result)
      } else {
        addLog('❌ Database initialization failed: ' + result.error?.message, 'error')
      }
    } catch (err) {
      addLog('❌ Exception during initialization: ' + err.message, 'error')
    }
    
    setStatus('ready')
  }

  const handleTestFlows = async () => {
    setStatus('testing')
    addLog('🧪 Starting end-to-end flow testing...', 'info')
    
    try {
      const result = await testEndToEndFlows()
      
      if (result.success) {
        addLog('✅ End-to-end testing completed successfully!', 'success')
      } else {
        addLog('❌ End-to-end testing failed: ' + result.error?.message, 'error')
      }
    } catch (err) {
      addLog('❌ Exception during testing: ' + err.message, 'error')
    }
    
    setStatus('ready')
  }

  const handleQuickConnectivityTest = async () => {
    addLog('🔍 Testing Supabase connectivity...', 'info')
    
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(5)
      
      if (error) {
        addLog('⚠️ Connectivity test error: ' + error.message, 'warning')
      } else {
        addLog(`✅ Successfully connected! Found ${data.length} profiles.`, 'success')
      }
    } catch (err) {
      addLog('❌ Connectivity test failed: ' + err.message, 'error')
    }
  }

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return
    }
    
    setStatus('clearing')
    addLog('🗑️ Clearing all data...', 'info')
    
    try {
      // Delete in reverse order of dependencies
      const tables = ['analysis_results', 'patient_doctor_connections', 'medications', 'medical_history', 'profiles']
      
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', 'impossible-value')
        if (error) {
          addLog(`⚠️ Error clearing ${table}: ${error.message}`, 'warning')
        } else {
          addLog(`✅ Cleared ${table}`, 'success')
        }
      }
      
      addLog('🧹 Data clearing completed!', 'success')
    } catch (err) {
      addLog('❌ Error clearing data: ' + err.message, 'error')
    }
    
    setStatus('ready')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🗄️ Database Initializer & Tester
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleQuickConnectivityTest}
          disabled={status !== 'ready'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          🔍 Test Connection
        </button>
        
        <button
          onClick={handleInitializeDatabase}
          disabled={status !== 'ready'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          🚀 Initialize DB
        </button>
        
        <button
          onClick={handleTestFlows}
          disabled={status !== 'ready'}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          🧪 Test Flows
        </button>
        
        <button
          onClick={handleClearData}
          disabled={status !== 'ready'}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          🗑️ Clear Data
        </button>
      </div>

      {status !== 'ready' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800">
              {status === 'initializing' && 'Initializing database...'}
              {status === 'testing' && 'Running tests...'}
              {status === 'clearing' && 'Clearing data...'}
            </span>
          </div>
        </div>
      )}

      {results && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-lg font-semibold text-green-800 mb-2">📊 Initialization Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Profiles:</strong> {results.data?.profiles || 0}
            </div>
            <div>
              <strong>Medical History:</strong> {results.data?.medical_history || 0}
            </div>
            <div>
              <strong>Medications:</strong> {results.data?.medications || 0}
            </div>
            <div>
              <strong>Connections:</strong> {results.data?.connections || 0}
            </div>
          </div>
          
          {results.testData?.connections && (
            <div className="mt-4">
              <h4 className="font-semibold text-green-800 mb-2">🔑 Generated Access Tokens:</h4>
              <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto">
                {results.testData.connections.map((conn, index) => (
                  <div key={index} className="text-xs mb-1 font-mono">
                    Patient: {conn.patient.slice(-8)} | Doctor: {conn.doctor.slice(-8)} | Token: {conn.token}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📜 Activity Log</h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  log.type === 'error' ? 'bg-red-100 text-red-800' :
                  log.type === 'success' ? 'bg-green-100 text-green-800' :
                  log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="text-xs text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Instructions</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li><strong>1. Test Connection:</strong> Verify Supabase connectivity</li>
          <li><strong>2. Initialize DB:</strong> Create dummy doctors, patients, medical history, medications, and connections</li>
          <li><strong>3. Test Flows:</strong> Run end-to-end tests for patient/doctor workflows</li>
          <li><strong>4. Clear Data:</strong> Remove all seeded data (use with caution)</li>
        </ol>
      </div>
    </div>
  )
}

export default DatabaseInitializer
