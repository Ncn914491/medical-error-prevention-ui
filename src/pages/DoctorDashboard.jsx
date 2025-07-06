import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DoctorTokenAccess from '../components/DoctorTokenAccess'
import {
  Users,
  FileText,
  Download,
  Search,
  AlertTriangle,
  LogOut,
  Calendar,
  Activity,
  Stethoscope,
  Pill,
  Eye,
  Key,
  X,
  RefreshCw,
  Plus,
  Edit,
  Brain
} from 'lucide-react'
import { patientService, diagnosisService, medicationService } from '../services/database'
import { medicationDataService } from '../services/medicationDataService'
import { medicalSessionService } from '../services/medicalSessionService'
import DiagnosisForm from '../components/DiagnosisForm'
import MedicationInputForm from '../components/MedicationInputForm'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const DoctorDashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState([])
  const [connectedPatients, setConnectedPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientSessions, setPatientSessions] = useState([])
  const [sharedPatientId, setSharedPatientId] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false)
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [analysisResults, setAnalysisResults] = useState([])
  const [currentDiagnosisResult, setCurrentDiagnosisResult] = useState(null)
  const [currentMedicationResult, setCurrentMedicationResult] = useState(null)
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false)
  const [showAddDiagnosisForm, setShowAddDiagnosisForm] = useState(false)

  // Load connected patients via token sharing with enhanced data
  const loadConnectedPatients = async () => {
    if (!user?.uid) {
      console.log('No user UID available for loading connected patients')
      return
    }

    try {
      console.log('🔄 Loading connected patients for doctor:', user.uid)

      const { data, error } = await supabase
        .from('patient_doctor_connections')
        .select(`
          *,
          patient:profiles!patient_doctor_connections_patient_firebase_uid_fkey(
            id,
            firebase_uid,
            full_name,
            email,
            date_of_birth,
            gender,
            phone,
            address
          )
        `)
        .eq('doctor_firebase_uid', user.uid)
        .eq('is_active', true)
        .gte('token_expires_at', new Date().toISOString())
        .order('last_accessed_at', { ascending: false, nullsFirst: false })

      console.log('📊 Connected patients query result:', { data, error, doctorUid: user.uid })

      if (error) {
        console.error('❌ Error loading connected patients:', error)
      } else {
        console.log('✅ Connected patients loaded successfully:', {
          count: data?.length || 0,
          patients: data?.map(d => d.patient?.full_name || 'Unknown') || []
        })

        setConnectedPatients(data || [])

        // Also load medical summaries for each patient
        if (data && data.length > 0) {
          console.log('📋 Loading medical summaries for', data.length, 'patients')
          for (const connection of data) {
            await loadPatientMedicalSummary(connection.patient_firebase_uid)
          }
        } else {
          console.log('ℹ️ No connected patients found')
        }
      }
    } catch (err) {
      console.error('💥 Exception loading connected patients:', err)
    }
  }

  // Load patient medical summary using the updated service
  const loadPatientMedicalSummary = async (patientFirebaseUid) => {
    try {
      console.log('Loading medical summary for patient:', patientFirebaseUid)

      // Use the updated medicationDataService for consistent data fetching
      const [historyResult, medicationsResult] = await Promise.all([
        medicationDataService.getMedicalHistoryByFirebaseUid(patientFirebaseUid),
        medicationDataService.getMedicationsByFirebaseUid(patientFirebaseUid)
      ])

      console.log('Medical summary results:', { historyResult, medicationsResult })

      if (historyResult.success && medicationsResult.success) {
        // Store medical summaries for display with deduplication
        setConnectedPatients(prev => prev.map(connection => {
          if (connection.patient_firebase_uid === patientFirebaseUid) {
            return {
              ...connection,
              medicalHistory: historyResult.history?.slice(0, 5) || [], // Limit to 5 most recent
              activeMedications: medicationsResult.medications?.slice(0, 5) || [], // Limit to 5 most recent
              lastDataUpdate: new Date().toISOString()
            }
          }
          return connection
        }))

        // Also update selected patient if it matches
        setSelectedPatient(prev => {
          if (prev && (prev.firebase_uid === patientFirebaseUid || prev.id === patientFirebaseUid)) {
            return {
              ...prev,
              medicalHistory: historyResult.history || [],
              activeMedications: medicationsResult.medications || [],
              lastDataUpdate: new Date().toISOString()
            }
          }
          return prev
        })
      } else {
        console.error('Error loading medical summary:', {
          historyError: historyResult.error,
          medicationsError: medicationsResult.error
        })
      }
    } catch (err) {
      console.error('Exception loading patient medical summary:', err)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await loadConnectedPatients()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true)

        // Fetch all patients treated by this doctor
        const patientsData = await patientService.getPatients()
        setPatients(patientsData)

        // Load connected patients via token sharing
        await loadConnectedPatients()

      } catch (error) {
        console.error('Error fetching doctor data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDoctorData()
    }

    // Listen for patient connection updates and data changes
    const handlePatientConnectionUpdate = async (event) => {
      console.log('Patient connection updated:', event.detail)
      console.log('Triggering connected patients refresh from event...')
      await loadConnectedPatients()

      // Force a UI refresh
      setRefreshing(true)
      setTimeout(() => setRefreshing(false), 500)
    }

    const handlePatientDataUpdate = (event) => {
      console.log('Patient data updated:', event.detail)
      // Refresh specific patient's medical summary
      if (event.detail.patientFirebaseUid) {
        loadPatientMedicalSummary(event.detail.patientFirebaseUid)
      }
    }

    // Listen for various patient-related events
    window.addEventListener('doctorPatientConnectionUpdated', handlePatientConnectionUpdate)
    window.addEventListener('patientMedicationUpdated', handlePatientDataUpdate)
    window.addEventListener('patientMedicalHistoryUpdated', handlePatientDataUpdate)

    // Set up periodic refresh for real-time data synchronization
    const refreshInterval = setInterval(() => {
      if (connectedPatients.length > 0) {
        console.log('Periodic refresh of connected patients data')
        loadConnectedPatients()
      }
    }, 30000) // Refresh every 30 seconds

    return () => {
      window.removeEventListener('doctorPatientConnectionUpdated', handlePatientConnectionUpdate)
      window.removeEventListener('patientMedicationUpdated', handlePatientDataUpdate)
      window.removeEventListener('patientMedicalHistoryUpdated', handlePatientDataUpdate)
      clearInterval(refreshInterval)
    }
  }, [user, connectedPatients.length])

  const handlePatientSelect = async (patient) => {
    try {
      console.log('🔍 Selecting patient:', patient)
      setSelectedPatient(patient)

      // Load actual medical data for the selected patient
      const patientFirebaseUid = patient.firebase_uid || patient.id

      if (patientFirebaseUid) {
        console.log('📋 Loading medical data for patient:', patientFirebaseUid)

        // Load medical summary using the enhanced service
        await loadPatientMedicalSummary(patientFirebaseUid)

        // Try to fetch sessions (with error handling)
        try {
          const [diagnosisSessions, medicationSessions, patientSessions] = await Promise.all([
            diagnosisService.getDiagnosisSessionsByPatient(patient.id).catch(err => {
              console.warn('Diagnosis sessions not available:', err)
              return []
            }),
            medicationService.getMedicationSessionsByPatient(patient.id).catch(err => {
              console.warn('Medication sessions not available:', err)
              return []
            }),
            medicalSessionService.getPatientSessions(patientFirebaseUid).then(result => {
              if (result.success) {
                console.log('📋 Loaded patient-initiated sessions:', result.sessions.length)
                return result.sessions
              } else {
                console.warn('Patient sessions not available:', result.error)
                return []
              }
            }).catch(err => {
              console.warn('Patient sessions error:', err)
              return []
            })
          ])

          const allSessions = [
            ...diagnosisSessions.map(session => ({ ...session, type: 'diagnosis', source: 'doctor' })),
            ...medicationSessions.map(session => ({ ...session, type: 'medication', source: 'doctor' })),
            ...patientSessions.map(session => ({ ...session, source: 'patient' }))
          ].sort((a, b) => new Date(b.session_date) - new Date(a.session_date))

          setPatientSessions(allSessions)
          console.log('📊 Loaded total sessions:', allSessions.length, {
            doctor_diagnosis: diagnosisSessions.length,
            doctor_medication: medicationSessions.length,
            patient_initiated: patientSessions.length
          })
        } catch (sessionError) {
          console.warn('Sessions not available, continuing with medical data only:', sessionError)
          setPatientSessions([])
        }
      } else {
        console.error('❌ No patient UID available for medical data loading')
      }
    } catch (error) {
      console.error('❌ Error selecting patient:', error)
    }
  }

  const handlePatientAccess = async (patient) => {
    // When a doctor successfully accesses a patient via token
    console.log('Doctor accessed patient:', patient)
    setShowShareModal(false)

    // Immediately refresh the connected patients list to show the new connection
    console.log('Refreshing connected patients after token access...')
    await loadConnectedPatients()

    // Also trigger a manual refresh to ensure UI updates
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleConnectionUpdate = async (updateData) => {
    console.log('Connection update received:', updateData)

    // Immediately refresh connected patients
    await loadConnectedPatients()

    // Show visual feedback
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleDiagnosisComplete = async (result) => {
    console.log('🩺 Diagnosis analysis completed:', result)

    // Store the current result for display
    setCurrentDiagnosisResult(result)

    // Add to analysis results
    setAnalysisResults(prev => [result, ...prev])

    // Don't close the form - show the results instead
    console.log('✅ Diagnosis analysis ready for review')
  }

  const handleMedicationComplete = async (result) => {
    console.log('💊 Medication analysis completed:', result)

    // Store the current result for display
    setCurrentMedicationResult(result)

    // Add to analysis results
    setAnalysisResults(prev => [result, ...prev])

    // Don't close the form - show the results instead
    console.log('✅ Medication analysis ready for review')
  }

  const saveDiagnosisToPatient = async () => {
    if (!selectedPatient || !currentDiagnosisResult) return

    try {
      const patientFirebaseUid = selectedPatient.firebase_uid || selectedPatient.id

      const diagnosisData = {
        condition_name: currentDiagnosisResult.data.patient_name ? `Diagnosis for ${currentDiagnosisResult.data.patient_name}` : 'AI Diagnosis Analysis',
        diagnosis_date: new Date().toISOString().split('T')[0],
        status: 'active',
        severity: currentDiagnosisResult.data.overall_risk || 'moderate',
        notes: `AI Analysis: ${currentDiagnosisResult.data.recommendations?.join('; ') || 'Analysis completed'}\n\nAnalyzed by Dr. ${user?.email || 'Unknown'} using AI assistance`,
        treating_doctor: user?.email || 'Unknown Doctor'
      }

      const historyResult = await medicationDataService.addMedicalHistory(diagnosisData, patientFirebaseUid)

      if (historyResult.success) {
        console.log('✅ Diagnosis saved to patient medical history')

        // Refresh patient medical data
        await loadPatientMedicalSummary(patientFirebaseUid)

        // Dispatch event for patient dashboard updates
        window.dispatchEvent(new CustomEvent('patientMedicalHistoryUpdated', {
          detail: {
            patientFirebaseUid,
            action: 'doctor_diagnosis_added',
            diagnosis: diagnosisData,
            timestamp: new Date().toISOString()
          }
        }))

        // Close the form and clear results
        setShowDiagnosisForm(false)
        setCurrentDiagnosisResult(null)

        alert('Diagnosis saved to patient medical history successfully!')
      } else {
        console.error('❌ Failed to save diagnosis:', historyResult.error)
        alert('Failed to save diagnosis. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error saving diagnosis:', error)
      alert('Error saving diagnosis. Please try again.')
    }
  }

  const saveMedicationsToPatient = async () => {
    if (!selectedPatient || !currentMedicationResult) return

    try {
      const patientFirebaseUid = selectedPatient.firebase_uid || selectedPatient.id

      // If the result contains medication data, save it
      if (currentMedicationResult.data && currentMedicationResult.data.medications) {
        for (const medication of currentMedicationResult.data.medications) {
          const medicationData = {
            medication_name: medication.name || medication.medication_name,
            dosage: medication.dosage || '1 tablet',
            frequency: medication.frequency || 'As directed',
            start_date: new Date().toISOString().split('T')[0],
            indication: 'Doctor prescribed',
            notes: `Prescribed by Dr. ${user?.email || 'Unknown'} via medication analysis`,
            is_active: true
          }

          const medicationResult = await medicationDataService.addMedication(medicationData, patientFirebaseUid)

          if (medicationResult.success) {
            console.log('✅ Medication saved:', medication.name)
          } else {
            console.error('❌ Failed to save medication:', medicationResult.error)
          }
        }

        // Refresh patient medical data
        await loadPatientMedicalSummary(patientFirebaseUid)

        // Dispatch event for patient dashboard updates
        window.dispatchEvent(new CustomEvent('patientMedicationUpdated', {
          detail: {
            patientFirebaseUid,
            action: 'doctor_medication_prescribed',
            medications: currentMedicationResult.data.medications,
            timestamp: new Date().toISOString()
          }
        }))

        // Close the form and clear results
        setShowMedicationForm(false)
        setCurrentMedicationResult(null)

        alert('Medications saved to patient records successfully!')
      } else {
        alert('No medications found in analysis to save.')
      }
    } catch (error) {
      console.error('❌ Error saving medications:', error)
      alert('Error saving medications. Please try again.')
    }
  }

  const handleAddDiagnosis = async (diagnosisData) => {
    if (!selectedPatient) return

    try {
      const patientFirebaseUid = selectedPatient.firebase_uid || selectedPatient.id

      const formattedData = {
        ...diagnosisData,
        treating_doctor: user?.email || 'Unknown Doctor',
        diagnosis_date: diagnosisData.diagnosis_date || new Date().toISOString().split('T')[0]
      }

      const result = await medicationDataService.addMedicalHistory(formattedData, patientFirebaseUid)

      if (result.success) {
        await loadPatientMedicalSummary(patientFirebaseUid)
        setShowAddDiagnosisForm(false)
        alert('Diagnosis added successfully!')
      } else {
        alert('Failed to add diagnosis. Please try again.')
      }
    } catch (error) {
      console.error('Error adding diagnosis:', error)
      alert('Error adding diagnosis. Please try again.')
    }
  }

  const handleAddMedication = async (medicationData) => {
    if (!selectedPatient) return

    try {
      const patientFirebaseUid = selectedPatient.firebase_uid || selectedPatient.id

      const formattedData = {
        ...medicationData,
        start_date: medicationData.start_date || new Date().toISOString().split('T')[0],
        notes: `${medicationData.notes || ''}\n\nPrescribed by Dr. ${user?.email || 'Unknown Doctor'}`.trim(),
        is_active: true
      }

      const result = await medicationDataService.addMedication(formattedData, patientFirebaseUid)

      if (result.success) {
        await loadPatientMedicalSummary(patientFirebaseUid)
        setShowAddMedicationForm(false)
        alert('Medication added successfully!')
      } else {
        alert('Failed to add medication. Please try again.')
      }
    } catch (error) {
      console.error('Error adding medication:', error)
      alert('Error adding medication. Please try again.')
    }
  }

  const downloadPatientReport = () => {
    if (!selectedPatient) return
    
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Patient Medical Report', 20, 30)
    
    // Patient Info
    doc.setFontSize(12)
    doc.text(`Patient: ${selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || 'Unknown Patient'}`, 20, 50)
    doc.text(`Medical Record: ${selectedPatient.medical_record_number || 'N/A'}`, 20, 60)
    doc.text(`Age: ${selectedPatient.age || 'N/A'}`, 20, 70)
    doc.text(`Gender: ${selectedPatient.gender || 'N/A'}`, 20, 80)
    doc.text(`Doctor: ${user?.email}`, 20, 90)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 100)
    
    let yPosition = 120
    
    // Sessions History
    doc.setFontSize(14)
    doc.text('Medical Sessions History', 20, yPosition)
    yPosition += 10
    
    if (patientSessions.length > 0) {
      const sessionData = patientSessions.map(session => [
        new Date(session.session_date).toLocaleDateString(),
        session.type === 'diagnosis' ? 'Diagnosis' : 'Medication',
        session.type === 'diagnosis' 
          ? (session.final_diagnosis || 'Analysis') 
          : (session.medications_checked || 'Medication Check'),
        session.risk_level || session.severity_level || 'Low',
        session.status || 'Completed'
      ])
      
      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Type', 'Details', 'Risk/Severity', 'Status']],
        body: sessionData,
        margin: { left: 20 }
      })
    } else {
      doc.text('No session history available.', 20, yPosition)
    }
    
    const patientName = selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || 'Unknown-Patient'
    doc.save(`patient-report-${patientName.replace(/\s+/g, '-')}.pdf`)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.medical_record_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading doctor dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Doctor Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <Key className="h-4 w-4 mr-2" />
                Access Shared Patient
              </button>
              
              <span className="text-sm text-gray-700">
                Dr. {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connected Patients via Token Sharing */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Connected Patients</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{connectedPatients.length} connected</span>
                  <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {connectedPatients.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p className="text-sm">No connected patients yet</p>
                  <p className="text-xs mt-1">Use "Access Patient Data" to connect via token</p>
                </div>
              ) : (
                connectedPatients.map((connection) => (
                  <div
                    key={connection.id}
                    onClick={() => setSelectedPatient(connection.patient)}
                    className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                      selectedPatient?.firebase_uid === connection.patient_firebase_uid ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {connection.patient?.full_name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {connection.patient?.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Accessed: {connection.access_count || 0} times
                        </span>
                        {connection.last_accessed_at && (
                          <span className="text-xs text-gray-500">
                            • Last: {new Date(connection.last_accessed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {connection.medicalHistory && connection.activeMedications && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {connection.medicalHistory.length} conditions
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {connection.activeMedications.length} medications
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      <Key className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Regular Patients List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">My Patients</h3>
                <span className="text-sm text-gray-500">{patients.length} total</span>
              </div>
              
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                    selectedPatient?.id === patient.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'}
                  </p>
                  <p className="text-sm text-gray-600">
                    MRN: {patient.medical_record_number || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {patient.age ? `Age: ${patient.age}` : ''} {patient.gender ? `• ${patient.gender}` : ''}
                  </p>
                </div>
              ))}
              
              {filteredPatients.length === 0 && (
                <div className="px-6 py-4 text-center text-gray-500">
                  No patients found
                </div>
              )}
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">
                        {selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || 'Unknown Patient'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Medical Record: {selectedPatient.medical_record_number || 'N/A'}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">Age: {selectedPatient.age || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Gender: {selectedPatient.gender || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Allergies: {selectedPatient.allergies || 'None listed'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowDiagnosisForm(true)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        AI Diagnosis Assistant
                      </button>
                      <button
                        onClick={() => setShowMedicationForm(true)}
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        <Pill className="h-4 w-4 mr-2" />
                        Medication Analysis
                      </button>
                      <button
                        onClick={() => setShowAddDiagnosisForm(true)}
                        className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Diagnosis
                      </button>
                      <button
                        onClick={() => setShowAddMedicationForm(true)}
                        className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication
                      </button>
                      <button
                        onClick={downloadPatientReport}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Diagnosis Assistant Modal */}
                {showDiagnosisForm && (
                  <div className="bg-white rounded-lg shadow-lg border">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">AI Diagnosis Assistant</h3>
                      <button
                        onClick={() => {
                          setShowDiagnosisForm(false)
                          setCurrentDiagnosisResult(null)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {!currentDiagnosisResult ? (
                      <div className="p-6">
                        <DiagnosisForm
                          selectedPatient={selectedPatient}
                          onAnalysisComplete={handleDiagnosisComplete}
                          isPatientView={false}
                        />
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="mb-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-4">AI Analysis Results</h4>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <Brain className="h-5 w-5 text-blue-600 mr-2" />
                              <span className="font-medium text-blue-900">Overall Assessment</span>
                            </div>
                            <p className="text-sm text-blue-800">
                              Risk Level: <span className="font-semibold">{currentDiagnosisResult.data?.overall_risk || 'Moderate'}</span>
                            </p>
                            <p className="text-sm text-blue-800">
                              Consistency: <span className="font-semibold">{currentDiagnosisResult.data?.overall_consistency || 'Good'}</span>
                            </p>
                          </div>

                          {currentDiagnosisResult.data?.recommendations && currentDiagnosisResult.data.recommendations.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-green-900 mb-2">AI Recommendations</h5>
                              <ul className="list-disc list-inside space-y-1">
                                {currentDiagnosisResult.data.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-green-800">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentDiagnosisResult.data?.issues && currentDiagnosisResult.data.issues.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-yellow-900 mb-2">Potential Issues Identified</h5>
                              <ul className="space-y-2">
                                {currentDiagnosisResult.data.issues.map((issue, index) => (
                                  <li key={index} className="text-sm text-yellow-800">
                                    <span className="font-medium">{issue.type}:</span> {issue.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setShowDiagnosisForm(false)
                              setCurrentDiagnosisResult(null)
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveDiagnosisToPatient}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                          >
                            Save to Patient Record
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medication Analysis Modal */}
                {showMedicationForm && (
                  <div className="bg-white rounded-lg shadow-lg border">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Medication Analysis</h3>
                      <button
                        onClick={() => {
                          setShowMedicationForm(false)
                          setCurrentMedicationResult(null)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {!currentMedicationResult ? (
                      <div className="p-6">
                        <MedicationInputForm
                          selectedPatient={selectedPatient}
                          onAnalysisComplete={handleMedicationComplete}
                          isPatientView={false}
                        />
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="mb-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-4">Medication Analysis Results</h4>

                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <Pill className="h-5 w-5 text-green-600 mr-2" />
                              <span className="font-medium text-green-900">Analysis Summary</span>
                            </div>
                            <p className="text-sm text-green-800">
                              Total Medications Analyzed: <span className="font-semibold">{currentMedicationResult.data?.medications?.length || 0}</span>
                            </p>
                            <p className="text-sm text-green-800">
                              Risk Level: <span className="font-semibold">{currentMedicationResult.data?.overall_risk || 'Low'}</span>
                            </p>
                          </div>

                          {currentMedicationResult.data?.recommendations && currentMedicationResult.data.recommendations.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
                              <ul className="list-disc list-inside space-y-1">
                                {currentMedicationResult.data.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-blue-800">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentMedicationResult.data?.issues && currentMedicationResult.data.issues.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-yellow-900 mb-2">Issues Identified</h5>
                              <ul className="space-y-2">
                                {currentMedicationResult.data.issues.map((issue, index) => (
                                  <li key={index} className="text-sm text-yellow-800">
                                    <span className="font-medium">{issue.type}:</span> {issue.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setShowMedicationForm(false)
                              setCurrentMedicationResult(null)
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveMedicationsToPatient}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                          >
                            Save to Patient Record
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Add Diagnosis Form */}
                {showAddDiagnosisForm && (
                  <div className="bg-white rounded-lg shadow-lg border">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Add Diagnosis</h3>
                      <button
                        onClick={() => setShowAddDiagnosisForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target)
                        const diagnosisData = {
                          condition_name: formData.get('condition_name'),
                          diagnosis_date: formData.get('diagnosis_date'),
                          status: formData.get('status'),
                          severity: formData.get('severity'),
                          notes: formData.get('notes')
                        }
                        handleAddDiagnosis(diagnosisData)
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Condition Name *
                          </label>
                          <input
                            type="text"
                            name="condition_name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter condition or diagnosis"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Diagnosis Date
                            </label>
                            <input
                              type="date"
                              name="diagnosis_date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              name="status"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="active">Active</option>
                              <option value="resolved">Resolved</option>
                              <option value="chronic">Chronic</option>
                              <option value="monitoring">Monitoring</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Severity
                          </label>
                          <select
                            name="severity"
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
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes about the diagnosis..."
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setShowAddDiagnosisForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                          >
                            Add Diagnosis
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Add Medication Form */}
                {showAddMedicationForm && (
                  <div className="bg-white rounded-lg shadow-lg border">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Add Medication</h3>
                      <button
                        onClick={() => setShowAddMedicationForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target)
                        const medicationData = {
                          medication_name: formData.get('medication_name'),
                          dosage: formData.get('dosage'),
                          frequency: formData.get('frequency'),
                          start_date: formData.get('start_date'),
                          indication: formData.get('indication'),
                          notes: formData.get('notes')
                        }
                        handleAddMedication(medicationData)
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medication Name *
                          </label>
                          <input
                            type="text"
                            name="medication_name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter medication name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dosage *
                            </label>
                            <input
                              type="text"
                              name="dosage"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="e.g., 10mg, 1 tablet"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Frequency *
                            </label>
                            <select
                              name="frequency"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Select frequency</option>
                              <option value="Once daily">Once daily</option>
                              <option value="Twice daily">Twice daily</option>
                              <option value="Three times daily">Three times daily</option>
                              <option value="Four times daily">Four times daily</option>
                              <option value="As needed">As needed</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              name="start_date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Indication
                            </label>
                            <input
                              type="text"
                              name="indication"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Reason for prescription"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Additional instructions or notes..."
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setShowAddMedicationForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                          >
                            Add Medication
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Enhanced Patient Medical Data Display */}
                {selectedPatient?.firebase_uid && (
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Activity className="h-5 w-5 text-blue-600 mr-2" />
                          Medical Overview
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          Last updated: {selectedPatient.lastDataUpdate ? new Date(selectedPatient.lastDataUpdate).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Medications Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-semibold text-gray-900 flex items-center">
                              <Pill className="h-4 w-4 text-green-600 mr-2" />
                              Current Medications
                            </h4>
                            <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">
                              {selectedPatient.activeMedications?.length || 0} active
                            </span>
                          </div>

                          {selectedPatient.activeMedications && selectedPatient.activeMedications.length > 0 ? (
                            <div className="space-y-3">
                              {selectedPatient.activeMedications.map((medication, index) => (
                                <div key={medication.id || index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-semibold text-gray-900">{medication.medication_name}</h5>
                                      <div className="mt-1 space-y-1">
                                        <p className="text-xs text-gray-600">
                                          <span className="font-medium">Dosage:</span> {medication.dosage}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          <span className="font-medium">Frequency:</span> {medication.frequency}
                                        </p>
                                        {medication.indication && (
                                          <p className="text-xs text-gray-600">
                                            <span className="font-medium">For:</span> {medication.indication}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                        Since {new Date(medication.start_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No current medications</p>
                            </div>
                          )}
                        </div>

                        {/* Medical History Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-semibold text-gray-900 flex items-center">
                              <FileText className="h-4 w-4 text-blue-600 mr-2" />
                              Medical History
                            </h4>
                            <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
                              {selectedPatient.medicalHistory?.length || 0} conditions
                            </span>
                          </div>

                          {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                            <div className="space-y-3">
                              {selectedPatient.medicalHistory.map((history, index) => (
                                <div key={history.id || index} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-semibold text-gray-900">{history.condition_name}</h5>
                                      <div className="mt-1 space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            history.status === 'active' ? 'bg-red-100 text-red-800' :
                                            history.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                            history.status === 'chronic' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {history.status || 'Active'}
                                          </span>
                                          {history.severity && (
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                              history.severity === 'severe' || history.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                              history.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-green-100 text-green-800'
                                            }`}>
                                              {history.severity}
                                            </span>
                                          )}
                                        </div>
                                        {history.treating_doctor && (
                                          <p className="text-xs text-gray-600">
                                            <span className="font-medium">Doctor:</span> {history.treating_doctor}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                        {new Date(history.diagnosis_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No medical history recorded</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* No data message for completely empty patient */}
                      {(!selectedPatient.activeMedications || selectedPatient.activeMedications.length === 0) &&
                       (!selectedPatient.medicalHistory || selectedPatient.medicalHistory.length === 0) && (
                        <div className="text-center py-12 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Medical Data Available</h4>
                          <p className="text-sm text-gray-600 mb-4">This patient hasn't added any medical information yet.</p>
                          <p className="text-xs text-gray-500">Use the buttons above to add diagnoses or medications for this patient.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Session History */}
                <div className="bg-white rounded-lg shadow-lg border">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        Medical Session History
                      </h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        {patientSessions.length} sessions
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {patientSessions.length > 0 ? (
                      patientSessions.map((session) => (
                        <div key={`${session.type}-${session.id}`} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                          session.source === 'patient' ? 'border-l-4 border-l-orange-400 bg-orange-50/30' : ''
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {session.type === 'diagnosis' ? (
                                  <FileText className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Pill className="h-4 w-4 text-green-500" />
                                )}
                                <p className="text-sm font-medium text-gray-900">
                                  {session.source === 'patient' ? 'Patient ' : ''}
                                  {session.type === 'diagnosis' ? 'Diagnosis Entry' : 'Medication Entry'}
                                </p>
                                {session.source === 'patient' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    <Users className="h-3 w-3 mr-1" />
                                    Patient Added
                                  </span>
                                )}
                                {session.action_performed && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {session.action_performed}
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 mb-1">
                                {session.type === 'diagnosis'
                                  ? (session.final_diagnosis || session.raw_session?.results?.condition_name || 'Medical condition added')
                                  : (session.medications_checked || session.raw_session?.results?.medication_name || 'Medication added')
                                }
                              </p>

                              {session.raw_session?.results?.medication_details && (
                                <p className="text-xs text-gray-500">
                                  Details: {session.raw_session.results.medication_details}
                                </p>
                              )}

                              {session.raw_session?.results?.indication && (
                                <p className="text-xs text-gray-500">
                                  Indication: {session.raw_session.results.indication}
                                </p>
                              )}

                              <div className="flex items-center space-x-4 mt-2">
                                <p className="text-xs text-gray-500">
                                  📅 {new Date(session.session_date).toLocaleDateString()} at {new Date(session.session_date).toLocaleTimeString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Status: {session.status || 'Completed'}
                                </p>
                                {session.source === 'patient' && (
                                  <p className="text-xs text-orange-600 font-medium">
                                    👤 Self-reported
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (session.risk_level === 'high' || session.risk_level === 'critical' || session.severity_level === 'high') ? 'bg-red-100 text-red-800' :
                                (session.risk_level === 'medium' || session.risk_level === 'moderate' || session.severity_level === 'medium') ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {session.risk_level || session.severity_level || 'Low'} {session.type === 'diagnosis' ? 'Risk' : 'Priority'}
                              </span>

                              {session.raw_session?.recommendations && session.raw_session.recommendations.length > 0 && (
                                <div className="text-xs text-gray-500 text-right max-w-xs">
                                  <p className="font-medium">Recommendations:</p>
                                  <p className="truncate">{session.raw_session.recommendations[0]}</p>
                                  {session.raw_session.recommendations.length > 1 && (
                                    <p className="text-gray-400">+{session.raw_session.recommendations.length - 1} more</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-4 text-center text-gray-500">
                        No medical sessions found for this patient
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-600">Choose a patient from the list to view their medical history and session details.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Patient Token Access Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Access Patient Data</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <DoctorTokenAccess
              onPatientAccess={handlePatientAccess}
              onConnectionUpdate={handleConnectionUpdate}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard
