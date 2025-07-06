import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Pill, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  User
} from 'lucide-react'

const DoctorMedicationManager = ({ patientFirebaseUid, patientName, onMedicationUpdate }) => {
  const { user } = useAuth()
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    indication: '',
    side_effects: '',
    notes: '',
    is_active: true
  })

  useEffect(() => {
    if (patientFirebaseUid) {
      loadPatientMedications()
    }
  }, [patientFirebaseUid])

  const loadPatientMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_firebase_uid', patientFirebaseUid)
        .order('start_date', { ascending: false })

      if (error) {
        console.error('Error loading medications:', error)
        setError('Failed to load medications')
      } else {
        setMedications(data || [])
      }
    } catch (err) {
      console.error('Exception loading medications:', err)
      setError('Error loading medications')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      indication: '',
      side_effects: '',
      notes: '',
      is_active: true
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

    if (!formData.medication_name.trim() || !formData.dosage.trim() || !formData.frequency.trim() || !formData.start_date) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Get doctor profile for prescribing doctor name
      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('firebase_uid', user.uid)
        .single()

      const medicationData = {
        patient_firebase_uid: patientFirebaseUid,
        medication_name: formData.medication_name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        prescribing_doctor: doctorProfile?.full_name || 'Doctor',
        doctor_firebase_uid: user.uid,
        indication: formData.indication.trim() || null,
        side_effects: formData.side_effects ? formData.side_effects.split(',').map(s => s.trim()).filter(s => s) : [],
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
        patient_entered: false,
        entry_source: 'doctor'
      }

      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('medications')
          .update(medicationData)
          .eq('id', editingId)

        if (error) {
          setError(`Failed to update medication: ${error.message}`)
        } else {
          setSuccess('Medication updated successfully')
          resetForm()
          await loadPatientMedications()
          
          // Trigger real-time update for patient
          if (onMedicationUpdate) {
            onMedicationUpdate({
              action: 'updated',
              medication: { ...medicationData, id: editingId },
              patientFirebaseUid
            })
          }
        }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('medications')
          .insert([medicationData])
          .select()
          .single()

        if (error) {
          setError(`Failed to add medication: ${error.message}`)
        } else {
          setSuccess('Medication prescribed successfully')
          resetForm()
          await loadPatientMedications()
          
          // Trigger real-time update for patient
          if (onMedicationUpdate) {
            onMedicationUpdate({
              action: 'added',
              medication: data,
              patientFirebaseUid
            })
          }
        }
      }
    } catch (err) {
      setError('An error occurred while saving medication')
      console.error('Error saving medication:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (medication) => {
    setFormData({
      medication_name: medication.medication_name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      start_date: medication.start_date,
      end_date: medication.end_date || '',
      indication: medication.indication || '',
      side_effects: medication.side_effects ? medication.side_effects.join(', ') : '',
      notes: medication.notes || '',
      is_active: medication.is_active
    })
    setEditingId(medication.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medication?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)

      if (error) {
        setError(`Failed to delete medication: ${error.message}`)
      } else {
        setSuccess('Medication deleted successfully')
        await loadPatientMedications()
        
        // Trigger real-time update for patient
        if (onMedicationUpdate) {
          onMedicationUpdate({
            action: 'deleted',
            medicationId: id,
            patientFirebaseUid
          })
        }
      }
    } catch (err) {
      setError('Error deleting medication')
      console.error('Error deleting medication:', err)
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) {
        setError(`Failed to update medication status: ${error.message}`)
      } else {
        setSuccess(`Medication ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        await loadPatientMedications()
        
        // Trigger real-time update for patient
        if (onMedicationUpdate) {
          onMedicationUpdate({
            action: 'status_changed',
            medicationId: id,
            newStatus: !currentStatus,
            patientFirebaseUid
          })
        }
      }
    } catch (err) {
      setError('Error updating medication status')
      console.error('Error updating medication status:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Pill className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Manage Medications for {patientName}
          </h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={loadPatientMedications}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Prescribe Medication
          </button>
        </div>
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
              {editingId ? 'Edit Medication' : 'Prescribe New Medication'}
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
                  Medication Name *
                </label>
                <input
                  type="text"
                  name="medication_name"
                  value={formData.medication_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (if applicable)
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indication/Reason
                </label>
                <input
                  type="text"
                  name="indication"
                  value={formData.indication}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What condition this treats"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Side Effects (comma-separated)
                </label>
                <input
                  type="text"
                  name="side_effects"
                  value={formData.side_effects}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Nausea, Dizziness"
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
                placeholder="Additional notes about this medication..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active prescription
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : editingId ? 'Update' : 'Prescribe'} Medication
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

      {/* Medications List */}
      <div className="space-y-4">
        {medications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No medications prescribed yet</p>
            <p className="text-sm mt-1">Prescribe medications for this patient</p>
          </div>
        ) : (
          medications.map((medication) => (
            <div key={medication.id} className={`border rounded-lg p-4 ${medication.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className={`font-medium ${medication.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                      {medication.medication_name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      medication.is_active ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                    }`}>
                      {medication.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {medication.entry_source === 'doctor' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                        Doctor Prescribed
                      </span>
                    )}
                    {medication.patient_entered && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                        Patient Entered
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Dosage:</strong> {medication.dosage}</p>
                    <p><strong>Frequency:</strong> {medication.frequency}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Started: {new Date(medication.start_date).toLocaleDateString()}</span>
                      </div>
                      {medication.end_date && (
                        <span>Ends: {new Date(medication.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {medication.prescribing_doctor && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Prescribed by: {medication.prescribing_doctor}</span>
                      </div>
                    )}
                    {medication.indication && (
                      <p><strong>For:</strong> {medication.indication}</p>
                    )}
                    {medication.side_effects && medication.side_effects.length > 0 && (
                      <p><strong>Side effects:</strong> {medication.side_effects.join(', ')}</p>
                    )}
                    {medication.notes && (
                      <p><strong>Notes:</strong> {medication.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleActive(medication.id, medication.is_active)}
                    className={`text-sm px-2 py-1 rounded ${
                      medication.is_active 
                        ? 'text-yellow-600 hover:text-yellow-800' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {medication.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(medication)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(medication.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DoctorMedicationManager
