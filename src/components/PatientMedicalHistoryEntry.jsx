import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { medicalSessionService } from '../services/medicalSessionService'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

const PatientMedicalHistoryEntry = () => {
  const { user } = useAuth()
  const [medicalHistory, setMedicalHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    condition_name: '',
    diagnosis_date: '',
    status: 'active',
    severity: 'mild',
    notes: '',
    icd_10_code: '',
    treating_doctor: ''
  })

  useEffect(() => {
    if (user) {
      loadMedicalHistory()
    }
  }, [user])

  const loadMedicalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_firebase_uid', user.uid)
        .order('diagnosis_date', { ascending: false })

      if (error) {
        console.error('Error loading medical history:', error)
        setError('Failed to load medical history')
      } else {
        setMedicalHistory(data || [])
      }
    } catch (err) {
      console.error('Exception loading medical history:', err)
      setError('Error loading medical history')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      condition_name: '',
      diagnosis_date: '',
      status: 'active',
      severity: 'mild',
      notes: '',
      icd_10_code: '',
      treating_doctor: ''
    })
    setEditingId(null)
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.condition_name.trim()) {
      setError('Condition name is required')
      return
    }

    setLoading(true)

    try {
      const historyData = {
        patient_firebase_uid: user.uid,
        condition_name: formData.condition_name.trim(),
        diagnosis_date: formData.diagnosis_date || null,
        status: formData.status,
        severity: formData.severity,
        notes: formData.notes.trim() || null,
        icd_10_code: formData.icd_10_code.trim() || null,
        treating_doctor: formData.treating_doctor.trim() || null,
        patient_entered: true,
        entry_source: 'patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('medical_history')
          .update(historyData)
          .eq('id', editingId)
          .eq('patient_firebase_uid', user.uid)

        if (error) {
          setError(`Failed to update medical history: ${error.message}`)
        } else {
          setSuccess('Medical history updated successfully')
          resetForm()
          await loadMedicalHistory()

          // Create medical session for doctor dashboard
          try {
            const sessionResult = await medicalSessionService.createDiagnosisSession(
              user.uid,
              historyData,
              'updated'
            )

            if (sessionResult.success) {
              console.log('✅ Medical session created for diagnosis update')
            } else {
              console.warn('⚠️ Failed to create medical session:', sessionResult.error)
            }
          } catch (sessionError) {
            console.warn('⚠️ Error creating medical session:', sessionError)
          }

          // Notify doctor dashboards about medical history update
          window.dispatchEvent(new CustomEvent('patientMedicalHistoryUpdated', {
            detail: {
              patientFirebaseUid: user.uid,
              action: 'updated',
              timestamp: new Date().toISOString()
            }
          }))
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('medical_history')
          .insert([historyData])

        if (error) {
          setError(`Failed to add medical history: ${error.message}`)
        } else {
          setSuccess('Medical history added successfully')
          resetForm()
          await loadMedicalHistory()

          // Create medical session for doctor dashboard
          try {
            const sessionResult = await medicalSessionService.createDiagnosisSession(
              user.uid,
              historyData,
              'added'
            )

            if (sessionResult.success) {
              console.log('✅ Medical session created for new diagnosis')
            } else {
              console.warn('⚠️ Failed to create medical session:', sessionResult.error)
            }
          } catch (sessionError) {
            console.warn('⚠️ Error creating medical session:', sessionError)
          }

          // Notify doctor dashboards about medical history update
          window.dispatchEvent(new CustomEvent('patientMedicalHistoryUpdated', {
            detail: {
              patientFirebaseUid: user.uid,
              action: 'added',
              timestamp: new Date().toISOString()
            }
          }))
        }
      }
    } catch (err) {
      setError('An error occurred while saving medical history')
      console.error('Error saving medical history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (history) => {
    setFormData({
      condition_name: history.condition_name,
      diagnosis_date: history.diagnosis_date || '',
      status: history.status,
      severity: history.severity,
      notes: history.notes || '',
      icd_10_code: history.icd_10_code || '',
      treating_doctor: history.treating_doctor || ''
    })
    setEditingId(history.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medical history record?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('medical_history')
        .delete()
        .eq('id', id)
        .eq('patient_firebase_uid', user.uid)

      if (error) {
        setError(`Failed to delete medical history: ${error.message}`)
      } else {
        setSuccess('Medical history deleted successfully')
        await loadMedicalHistory()
      }
    } catch (err) {
      setError('Error deleting medical history')
      console.error('Error deleting medical history:', err)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'text-green-600 bg-green-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'severe': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'chronic': return 'text-blue-600 bg-blue-100'
      case 'monitoring': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Medical History</h3>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Condition
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {editingId ? 'Edit Medical Condition' : 'Add Medical Condition'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition Name *
                </label>
                <input
                  type="text"
                  name="condition_name"
                  value={formData.condition_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Hypertension, Diabetes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis Date
                </label>
                <input
                  type="date"
                  name="diagnosis_date"
                  value={formData.diagnosis_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="chronic">Chronic</option>
                  <option value="monitoring">Monitoring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treating Doctor
                </label>
                <input
                  type="text"
                  name="treating_doctor"
                  value={formData.treating_doctor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doctor's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICD-10 Code (if known)
                </label>
                <input
                  type="text"
                  name="icd_10_code"
                  value={formData.icd_10_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., I10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this condition..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Condition
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medical History List */}
      <div className="space-y-4">
        {medicalHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No medical history recorded yet</p>
            <p className="text-sm mt-1">Add your past medical conditions to help doctors provide better care</p>
          </div>
        ) : (
          medicalHistory.map((history) => (
            <div key={history.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{history.condition_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                      {history.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(history.severity)}`}>
                      {history.severity}
                    </span>
                    {history.patient_entered && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                        Self-entered
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {history.diagnosis_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Diagnosed: {new Date(history.diagnosis_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {history.treating_doctor && (
                      <p><strong>Doctor:</strong> {history.treating_doctor}</p>
                    )}
                    {history.icd_10_code && (
                      <p><strong>ICD-10:</strong> {history.icd_10_code}</p>
                    )}
                    {history.notes && (
                      <p><strong>Notes:</strong> {history.notes}</p>
                    )}
                  </div>
                </div>
                
                {history.patient_entered && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(history)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(history.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PatientMedicalHistoryEntry
