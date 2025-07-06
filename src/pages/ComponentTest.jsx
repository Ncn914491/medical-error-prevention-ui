import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PatientSelector from '../components/PatientSelector'
import DiagnosisForm from '../components/DiagnosisForm'
import MedicationInputForm from '../components/MedicationInputForm'
import TestingUtils from '../components/TestingUtils'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

const ComponentTest = () => {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)
  const [showTesting, setShowTesting] = useState(false)

  const runComponentTests = async () => {
    setTesting(true)
    setTestResults([])
    
    const tests = [
      {
        name: 'Auth Context',
        test: () => Promise.resolve(!!user),
        description: 'Check if user is authenticated'
      },
      {
        name: 'Patient Service',
        test: async () => {
          try {
            const { patientService } = await import('../services/database')
            await patientService.getPatients()
            return true
          } catch (error) {
            console.error('Patient service test failed:', error)
            return false
          }
        },
        description: 'Test patient data fetching'
      },
      {
        name: 'Diagnosis Service',
        test: async () => {
          try {
            const { diagnosisService } = await import('../services/database')
            await diagnosisService.getDiagnosisSessions()
            return true
          } catch (error) {
            console.error('Diagnosis service test failed:', error)
            return false
          }
        },
        description: 'Test diagnosis data fetching'
      },
      {
        name: 'Medication Service',
        test: async () => {
          try {
            const { medicationService } = await import('../services/database')
            await medicationService.getMedicationSessions()
            return true
          } catch (error) {
            console.error('Medication service test failed:', error)
            return false
          }
        },
        description: 'Test medication data fetching'
      }
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        setTestResults(prev => [...prev, {
          name: test.name,
          description: test.description,
          passed: result,
          error: null
        }])
      } catch (error) {
        setTestResults(prev => [...prev, {
          name: test.name,
          description: test.description,
          passed: false,
          error: error.message
        }])
      }
      
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Component Testing Dashboard</h1>
          <p className="text-gray-600">Test all components and services to ensure they're working correctly.</p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Service Tests</h2>
            <div className="space-x-4">
              <button
                onClick={runComponentTests}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    Testing...
                  </>
                ) : (
                  'Run Tests'
                )}
              </button>
              <button
                onClick={() => setShowTesting(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Open Testing Utils
              </button>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {result.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{result.name}</div>
                      <div className="text-sm text-gray-500">{result.description}</div>
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">Error: {result.error}</div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Selector Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Selector Component</h3>
            <PatientSelector
              selectedPatient={selectedPatient}
              onPatientSelect={setSelectedPatient}
            />
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h3>
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>User is authenticated</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Email: {user.email}</div>
                  <div>User ID: {user.id}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>User not authenticated</span>
              </div>
            )}
          </div>

          {/* Diagnosis Form Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis Form Component</h3>
            <DiagnosisForm
              selectedPatient={selectedPatient}
              onAnalysisComplete={(result) => console.log('Diagnosis result:', result)}
            />
          </div>

          {/* Medication Form Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medication Input Component</h3>
            <MedicationInputForm
              selectedPatient={selectedPatient}
              onAnalysisComplete={(result) => console.log('Medication result:', result)}
            />
          </div>
        </div>

        {/* Selected Patient Info */}
        {selectedPatient && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Selected Patient Information</h3>
            <pre className="text-sm text-blue-800 overflow-auto">
              {JSON.stringify(selectedPatient, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Testing Utils Modal */}
      {showTesting && (
        <TestingUtils onClose={() => setShowTesting(false)} />
      )}
    </div>
  )
}

export default ComponentTest
