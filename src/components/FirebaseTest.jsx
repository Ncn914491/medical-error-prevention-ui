import React, { useState, useEffect } from 'react'
import { firebaseAuth } from '../lib/firebase'

const FirebaseTest = () => {
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Test Firebase configuration on component mount
    console.log('🧪 Firebase Test Component Mounted')
    console.log('🧪 Environment Variables Check:')
    console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'Missing')
    console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
    console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
  }, [])

  const testEmailSignup = async () => {
    setLoading(true)
    setTestResult('Testing email signup...')
    
    try {
      const testEmail = `test${Date.now()}@example.com`
      const testPassword = 'TestPassword123!'
      
      console.log('🧪 Testing Firebase email signup with:', testEmail)
      
      const result = await firebaseAuth.signUpWithEmail(testEmail, testPassword)
      
      if (result.error) {
        setTestResult(`❌ Signup failed: ${result.error.message}`)
        console.error('🧪 Test signup error:', result.error)
      } else {
        setTestResult(`✅ Signup successful! User ID: ${result.user.uid}`)
        console.log('🧪 Test signup success:', result.user.uid)
        
        // Clean up - delete the test user
        try {
          await result.user.delete()
          console.log('🧪 Test user cleaned up')
        } catch (cleanupError) {
          console.log('🧪 Cleanup error (expected):', cleanupError.message)
        }
      }
    } catch (error) {
      setTestResult(`❌ Test error: ${error.message}`)
      console.error('🧪 Test catch error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">🧪 Firebase Configuration Test</h2>
      
      <div className="space-y-4">
        <div className="text-sm">
          <p><strong>API Key:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing'}</p>
          <p><strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing'}</p>
          <p><strong>Auth Domain:</strong> {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Missing'}</p>
        </div>
        
        <button
          onClick={testEmailSignup}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Email Signup'}
        </button>
        
        {testResult && (
          <div className="p-3 bg-gray-100 rounded text-sm">
            {testResult}
          </div>
        )}
      </div>
    </div>
  )
}

export default FirebaseTest
