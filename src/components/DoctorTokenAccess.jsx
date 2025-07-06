import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tokenSharingService } from '../services/tokenSharingService'
import { 
  Key, 
  Search, 
  User, 
  Calendar, 
  Pill, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react'

const DoctorTokenAccess = ({ onPatientAccess, onConnectionUpdate }) => {
  const { user } = useAuth()
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connectedPatients, setConnectedPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientData, setPatientData] = useState(null)

  useEffect(() => {
    if (user) {
      loadConnectedPatients()
    }
  }, [user])

  const loadConnectedPatients = async () => {
    try {
      const result = await tokenSharingService.getDoctorConnectedPatients(user.uid)
      if (result.success) {
        setConnectedPatients(result.patients)
      }
    } catch (err) {
      console.error('Error loading connected patients:', err)
    }
  }

  const handleTokenSubmit = async (e) => {
    e.preventDefault()
    if (!accessToken.trim()) {
      setError('Please enter an access code')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await tokenSharingService.useAccessToken(accessToken.trim().toUpperCase(), user.uid)
      if (result.success) {
        setSuccess(`Successfully connected to patient: ${result.patient.full_name}`)
        setAccessToken('')
        await loadConnectedPatients()

        // Notify parent component with enhanced data for dashboard sync
        if (onPatientAccess) {
          onPatientAccess({
            ...result.patient,
            accessToken: accessToken.trim().toUpperCase(),
            accessedAt: new Date().toISOString(),
            doctorUid: user.uid,
            connectionData: result.connectionData
          })
        }

        // Notify parent about connection update for immediate refresh
        if (onConnectionUpdate) {
          onConnectionUpdate({
            patient: result.patient,
            connection: result.connectionData,
            action: 'connected'
          })
        }

        // Trigger a global event for dashboard synchronization
        window.dispatchEvent(new CustomEvent('doctorPatientConnectionUpdated', {
          detail: {
            patient: result.patient,
            accessToken: accessToken.trim().toUpperCase(),
            doctorUid: user.uid,
            timestamp: new Date().toISOString(),
            connection: result.connectionData
          }
        }))
      } else {
        setError(result.error || 'Invalid or expired access code')
      }
    } catch (err) {
      setError('Error accessing patient data')
    } finally {
      setLoading(false)
    }
  }

  const loadPatientData = async (patientFirebaseUid) => {
    setLoading(true)
    try {
      const result = await tokenSharingService.getPatientDataForDoctor(patientFirebaseUid, user.uid)
      if (result.success) {
        setPatientData(result.data)
        setSelectedPatient(connectedPatients.find(p => p.patient.firebase_uid === patientFirebaseUid))
      } else {
        setError('Failed to load patient data')
      }
    } catch (err) {
      setError('Error loading patient data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Token Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Access Patient Data</h3>
        </div>

        <form onSubmit={handleTokenSubmit} className="space-y-4">
          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
              Patient Access Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value.toUpperCase())}
                placeholder="Enter 8-character code (e.g., ABC12345)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
                maxLength={8}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Connecting...' : 'Connect'}</span>
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Patient Data Access:</p>
              <ul className="space-y-1 text-xs">
                <li>• Patients provide you with an 8-character access code</li>
                <li>• Codes are temporary and expire after 24 hours</li>
                <li>• You'll have access to medical history, medications, and analysis results</li>
                <li>• Patients can revoke access at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Patients */}
      {connectedPatients.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Patients</h3>
          <div className="grid gap-3">
            {connectedPatients.map((connection) => (
              <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{connection.patient.full_name}</p>
                      <p className="text-sm text-gray-600">
                        Connected: {formatDate(connection.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadPatientData(connection.patient.firebase_uid)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    View Data
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Data Display */}
      {selectedPatient && patientData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPatient.patient.full_name}'s Medical Data
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Medical History */}
            {patientData.medical_history && (
              <div>
                <h4 className="flex items-center space-x-2 text-md font-medium text-gray-900 mb-3">
                  <FileText className="w-4 h-4" />
                  <span>Medical History</span>
                </h4>
                <div className="space-y-2">
                  {patientData.medical_history.length === 0 ? (
                    <p className="text-gray-500 text-sm">No medical history recorded</p>
                  ) : (
                    patientData.medical_history.map((condition, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border">
                        <p className="font-medium text-gray-900">{condition.condition_name}</p>
                        <p className="text-sm text-gray-600">
                          Diagnosed: {formatDate(condition.diagnosis_date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: <span className="capitalize">{condition.status}</span>
                        </p>
                        {condition.notes && (
                          <p className="text-sm text-gray-600 mt-1">{condition.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {patientData.medications && (
              <div>
                <h4 className="flex items-center space-x-2 text-md font-medium text-gray-900 mb-3">
                  <Pill className="w-4 h-4" />
                  <span>Current Medications</span>
                </h4>
                <div className="space-y-2">
                  {patientData.medications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No medications recorded</p>
                  ) : (
                    patientData.medications.map((medication, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border">
                        <p className="font-medium text-gray-900">{medication.medication_name}</p>
                        <p className="text-sm text-gray-600">
                          {medication.dosage} - {medication.frequency}
                        </p>
                        <p className="text-sm text-gray-600">
                          Started: {formatDate(medication.start_date)}
                        </p>
                        {medication.indication && (
                          <p className="text-sm text-gray-600">For: {medication.indication}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Analysis Results */}
          {patientData.analysis_results && patientData.analysis_results.length > 0 && (
            <div className="mt-6">
              <h4 className="flex items-center space-x-2 text-md font-medium text-gray-900 mb-3">
                <Calendar className="w-4 h-4" />
                <span>Recent Analysis Results</span>
              </h4>
              <div className="space-y-2">
                {patientData.analysis_results.slice(0, 3).map((result, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 capitalize">
                        {result.analysis_type.replace('_', ' ')}
                      </p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.risk_level} risk
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(result.session_date)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DoctorTokenAccess
