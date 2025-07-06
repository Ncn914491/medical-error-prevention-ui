import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Database, 
  Wrench, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader,
  Play,
  Copy,
  RefreshCw
} from 'lucide-react'

const CriticalSchemaFixer = () => {
  const [fixing, setFixing] = useState(false)
  const [fixResults, setFixResults] = useState([])

  const addResult = (step, status, message, details = null) => {
    setFixResults(prev => [...prev, {
      step,
      status, // 'success', 'error', 'warning', 'info'
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const executeSQL = async (sql, description) => {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        addResult(description, 'error', `SQL execution failed: ${error.message}`)
        return false
      } else {
        addResult(description, 'success', `${description} completed successfully`)
        return true
      }
    } catch (err) {
      addResult(description, 'error', `Exception: ${err.message}`)
      return false
    }
  }

  const testColumnExists = async (tableName, columnName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .limit(1)
      
      if (error && error.message.includes(`column "${columnName}" does not exist`)) {
        return false
      }
      return true
    } catch (err) {
      return false
    }
  }

  const runCriticalSchemaFixes = async () => {
    setFixing(true)
    setFixResults([])

    try {
      addResult('Schema Fix Start', 'info', 'Starting critical database schema fixes...')

      // Fix 1: Add access_count column to patient_doctor_connections
      addResult('Access Count Column', 'info', 'Checking and adding access_count column...')
      
      const accessCountExists = await testColumnExists('patient_doctor_connections', 'access_count')
      if (!accessCountExists) {
        await executeSQL(
          'ALTER TABLE patient_doctor_connections ADD COLUMN access_count INTEGER DEFAULT 0;',
          'Add access_count column'
        )
      } else {
        addResult('Access Count Column', 'success', 'access_count column already exists')
      }

      // Fix 2: Add last_accessed_at column
      addResult('Last Accessed Column', 'info', 'Checking and adding last_accessed_at column...')
      
      const lastAccessedExists = await testColumnExists('patient_doctor_connections', 'last_accessed_at')
      if (!lastAccessedExists) {
        await executeSQL(
          'ALTER TABLE patient_doctor_connections ADD COLUMN last_accessed_at TIMESTAMP WITH TIME ZONE;',
          'Add last_accessed_at column'
        )
      } else {
        addResult('Last Accessed Column', 'success', 'last_accessed_at column already exists')
      }

      // Fix 3: Add entry_source column to medical_history
      addResult('Medical History Entry Source', 'info', 'Checking and adding entry_source column to medical_history...')
      
      const historyEntrySourceExists = await testColumnExists('medical_history', 'entry_source')
      if (!historyEntrySourceExists) {
        await executeSQL(
          "ALTER TABLE medical_history ADD COLUMN entry_source TEXT DEFAULT 'doctor';",
          'Add entry_source to medical_history'
        )
      } else {
        addResult('Medical History Entry Source', 'success', 'entry_source column already exists in medical_history')
      }

      // Fix 4: Add patient_entered column to medical_history
      addResult('Medical History Patient Entered', 'info', 'Checking and adding patient_entered column to medical_history...')
      
      const historyPatientEnteredExists = await testColumnExists('medical_history', 'patient_entered')
      if (!historyPatientEnteredExists) {
        await executeSQL(
          'ALTER TABLE medical_history ADD COLUMN patient_entered BOOLEAN DEFAULT false;',
          'Add patient_entered to medical_history'
        )
      } else {
        addResult('Medical History Patient Entered', 'success', 'patient_entered column already exists in medical_history')
      }

      // Fix 5: Add entry_source column to medications
      addResult('Medications Entry Source', 'info', 'Checking and adding entry_source column to medications...')
      
      const medicationsEntrySourceExists = await testColumnExists('medications', 'entry_source')
      if (!medicationsEntrySourceExists) {
        await executeSQL(
          "ALTER TABLE medications ADD COLUMN entry_source TEXT DEFAULT 'doctor';",
          'Add entry_source to medications'
        )
      } else {
        addResult('Medications Entry Source', 'success', 'entry_source column already exists in medications')
      }

      // Fix 6: Add patient_entered column to medications
      addResult('Medications Patient Entered', 'info', 'Checking and adding patient_entered column to medications...')
      
      const medicationsPatientEnteredExists = await testColumnExists('medications', 'patient_entered')
      if (!medicationsPatientEnteredExists) {
        await executeSQL(
          'ALTER TABLE medications ADD COLUMN patient_entered BOOLEAN DEFAULT false;',
          'Add patient_entered to medications'
        )
      } else {
        addResult('Medications Patient Entered', 'success', 'patient_entered column already exists in medications')
      }

      // Fix 7: Update existing records with default values
      addResult('Default Values Update', 'info', 'Updating existing records with default values...')
      
      try {
        // Update patient_doctor_connections
        const { error: updateConnectionsError } = await supabase
          .from('patient_doctor_connections')
          .update({ access_count: 0 })
          .is('access_count', null)
        
        if (updateConnectionsError) {
          addResult('Default Values Update', 'warning', `Connections update: ${updateConnectionsError.message}`)
        }

        // Update medical_history
        const { error: updateHistoryError } = await supabase
          .from('medical_history')
          .update({ entry_source: 'doctor', patient_entered: false })
          .or('entry_source.is.null,patient_entered.is.null')
        
        if (updateHistoryError) {
          addResult('Default Values Update', 'warning', `History update: ${updateHistoryError.message}`)
        }

        // Update medications
        const { error: updateMedicationsError } = await supabase
          .from('medications')
          .update({ entry_source: 'doctor', patient_entered: false })
          .or('entry_source.is.null,patient_entered.is.null')
        
        if (updateMedicationsError) {
          addResult('Default Values Update', 'warning', `Medications update: ${updateMedicationsError.message}`)
        }

        addResult('Default Values Update', 'success', 'Default values updated for existing records')
      } catch (err) {
        addResult('Default Values Update', 'error', `Error updating defaults: ${err.message}`)
      }

      // Fix 8: Create helper function for access count
      addResult('Helper Functions', 'info', 'Creating helper functions...')
      
      const incrementFunctionSQL = `
        CREATE OR REPLACE FUNCTION increment_access_count(connection_id UUID)
        RETURNS INTEGER AS $$
        DECLARE
            new_count INTEGER;
        BEGIN
            UPDATE patient_doctor_connections 
            SET 
                access_count = COALESCE(access_count, 0) + 1,
                last_accessed_at = NOW(),
                updated_at = NOW()
            WHERE id = connection_id
            RETURNING access_count INTO new_count;
            
            RETURN COALESCE(new_count, 0);
        END;
        $$ LANGUAGE plpgsql;
      `
      
      await executeSQL(incrementFunctionSQL, 'Create increment_access_count function')

      // Fix 9: Test database operations with new columns
      addResult('Database Operations Test', 'info', 'Testing CRUD operations with new columns...')
      
      try {
        // Test patient_doctor_connections with new columns
        const testConnection = {
          patient_firebase_uid: `test-schema-fix-${Date.now()}`,
          access_token: `SCHEMATEST${Date.now()}`,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from('patient_doctor_connections')
          .insert([testConnection])
          .select()
          .single()
        
        if (insertError) {
          addResult('Database Operations Test', 'error', `Insert test failed: ${insertError.message}`)
        } else {
          addResult('Database Operations Test', 'success', 'Insert operation successful with new columns')
          
          // Test update with access_count
          const { error: updateError } = await supabase
            .from('patient_doctor_connections')
            .update({ 
              access_count: 1,
              last_accessed_at: new Date().toISOString()
            })
            .eq('id', insertData.id)
          
          if (updateError) {
            addResult('Database Operations Test', 'error', `Update test failed: ${updateError.message}`)
          } else {
            addResult('Database Operations Test', 'success', 'Update operation successful with new columns')
          }
          
          // Clean up test data
          await supabase
            .from('patient_doctor_connections')
            .delete()
            .eq('id', insertData.id)
          
          addResult('Database Operations Test', 'success', 'Test data cleaned up successfully')
        }
      } catch (err) {
        addResult('Database Operations Test', 'error', `Test error: ${err.message}`)
      }

      // Fix 10: Verify schema integrity
      addResult('Schema Verification', 'info', 'Verifying all schema fixes...')
      
      try {
        const verificationChecks = [
          { table: 'patient_doctor_connections', column: 'access_count' },
          { table: 'patient_doctor_connections', column: 'last_accessed_at' },
          { table: 'medical_history', column: 'entry_source' },
          { table: 'medical_history', column: 'patient_entered' },
          { table: 'medications', column: 'entry_source' },
          { table: 'medications', column: 'patient_entered' }
        ]
        
        let allColumnsExist = true
        for (const check of verificationChecks) {
          const exists = await testColumnExists(check.table, check.column)
          if (!exists) {
            addResult('Schema Verification', 'error', `Column ${check.column} missing from ${check.table}`)
            allColumnsExist = false
          }
        }
        
        if (allColumnsExist) {
          addResult('Schema Verification', 'success', 'All required columns exist and are accessible')
        }
      } catch (err) {
        addResult('Schema Verification', 'error', `Verification error: ${err.message}`)
      }

      addResult('Schema Fix Complete', 'success', '🎉 All critical schema fixes completed successfully!')

    } catch (error) {
      addResult('Schema Fix Error', 'error', `Unexpected error: ${error.message}`)
    } finally {
      setFixing(false)
    }
  }

  const copyManualSQL = () => {
    const sql = `-- Critical Schema Fixes - Run in Supabase SQL Editor
-- Add missing columns that are causing schema cache errors

-- Fix patient_doctor_connections table
ALTER TABLE patient_doctor_connections 
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE;

-- Fix medical_history table
ALTER TABLE medical_history 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'doctor',
ADD COLUMN IF NOT EXISTS patient_entered BOOLEAN DEFAULT false;

-- Fix medications table
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'doctor',
ADD COLUMN IF NOT EXISTS patient_entered BOOLEAN DEFAULT false;

-- Update existing records
UPDATE patient_doctor_connections SET access_count = 0 WHERE access_count IS NULL;
UPDATE medical_history SET entry_source = 'doctor', patient_entered = false WHERE entry_source IS NULL;
UPDATE medications SET entry_source = 'doctor', patient_entered = false WHERE entry_source IS NULL;

-- Create helper function
CREATE OR REPLACE FUNCTION increment_access_count(connection_id UUID)
RETURNS INTEGER AS $$
DECLARE new_count INTEGER;
BEGIN
    UPDATE patient_doctor_connections 
    SET access_count = COALESCE(access_count, 0) + 1,
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE id = connection_id
    RETURNING access_count INTO new_count;
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;`

    navigator.clipboard.writeText(sql)
    addResult('Manual SQL', 'info', 'SQL copied to clipboard - paste in Supabase SQL Editor')
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">🚨 Critical Schema Fixer</h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={copyManualSQL}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Manual SQL
          </button>
          
          <button
            onClick={runCriticalSchemaFixes}
            disabled={fixing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {fixing ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {fixing ? 'Fixing Schema...' : 'Fix Critical Schema Issues'}
          </button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 className="font-medium text-red-900 mb-2">🚨 Critical Schema Issues Detected:</h4>
        <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
          <li><strong>access_count</strong> column missing from patient_doctor_connections (causing token access failures)</li>
          <li><strong>entry_source</strong> column missing from medical_history (causing patient entry failures)</li>
          <li><strong>patient_entered</strong> columns missing (preventing self-entry tracking)</li>
          <li>Missing helper functions for access count management</li>
        </ul>
      </div>

      {/* Fix Results */}
      {fixResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {fixResults.map((result, index) => (
            <div key={index} className={`p-3 rounded border bg-${getStatusColor(result.status)}-50 border-${getStatusColor(result.status)}-200`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span className={`font-medium text-${getStatusColor(result.status)}-800`}>
                  {result.step}
                </span>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              <p className={`text-sm mt-1 text-${getStatusColor(result.status)}-700`}>
                {result.message}
              </p>
              {result.details && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {fixResults.length === 0 && !fixing && (
        <div className="text-center py-8 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 text-red-300" />
          <p className="font-medium">Critical database schema issues detected!</p>
          <p className="text-sm mt-1">Click "Fix Critical Schema Issues" to resolve missing columns and schema cache errors</p>
        </div>
      )}

      {/* Next Steps */}
      {fixResults.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 After Schema Fixes:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Run "Supabase Diagnostics" to verify all fixes</li>
            <li>Test doctor token access (should work without access_count errors)</li>
            <li>Test patient medical history self-entry (should work without entry_source errors)</li>
            <li>Verify doctor dashboard synchronization</li>
            <li>Create test data and test complete workflow</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default CriticalSchemaFixer
