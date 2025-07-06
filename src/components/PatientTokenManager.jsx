import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tokenSharingService } from '../services/tokenSharingService'
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Clock, 
  Shield, 
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react'

const PatientTokenManager = () => {
  const { user } = useAuth()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      loadTokens()
    }
  }, [user])

  const loadTokens = async () => {
    setLoading(true)
    try {
      const result = await tokenSharingService.getPatientTokens(user.uid)
      if (result.success) {
        setTokens(result.tokens)
      } else {
        setError('Failed to load sharing tokens')
      }
    } catch (err) {
      setError('Error loading tokens')
    } finally {
      setLoading(false)
    }
  }

  const generateNewToken = async () => {
    setGenerating(true)
    setError('')
    setSuccess('')

    try {
      const result = await tokenSharingService.generatePatientToken(user.uid, 24)
      if (result.success) {
        setSuccess(`New sharing code generated: ${result.token}`)
        await loadTokens()
      } else {
        setError('Failed to generate sharing code')
      }
    } catch (err) {
      setError('Error generating sharing code')
    } finally {
      setGenerating(false)
    }
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
    setSuccess('Sharing code copied to clipboard!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const revokeToken = async (tokenId) => {
    if (!confirm('Are you sure you want to revoke this sharing code? The doctor will lose access to your data.')) {
      return
    }

    try {
      const result = await tokenSharingService.revokeToken(tokenId, user.uid)
      if (result.success) {
        setSuccess('Sharing code revoked successfully')
        await loadTokens()
      } else {
        setError('Failed to revoke sharing code')
      }
    } catch (err) {
      setError('Error revoking sharing code')
    }
  }

  const formatExpirationDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.ceil((date - now) / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      return 'Expires soon'
    } else if (diffHours < 24) {
      return `Expires in ${diffHours} hours`
    } else {
      const diffDays = Math.ceil(diffHours / 24)
      return `Expires in ${diffDays} days`
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Share with Doctor</h3>
        </div>
        <button
          onClick={generateNewToken}
          disabled={generating}
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          {generating ? 'Generating...' : 'Generate Code'}
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

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generate a sharing code to give your doctor temporary access</li>
              <li>• Codes expire automatically after 24 hours for security</li>
              <li>• You can revoke access at any time</li>
              <li>• Doctors can view your medical history, medications, and analysis results</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading sharing codes...
          </div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No active sharing codes</p>
          <p className="text-sm">Generate a code to share your data with a doctor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div key={token.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono font-bold text-blue-600">
                      {token.access_token}
                    </code>
                    <button
                      onClick={() => copyToken(token.access_token)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatExpirationDate(token.token_expires_at)}</span>
                    </div>
                    
                    {token.doctor && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Used by {token.doctor.full_name}</span>
                        {token.doctor.specialization && (
                          <span className="text-gray-400">({token.doctor.specialization})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => revokeToken(token.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Revoke access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientTokenManager
