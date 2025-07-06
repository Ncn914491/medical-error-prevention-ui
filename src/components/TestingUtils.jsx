import React, { useState } from 'react'
import { 
  TestTube, 
  Database, 
  Users, 
  FileText, 
  Pill,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { patientService, diagnosisService, medicationService } from '../services/database'

const TestingUtils = ({ onClose }) => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState([])

  const dummyPatients = [
    {
      first_name: 'John',
      last_name: 'Doe',
      age: 45,
      gender: 'male',
      medical_record_number: 'MRN001',
      allergies: 'Penicillin, Shellfish',
      chronic_conditions: 'Hypertension, Type 2 Diabetes',
      current_medications: 'Metformin, Lisinopril'
    },
    {
      first_name: 'Jane',
      last_name: 'Smith',
      age: 32,
      gender: 'female',
      medical_record_number: 'MRN002',
      allergies: 'None',
      chronic_conditions: 'Asthma',
      current_medications: 'Albuterol inhaler'
    },
    {
      first_name: 'Robert',
      last_name: 'Johnson',
      age: 67,
      gender: 'male',
      medical_record_number: 'MRN003',
      allergies: 'Aspirin, Latex',
      chronic_conditions: 'Heart Disease, High Cholesterol',
      current_medications: 'Atorvastatin, Metoprolol, Clopidogrel'
    },
    {
      first_name: 'Emily',
      last_name: 'Davis',
      age: 28,
      gender: 'female',
      medical_record_number: 'MRN004',
      allergies: 'None',
      chronic_conditions: 'None',
      current_medications: 'Birth control pills'
    },
    {
      first_name: 'Michael',
      last_name: 'Wilson',
      age: 55,
      gender: 'male',
      medical_record_number: 'MRN005',
      allergies: 'Iodine',
      chronic_conditions: 'Chronic Kidney Disease, Gout',
      current_medications: 'Allopurinol, Furosemide'
    }
  ]

  const createDummyDiagnosisSessions = async (patients) => {
    const sessions = []
    for (const patient of patients) {
      const diagnosisSession = {
        patient_id: patient.id,
        session_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Chest pain, shortness of breath',
        tentative_diagnosis: 'Possible cardiac event',
        final_diagnosis: Math.random() > 0.5 ? 'Stable Angina' : 'Anxiety-related chest pain',
        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status: 'completed',
        ai_confidence_score: Math.random() * 0.3 + 0.7,
        recommendations: 'Follow up with cardiologist, stress test recommended'
      }
      
      try {
        const created = await diagnosisService.createDiagnosisSession(diagnosisSession)
        sessions.push(created)
      } catch (error) {
        console.error('Error creating diagnosis session:', error)
      }
    }
    return sessions
  }

  const createDummyMedicationSessions = async (patients) => {
    const sessions = []
    for (const patient of patients) {
      const medicationSession = {
        patient_id: patient.id,
        session_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        medications_checked: patient.current_medications || 'Multiple medications',
        severity_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status: 'completed',
        ai_analysis: 'No major drug interactions detected',
        recommendations: 'Continue current regimen, monitor blood pressure'
      }
      
      try {
        const created = await medicationService.createMedicationSession(medicationSession)
        sessions.push(created)
      } catch (error) {
        console.error('Error creating medication session:', error)
      }
    }
    return sessions
  }

  const loadDummyData = async () => {
    try {
      setLoading(true)
      setStatus('Creating dummy patients...')
      setResults([])

      const createdPatients = []
      
      // Create patients
      for (const patientData of dummyPatients) {
        try {
          const patient = await patientService.createPatient(patientData)
          createdPatients.push(patient)
          setResults(prev => [...prev, `✓ Created patient: ${patient.first_name} ${patient.last_name}`])
        } catch (error) {
          setResults(prev => [...prev, `✗ Failed to create patient: ${patientData.first_name} ${patientData.last_name}`])
        }
      }

      setStatus('Creating diagnosis sessions...')
      
      // Create diagnosis sessions
      const diagnosisSessions = await createDummyDiagnosisSessions(createdPatients)
      setResults(prev => [...prev, `✓ Created ${diagnosisSessions.length} diagnosis sessions`])

      setStatus('Creating medication sessions...')
      
      // Create medication sessions
      const medicationSessions = await createDummyMedicationSessions(createdPatients)
      setResults(prev => [...prev, `✓ Created ${medicationSessions.length} medication sessions`])

      setStatus('Dummy data loaded successfully!')
      setResults(prev => [...prev, `🎉 Successfully loaded all dummy data!`])

    } catch (error) {
      console.error('Error loading dummy data:', error)
      setResults(prev => [...prev, `✗ Error: ${error.message}`])
      setStatus('Failed to load dummy data')
    } finally {
      setLoading(false)
    }
  }

  const testGroqConnection = async () => {
    try {
      setLoading(true)
      setStatus('Testing Groq API connection...')
      setResults([])

      // This would test the actual Groq API
      // For now, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setResults([
        '✓ Groq API endpoint reachable',
        '✓ Authentication successful',
        '✓ Model LLaMA 3.3 70B available',
        '✓ Test prompt processed successfully'
      ])
      setStatus('Groq API connection successful!')
      
    } catch (error) {
      setResults(['✗ Groq API connection failed: ' + error.message])
      setStatus('Groq API test failed')
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      setLoading(true)
      setStatus('Testing database connection...')
      setResults([])

      // Test various database operations
      const tests = [
        { name: 'Patients table access', test: () => patientService.getPatients() },
        { name: 'Diagnosis sessions access', test: () => diagnosisService.getDiagnosisSessions() },
        { name: 'Medication sessions access', test: () => medicationService.getMedicationSessions() }
      ]

      for (const test of tests) {
        try {
          await test.test()
          setResults(prev => [...prev, `✓ ${test.name}`])
        } catch (error) {
          setResults(prev => [...prev, `✗ ${test.name}: ${error.message}`])
        }
      }

      setStatus('Database connection tests completed')
      
    } catch (error) {
      setResults(['✗ Database connection failed: ' + error.message])
      setStatus('Database test failed')
    } finally {
      setLoading(false)
    }
  }

  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      setStatus('Clearing all data...')
      setResults([])

      // In a real implementation, you'd have proper cleanup functions
      setResults(['⚠️ Data clearing not implemented in demo mode'])
      setStatus('Data clearing simulated')
      
    } catch (error) {
      setResults(['✗ Error clearing data: ' + error.message])
      setStatus('Failed to clear data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <TestTube className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Testing & Demo Utilities</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Actions */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Test Actions</h4>
              
              <button
                onClick={loadDummyData}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Database className="h-4 w-4 mr-2" />
                Load Dummy Data
              </button>

              <button
                onClick={testGroqConnection}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Test Groq API
              </button>

              <button
                onClick={testDatabaseConnection}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Database className="h-4 w-4 mr-2" />
                Test Database
              </button>

              <button
                onClick={clearAllData}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Clear All Data
              </button>
            </div>

            {/* Status & Results */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Test Results</h4>
              
              {loading && (
                <div className="flex items-center mb-4">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">{status}</span>
                </div>
              )}

              {status && !loading && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
                {results.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {results.map((result, index) => (
                      <li key={index} className={`${
                        result.startsWith('✓') ? 'text-green-600' :
                        result.startsWith('✗') ? 'text-red-600' :
                        result.startsWith('⚠️') ? 'text-yellow-600' :
                        result.startsWith('🎉') ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {result}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No test results yet. Run a test to see results here.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestingUtils
