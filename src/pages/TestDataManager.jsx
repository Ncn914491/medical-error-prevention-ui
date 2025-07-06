import React, { useState } from 'react'
import { createAllTestUsers, getTestUserCredentials, TEST_USERS } from '../services/testDataService'
import DatabaseDebugger from '../components/DatabaseDebugger'
import SupabaseSetupGuide from '../components/SupabaseSetupGuide'
import DatabaseSetup from '../components/DatabaseSetup'
import ComprehensiveSystemTest from '../components/ComprehensiveSystemTest'
import MedicalDataSetup from '../components/MedicalDataSetup'
import SupabaseDiagnostics from '../components/SupabaseDiagnostics'
import DatabaseSchemaFixer from '../components/DatabaseSchemaFixer'
import CriticalIssuesFixer from '../components/CriticalIssuesFixer'
import CriticalSchemaFixer from '../components/CriticalSchemaFixer'
import RouteDebugger from '../components/RouteDebugger'
import { AlertCircle, CheckCircle, Users, UserCheck, Copy } from 'lucide-react'

const TestDataManager = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleCreateTestUsers = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const results = await createAllTestUsers()
      setResults(results)
      
      if (results.errors.length > 0) {
        setError(`Some users could not be created. Check console for details.`)
      }
    } catch (err) {
      setError(`Failed to create test users: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    const credentials = getTestUserCredentials()
    const text = credentials.map(user => 
      `${user.role.toUpperCase()}: ${user.name}\nEmail: ${user.email}\nPassword: ${user.password}\n`
    ).join('\n')
    
    navigator.clipboard.writeText(text)
    alert('Credentials copied to clipboard!')
  }

  const testCredentials = getTestUserCredentials()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Data Manager</h1>
            <p className="text-gray-600">Create test user accounts and sample medical data</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {results && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Test users created successfully!</span>
              </div>
              <div className="text-sm text-green-600">
                <p>Doctors created: {results.doctors.length}</p>
                <p>Patients created: {results.patients.length}</p>
                {results.errors.length > 0 && (
                  <p className="text-red-600">Errors: {results.errors.length}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Critical Schema Fixer - HIGHEST PRIORITY for schema cache errors */}
            <CriticalSchemaFixer />

            {/* Critical Issues Fixer - PRIORITY for current issues */}
            <CriticalIssuesFixer />

            {/* Supabase Diagnostics - Priority for troubleshooting */}
            <SupabaseDiagnostics />

            {/* Route Debugger - For navigation issues */}
            <RouteDebugger />

            {/* Database Schema Fixer - For critical schema issues */}
            <DatabaseSchemaFixer />

            {/* Supabase Setup Guide */}
            <SupabaseSetupGuide />

            {/* Database Setup */}
            <DatabaseSetup />

            {/* Medical Data Setup */}
            <MedicalDataSetup />

            {/* Database Debugger */}
            <DatabaseDebugger />

            {/* Comprehensive System Test */}
            <ComprehensiveSystemTest />

            {/* Create Test Users Section */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Create Test Users
              </h2>
              <p className="text-gray-600 mb-4">
                This will create test accounts in Firebase Authentication and user profiles in the database.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">👨‍⚕️ Doctors ({TEST_USERS.doctors.length})</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {TEST_USERS.doctors.map(doctor => (
                      <li key={doctor.email}>• {doctor.profile.full_name} - {doctor.profile.specialization}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">🏥 Patients ({TEST_USERS.patients.length})</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    {TEST_USERS.patients.map(patient => (
                      <li key={patient.email}>• {patient.profile.full_name}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleCreateTestUsers}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating Test Users...' : 'Create All Test Users'}
              </button>
            </div>

            {/* Test Credentials Section */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Test User Credentials
                </h2>
                <button
                  onClick={copyCredentials}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Doctors */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">👨‍⚕️ Doctors</h3>
                  <div className="space-y-3">
                    {testCredentials.filter(user => user.role === 'doctor').map(user => (
                      <div key={user.email} className="bg-blue-50 p-3 rounded border">
                        <p className="font-medium text-blue-900">{user.name}</p>
                        <p className="text-sm text-blue-700">Email: {user.email}</p>
                        <p className="text-sm text-blue-700">Password: {user.password}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patients */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">🏥 Patients</h3>
                  <div className="space-y-3">
                    {testCredentials.filter(user => user.role === 'patient').map(user => (
                      <div key={user.email} className="bg-green-50 p-3 rounded border">
                        <p className="font-medium text-green-900">{user.name}</p>
                        <p className="text-sm text-green-700">Email: {user.email}</p>
                        <p className="text-sm text-green-700">Password: {user.password}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="border rounded-lg p-6 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4 text-yellow-900">📋 Instructions</h2>
              <div className="text-sm text-yellow-800 space-y-2">
                <p><strong>1.</strong> Click "Create All Test Users" to generate test accounts</p>
                <p><strong>2.</strong> Use the credentials above to test different user roles</p>
                <p><strong>3.</strong> Patients will have sample medical history and medications</p>
                <p><strong>4.</strong> Doctors can access patient data through token sharing</p>
                <p><strong>5.</strong> Test the medication checker and diagnosis review features</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="text-center pt-4">
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Login Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestDataManager
