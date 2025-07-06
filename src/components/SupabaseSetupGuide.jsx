import React, { useState, useEffect } from 'react'
import { checkSupabaseConnection } from '../lib/supabase'
import { 
  Database, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Key,
  Globe
} from 'lucide-react'

const SupabaseSetupGuide = () => {
  const [setupStatus, setSetupStatus] = useState('checking')
  const [envVars, setEnvVars] = useState({})

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    setEnvVars({
      url: supabaseUrl,
      key: supabaseKey,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlConfigured: supabaseUrl && !supabaseUrl.includes('your-project-id'),
      keyConfigured: supabaseKey && !supabaseKey.includes('your-anon-key')
    })

    if (!supabaseUrl || !supabaseKey) {
      setSetupStatus('missing-env')
    } else if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
      setSetupStatus('placeholder-values')
    } else {
      try {
        const isConnected = await checkSupabaseConnection()
        setSetupStatus(isConnected ? 'connected' : 'connection-failed')
      } catch (err) {
        setSetupStatus('connection-error')
      }
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'green'
      case 'missing-env':
      case 'placeholder-values':
      case 'connection-failed':
      case 'connection-error': return 'red'
      default: return 'yellow'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5" />
      case 'missing-env':
      case 'placeholder-values':
      case 'connection-failed':
      case 'connection-error': return <XCircle className="w-5 h-5" />
      default: return <AlertTriangle className="w-5 h-5" />
    }
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'connected': return 'Cloud Supabase Connected Successfully!'
      case 'missing-env': return 'Environment Variables Missing'
      case 'placeholder-values': return 'Please Update Placeholder Values'
      case 'connection-failed': return 'Connection Failed - Check Credentials'
      case 'connection-error': return 'Connection Error - Check Configuration'
      default: return 'Checking Connection...'
    }
  }

  const color = getStatusColor(setupStatus)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Database className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Supabase Setup Guide</h3>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 border rounded-lg bg-${color}-50 border-${color}-200`}>
        <div className="flex items-center space-x-2">
          <span className={`text-${color}-600`}>
            {getStatusIcon(setupStatus)}
          </span>
          <span className={`font-medium text-${color}-800`}>
            {getStatusMessage(setupStatus)}
          </span>
        </div>
      </div>

      {setupStatus !== 'connected' && (
        <div className="space-y-6">
          {/* Step 1: Create Supabase Project */}
          <div className="border rounded-lg p-4">
            <h4 className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
              <Globe className="w-4 h-4" />
              <span>Step 1: Create Supabase Project</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">supabase.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
              <li>Sign up/login and click "New Project"</li>
              <li>Name: <code className="bg-gray-100 px-1 rounded">medical-error-prevention</code></li>
              <li>Create a strong database password</li>
              <li>Choose a region close to your users</li>
              <li>Wait 2-3 minutes for project creation</li>
            </ol>
          </div>

          {/* Step 2: Get Credentials */}
          <div className="border rounded-lg p-4">
            <h4 className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
              <Key className="w-4 h-4" />
              <span>Step 2: Get Project Credentials</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>In Supabase dashboard, go to <strong>Settings → API</strong></li>
              <li>Copy the <strong>Project URL</strong> (starts with https://)</li>
              <li>Copy the <strong>Anon/Public Key</strong> (starts with eyJ)</li>
            </ol>
          </div>

          {/* Step 3: Update Environment Variables */}
          <div className="border rounded-lg p-4">
            <h4 className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
              <Settings className="w-4 h-4" />
              <span>Step 3: Update .env File</span>
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Replace the placeholder values in your <code className="bg-gray-100 px-1 rounded">.env</code> file:
            </p>
            
            <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400"># Supabase Configuration</span>
              </div>
              <div className="flex items-center justify-between">
                <span>VITE_SUPABASE_URL=https://your-project-id.supabase.co</span>
                <button 
                  onClick={() => copyToClipboard('VITE_SUPABASE_URL=https://your-project-id.supabase.co')}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key</span>
                <button 
                  onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key')}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-2">
              ⚠️ Replace the placeholder values with your actual Supabase credentials
            </p>
          </div>

          {/* Current Environment Status */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Current Environment Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>VITE_SUPABASE_URL:</span>
                <span className={`font-mono ${envVars.urlConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {envVars.hasUrl ? (envVars.urlConfigured ? '✅ Configured' : '❌ Placeholder') : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>VITE_SUPABASE_ANON_KEY:</span>
                <span className={`font-mono ${envVars.keyConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {envVars.hasKey ? (envVars.keyConfigured ? '✅ Configured' : '❌ Placeholder') : '❌ Missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 4: Create Tables */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Step 4: Create Database Tables</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>In Supabase dashboard, go to <strong>SQL Editor</strong></li>
              <li>Click "New Query"</li>
              <li>Copy the SQL from <code className="bg-gray-100 px-1 rounded">CLOUD_SUPABASE_SETUP.md</code></li>
              <li>Paste and click "Run"</li>
              <li>Verify tables in <strong>Table Editor</strong></li>
            </ol>
          </div>

          {/* Restart Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Important</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              After updating your .env file, restart your development server: <code className="bg-yellow-100 px-1 rounded">npm run dev</code>
            </p>
          </div>
        </div>
      )}

      {setupStatus === 'connected' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Setup Complete!</span>
            </div>
            <p className="text-green-700 text-sm">
              Your application is now connected to cloud Supabase. You can proceed with testing the patient-doctor token sharing system.
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Next steps:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Create test users at <code className="bg-gray-100 px-1 rounded">/test-data</code></li>
              <li>Test medication management functionality</li>
              <li>Test token generation and sharing</li>
              <li>Verify data persistence across sessions</li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t">
        <button
          onClick={checkSetupStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Recheck Connection
        </button>
      </div>
    </div>
  )
}

export default SupabaseSetupGuide
