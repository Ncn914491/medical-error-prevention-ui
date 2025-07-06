import React, { useState } from 'react'
import { createMedicalDummyData } from '../services/medicalDummyDataService'
import { 
  Stethoscope, 
  Users, 
  Pill, 
  FileText, 
  Key,
  Play,
  CheckCircle,
  XCircle,
  Loader,
  Copy,
  Eye
} from 'lucide-react'

const MedicalDataSetup = () => {
  const [setupStatus, setSetupStatus] = useState('ready')
  const [setupResults, setSetupResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  const runMedicalDataSetup = async () => {
    setLoading(true)
    setSetupStatus('running')
    
    try {
      console.log('🏥 Starting medical data setup...')
      const result = await createMedicalDummyData()
      
      if (result.success) {
        setSetupResults(result)
        setSetupStatus('complete')
        console.log('✅ Medical data setup completed successfully!')
      } else {
        setSetupStatus('error')
        console.error('❌ Medical data setup failed:', result.error)
      }
    } catch (error) {
      setSetupStatus('error')
      console.error('❌ Error during medical data setup:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = (credentials) => {
    const text = credentials.map(cred => 
      `${cred.name}: ${cred.email} / ${cred.password}`
    ).join('\n')
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = () => {
    switch (setupStatus) {
      case 'complete': return 'green'
      case 'error': return 'red'
      case 'running': return 'blue'
      default: return 'gray'
    }
  }

  const getStatusIcon = () => {
    switch (setupStatus) {
      case 'complete': return <CheckCircle className="w-5 h-5" />
      case 'error': return <XCircle className="w-5 h-5" />
      case 'running': return <Loader className="w-5 h-5 animate-spin" />
      default: return <Stethoscope className="w-5 h-5" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Medical Data Setup</h3>
        </div>
        
        <button
          onClick={runMedicalDataSetup}
          disabled={loading || setupStatus === 'complete'}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Setting up...' : setupStatus === 'complete' ? 'Setup Complete' : 'Create Medical Data'}
        </button>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 border rounded-lg bg-${getStatusColor()}-50 border-${getStatusColor()}-200`}>
        <div className="flex items-center space-x-2">
          <span className={`text-${getStatusColor()}-600`}>
            {getStatusIcon()}
          </span>
          <span className={`font-medium text-${getStatusColor()}-800`}>
            {setupStatus === 'ready' && 'Ready to create medical dummy data'}
            {setupStatus === 'running' && 'Creating medical data...'}
            {setupStatus === 'complete' && 'Medical data setup completed successfully!'}
            {setupStatus === 'error' && 'Error occurred during setup'}
          </span>
        </div>
        
        {setupStatus === 'complete' && (
          <p className="text-green-700 text-sm mt-2">
            Created realistic medical profiles, conditions, medications, and patient-doctor connections with secure access tokens.
          </p>
        )}
      </div>

      {/* Setup Description */}
      {setupStatus === 'ready' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What will be created:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>2 Doctor profiles with specializations</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>5 Patient profiles with demographics</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Medical history (2-3 conditions per patient)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Pill className="w-4 h-4" />
              <span>Medications (1-2 per patient)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Patient-doctor access tokens</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Realistic medical data relationships</span>
            </div>
          </div>
        </div>
      )}

      {/* Setup Results */}
      {setupResults && setupStatus === 'complete' && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-blue-600">{setupResults.results.doctors.length}</div>
              <div className="text-sm text-blue-800">Doctors</div>
            </div>
            <div className="bg-green-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-green-600">{setupResults.results.patients.length}</div>
              <div className="text-sm text-green-800">Patients</div>
            </div>
            <div className="bg-purple-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-purple-600">{setupResults.results.medicalHistory.length}</div>
              <div className="text-sm text-purple-800">Conditions</div>
            </div>
            <div className="bg-orange-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-orange-600">{setupResults.results.medications.length}</div>
              <div className="text-sm text-orange-800">Medications</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded text-center">
              <div className="text-2xl font-bold text-indigo-600">{setupResults.results.connections.length}</div>
              <div className="text-sm text-indigo-800">Connections</div>
            </div>
          </div>

          {/* Test Credentials */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Test Account Credentials</h4>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="inline-flex items-center px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Eye className="w-4 h-4 mr-1" />
                {showCredentials ? 'Hide' : 'Show'} Credentials
              </button>
            </div>

            {showCredentials && (
              <div className="space-y-4">
                {/* Doctor Credentials */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800">👨‍⚕️ Doctor Accounts</h5>
                    <button
                      onClick={() => copyCredentials(setupResults.credentials.doctors)}
                      className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy All
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
                    {setupResults.credentials.doctors.map((doctor, index) => (
                      <div key={index} className="text-gray-700">
                        <strong>{doctor.name}:</strong> {doctor.email} / {doctor.password}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient Credentials */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800">🏥 Patient Accounts</h5>
                    <button
                      onClick={() => copyCredentials(setupResults.credentials.patients)}
                      className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy All
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
                    {setupResults.credentials.patients.map((patient, index) => (
                      <div key={index} className="text-gray-700">
                        <strong>{patient.name}:</strong> {patient.email} / {patient.password}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">✅ Next Steps:</h4>
            <ol className="list-decimal list-inside text-sm text-green-800 space-y-1">
              <li>Login with any patient account to test medication management</li>
              <li>Generate sharing tokens as a patient</li>
              <li>Login as a doctor and use patient tokens to access medical data</li>
              <li>Test the complete patient-doctor workflow</li>
              <li>Verify data persistence across browser sessions</li>
            </ol>
          </div>

          {/* Errors (if any) */}
          {setupResults.results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">⚠️ Errors encountered:</h4>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                {setupResults.results.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {setupStatus === 'ready' && (
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Note:</strong> This will create Firebase authentication accounts and Supabase database records with realistic medical data for testing the patient-doctor token sharing system.</p>
        </div>
      )}
    </div>
  )
}

export default MedicalDataSetup
