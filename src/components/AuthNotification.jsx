import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

const AuthNotification = () => {
  const { usingFallback } = useAuth()

  if (!usingFallback) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Demo Mode Active
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Using offline authentication for testing. Use these demo accounts:
            </p>
            <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 rounded p-2">
              <div><strong>Patient:</strong> patient@demo.com / Patient123!</div>
              <div><strong>Doctor:</strong> doctor@demo.com / Doctor123!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthNotification
