import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import PatientTokenManager from '../components/PatientTokenManager'
import PatientMedicationManager from '../components/PatientMedicationManager'
import PatientMedicalHistoryEntry from '../components/PatientMedicalHistoryEntry'
import {
  User,
  FileText,
  Download,
  Clock,
  AlertTriangle,
  LogOut,
  Edit,
  Heart,
  Calendar,
  Pill,
  Activity
} from 'lucide-react'
import { patientService, diagnosisService, medicationService } from '../services/database'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const PatientDashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [patientProfile, setPatientProfile] = useState(null)
  const [diagnosisHistory, setDiagnosisHistory] = useState([])
  const [medicationHistory, setMedicationHistory] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: '',
    gender: '',
    allergies: '',
    profile_picture: ''
  })

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true)
        
        // Fetch patient profile
        const patients = await patientService.getPatients()
        if (patients.length > 0) {
          const profile = patients[0] // Get current user's profile
          setPatientProfile(profile)
          setProfileForm({
            name: profile.first_name + ' ' + profile.last_name,
            age: profile.age || '',
            gender: profile.gender || '',
            allergies: profile.allergies || '',
            profile_picture: profile.profile_picture || ''
          })

          // Fetch diagnosis history
          const diagnosisHistory = await diagnosisService.getDiagnosisSessionsByPatient(profile.id)
          setDiagnosisHistory(diagnosisHistory)

          // Fetch medication history
          const medicationHistory = await medicationService.getMedicationSessionsByPatient(profile.id)
          setMedicationHistory(medicationHistory)
        }
      } catch (error) {
        console.error('Error fetching patient data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchPatientData()
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const [firstName, ...lastNameParts] = profileForm.name.split(' ')
      const lastName = lastNameParts.join(' ')
      
      await patientService.updatePatient(patientProfile.id, {
        first_name: firstName,
        last_name: lastName,
        age: parseInt(profileForm.age),
        gender: profileForm.gender,
        allergies: profileForm.allergies,
        profile_picture: profileForm.profile_picture
      })
      
      setEditingProfile(false)
      // Refresh profile
      const patients = await patientService.getPatients()
      setPatientProfile(patients[0])
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Medical History Report', 20, 30)
    
    // Patient Info
    doc.setFontSize(12)
    doc.text(`Patient: ${patientProfile.first_name} ${patientProfile.last_name}`, 20, 50)
    doc.text(`Age: ${patientProfile.age || 'N/A'}`, 20, 60)
    doc.text(`Gender: ${patientProfile.gender || 'N/A'}`, 20, 70)
    doc.text(`Allergies: ${patientProfile.allergies || 'None'}`, 20, 80)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 90)
    
    let yPosition = 110
    
    // Diagnosis History
    doc.setFontSize(14)
    doc.text('Diagnosis History', 20, yPosition)
    yPosition += 10
    
    if (diagnosisHistory.length > 0) {
      const diagnosisData = diagnosisHistory.map(session => [
        new Date(session.session_date).toLocaleDateString(),
        session.final_diagnosis || 'N/A',
        session.risk_level || 'N/A',
        session.status || 'N/A'
      ])
      
      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Diagnosis', 'Risk Level', 'Status']],
        body: diagnosisData,
        margin: { left: 20 }
      })
      
      yPosition = doc.lastAutoTable.finalY + 20
    } else {
      doc.text('No diagnosis history available.', 20, yPosition)
      yPosition += 20
    }
    
    // Medication History
    doc.setFontSize(14)
    doc.text('Medication History', 20, yPosition)
    yPosition += 10
    
    if (medicationHistory.length > 0) {
      const medicationData = medicationHistory.map(session => [
        new Date(session.session_date).toLocaleDateString(),
        session.medications_checked || 'N/A',
        session.severity_level || 'N/A',
        session.status || 'N/A'
      ])
      
      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Medications', 'Severity', 'Status']],
        body: medicationData,
        margin: { left: 20 }
      })
    } else {
      doc.text('No medication history available.', 20, yPosition)
    }
    
    doc.save(`medical-history-${patientProfile.first_name}-${patientProfile.last_name}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your medical dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">
                My Medical Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email}
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
          {/* Patient Profile */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">My Profile</h3>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            
            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allergies</label>
                  <textarea
                    value={profileForm.allergies}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, allergies: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleProfileUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {patientProfile?.first_name} {patientProfile?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Age: {patientProfile?.age || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Gender: {patientProfile?.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Allergies: {patientProfile?.allergies || 'None listed'}</span>
                  </div>
                </div>
                
                <button
                  onClick={downloadPDF}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Medical History PDF
                </button>
              </div>
            )}
          </div>

          {/* Medical History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diagnosis History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Diagnosis History</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {diagnosisHistory.length > 0 ? (
                  diagnosisHistory.slice(0, 5).map((session) => (
                    <div key={session.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.final_diagnosis || 'Diagnosis analysis session'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(session.session_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                            session.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {session.risk_level || 'Low'} Risk
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center text-gray-500">
                    No diagnosis history available
                  </div>
                )}
              </div>
            </div>

            {/* Medication History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Medication History</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {medicationHistory.length > 0 ? (
                  medicationHistory.slice(0, 5).map((session) => (
                    <div key={session.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Medication check - {session.medications_checked || 'Multiple medications'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(session.session_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.severity_level === 'high' ? 'bg-red-100 text-red-800' :
                            session.severity_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {session.severity_level || 'Low'} Severity
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center text-gray-500">
                    No medication history available
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/med-checker')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Check Medications
                </button>
                <button
                  onClick={() => navigate('/diagnosis-review')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Diagnosis Review
                </button>
              </div>
            </div>

            {/* Manual Medical History Entry */}
            <PatientMedicalHistoryEntry />

            {/* My Medications - Complete medication management */}
            <PatientMedicationManager />

            {/* Patient Token Manager */}
            <PatientTokenManager />
          </div>
        </div>
      </main>
    </div>
  )
}

export default PatientDashboard
