import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/PatientsPage';
import MedCheckerPage from './pages/MedCheckerPage';
import DiagnosisReviewPage from './pages/DiagnosisReviewPage';
import { saveAnalysisResult, loadAnalysisHistory } from './services/storageService';
import { useAuth } from './contexts/AuthContext';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ComponentTest from './pages/ComponentTest';
import AuthNotification from './components/AuthNotification';
import FirebaseTest from './components/FirebaseTest';
import TestDataManager from './pages/TestDataManager';
import DatabaseInitializer from './components/DatabaseInitializer';

function AppContent() {
  const { userProfile } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);

  useEffect(() => {
    const savedHistory = loadAnalysisHistory();
    if (savedHistory.length > 0) {
      setAnalysisResults(savedHistory);
    }
  }, []);

  useEffect(() => {
    if (analysisResults.length > 0) {
      const latestResult = analysisResults[0];
      if (latestResult && !latestResult.saved_at) {
        saveAnalysisResult(latestResult);
      }
    }
  }, [analysisResults]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    if (patient === null) {
      setAnalysisResults([]);
    } else if (selectedPatient && patient.patient_id !== selectedPatient.patient_id) {
      const patientHistory = loadAnalysisHistory(patient.patient_id);
      setAnalysisResults(patientHistory);
    } else if (!selectedPatient) {
      const patientHistory = loadAnalysisHistory(patient.patient_id);
      setAnalysisResults(patientHistory);
    }
  };

  const handleAnalysisComplete = (result) => {
    const enhancedResult = {
      ...result,
      id: `ana_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: result.timestamp || new Date().toISOString()
    };

    setAnalysisResults(prev => [enhancedResult, ...prev]);
    saveAnalysisResult(enhancedResult);
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {userProfile?.role === 'patient' ? (
              <PatientDashboard />
            ) : userProfile?.role === 'doctor' ? (
              <DoctorDashboard />
            ) : (
              <Dashboard />
            )}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/patient" 
        element={
          <ProtectedRoute>
            <PatientDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/doctor" 
        element={
          <ProtectedRoute>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patients" 
        element={
          <ProtectedRoute>
            <Layout activeTab="patients">
              <PatientsPage 
                selectedPatient={selectedPatient}
                onPatientSelect={handlePatientSelect}
              />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route
        path="/med-checker"
        element={
          <ProtectedRoute>
            {userProfile?.role === 'patient' ? (
              <MedCheckerPage
                selectedPatient={userProfile}
                onAnalysisComplete={handleAnalysisComplete}
                analysisResults={analysisResults}
                isPatientView={true}
                currentUser={userProfile}
              />
            ) : (
              <Layout activeTab="med-checker">
                <MedCheckerPage
                  selectedPatient={selectedPatient}
                  onAnalysisComplete={handleAnalysisComplete}
                  analysisResults={analysisResults}
                />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnosis-review"
        element={
          <ProtectedRoute>
            {userProfile?.role === 'patient' ? (
              <DiagnosisReviewPage
                selectedPatient={userProfile}
                onAnalysisComplete={handleAnalysisComplete}
                analysisResults={analysisResults}
                isPatientView={true}
                currentUser={userProfile}
              />
            ) : (
              <Layout activeTab="diagnosis-review">
                <DiagnosisReviewPage
                  selectedPatient={selectedPatient}
                  onAnalysisComplete={handleAnalysisComplete}
                  analysisResults={analysisResults}
                />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
      <Route path="/test" element={<ComponentTest />} />
      <Route path="/firebase-test" element={<FirebaseTest />} />
      <Route path="/test-data" element={<TestDataManager />} />
      <Route path="/db-init" element={<DatabaseInitializer />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <AuthNotification />
      </AuthProvider>
    </Router>
  )
}

export default App;
