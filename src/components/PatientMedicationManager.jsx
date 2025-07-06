import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { medicationDataService } from '../services/medicationDataService'
import { medicalSessionService } from '../services/medicalSessionService'
import { 
  Pill, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  Calendar,
  User as UserIcon
} from 'lucide-react'

const PatientMedicationManager = () => {
  const { user } = useAuth()
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    prescribing_doctor: '',
    indication: '',
    side_effects: '',
    notes: '',
    is_active: true
  })

  useEffect(() => {
    if (user) {
      loadMedications()
    }
  }, [user])

  const loadMedications = async () => {
    setLoading(true)
    try {
      const result = await medicationDataService.getMedicationsByFirebaseUid(user.uid)
      if (result.success) {
        setMedications(result.medications)
      } else {
        console.error('Error loading medications:', result.error)
        setError('Failed to load medications')
      }
    } catch (err) {
      console.error('Error in loadMedications:', err)
      setError('Error loading medications')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      prescribing_doctor: '',
      indication: '',
      side_effects: '',
      notes: '',
      is_active: true
    })
    setShowAddForm(false)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.medication_name || !formData.dosage || !formData.frequency || !formData.start_date) {
      setError('Please fill in all required fields')
      return
    }

    if (!user?.uid) {
      setError('User authentication required')
      return
    }

    try {
      const medicationData = {
        patient_firebase_uid: user.uid,
        medication_name: formData.medication_name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        prescribing_doctor: formData.prescribing_doctor.trim() || null,
        indication: formData.indication.trim() || null,
        side_effects: formData.side_effects ? formData.side_effects.split(',').map(s => s.trim()).filter(s => s) : [],
        notes: formData.notes.trim() || null,
        is_active: formData.is_active
      }

      console.log('💊 Submitting medication data:', medicationData)

      let result
      if (editingId) {
        // Update existing medication
        result = await medicationDataService.upsertMedication({ ...medicationData, id: editingId }, user.uid)
      } else {
        // Add new medication
        result = await medicationDataService.addMedication(medicationData, user.uid)
      }

      if (result.success) {
        const action = editingId ? 'updated' : 'added'
        setSuccess(editingId ? 'Medication updated successfully' : 'Medication added successfully')
        resetForm()
        await loadMedications()

        // Create medical session for doctor dashboard
        try {
          const sessionResult = await medicalSessionService.createMedicationSession(
            user.uid,
            medicationData,
            action
          )

          if (sessionResult.success) {
            console.log('✅ Medical session created for medication', action)
          } else {
            console.warn('⚠️ Failed to create medical session:', sessionResult.error)
          }
        } catch (sessionError) {
          console.warn('⚠️ Error creating medical session:', sessionError)
        }

        // Notify doctor dashboards about medication update
        window.dispatchEvent(new CustomEvent('patientMedicationUpdated', {
          detail: {
            patientFirebaseUid: user.uid,
            action: action,
            medication: result.medication,
            timestamp: new Date().toISOString()
          }
        }))
      } else {
        console.error('Error saving medication:', result.error)
        setError('Failed to save medication')
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError('Error saving medication')
    }
  }

  const handleEdit = (medication) => {
    setFormData({
      medication_name: medication.medication_name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      start_date: medication.start_date,
      end_date: medication.end_date || '',
      prescribing_doctor: medication.prescribing_doctor || '',
      indication: medication.indication || '',
      side_effects: Array.isArray(medication.side_effects) ? medication.side_effects.join(', ') : '',
      notes: medication.notes || '',
      is_active: medication.is_active
    })
    setEditingId(medication.id)
    setShowAddForm(true)
  }

  const handleDelete = async (medicationId) => {
    if (!confirm('Are you sure you want to delete this medication?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId)
        .eq('patient_firebase_uid', user.uid)

      if (error) {
        console.error('Error deleting medication:', error)
        setError('Failed to delete medication')
      } else {
        setSuccess('Medication deleted successfully')
        await loadMedications()
      }
    } catch (err) {
      console.error('Error in handleDelete:', err)
      setError('Error deleting medication')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Pill className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Medications</h3>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              {editingId ? 'Edit Medication' : 'Add New Medication'}
            </h4>
            <button
              onClick={resetForm}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({...formData, medication_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lisinopril"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 10mg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Once daily"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescribing Doctor
                </label>
                <input
                  type="text"
                  value={formData.prescribing_doctor}
                  onChange={(e) => setFormData({...formData, prescribing_doctor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dr. Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indication/Reason
              </label>
              <input
                type="text"
                value={formData.indication}
                onChange={(e) => setFormData({...formData, indication: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., High blood pressure"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side Effects (comma-separated)
              </label>
              <input
                type="text"
                value={formData.side_effects}
                onChange={(e) => setFormData({...formData, side_effects: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dizziness, Dry cough"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Currently taking this medication
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Add'} Medication
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medications List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading medications...
          </div>
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No medications recorded</p>
          <p className="text-sm">Add your current medications to keep track of them</p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((medication) => (
            <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{medication.medication_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      medication.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {medication.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Dosage:</strong> {medication.dosage}</p>
                      <p><strong>Frequency:</strong> {medication.frequency}</p>
                      {medication.indication && (
                        <p><strong>For:</strong> {medication.indication}</p>
                      )}
                    </div>
                    <div>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <strong>Started:</strong> {formatDate(medication.start_date)}
                      </p>
                      {medication.end_date && (
                        <p className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <strong>Ended:</strong> {formatDate(medication.end_date)}
                        </p>
                      )}
                      {medication.prescribing_doctor && (
                        <p className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          <strong>Doctor:</strong> {medication.prescribing_doctor}
                        </p>
                      )}
                    </div>
                  </div>

                  {medication.side_effects && medication.side_effects.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Side Effects:</strong> {medication.side_effects.join(', ')}
                      </p>
                    </div>
                  )}

                  {medication.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {medication.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(medication)}
                    className="p-2 text-blue-400 hover:text-blue-600"
                    title="Edit medication"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(medication.id)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Delete medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientMedicationManager
