import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Navigation, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react'

const RouteDebugger = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const routes = [
    { path: '/dashboard', name: 'Dashboard', description: 'Main dashboard' },
    { path: '/test-data', name: 'Test Data Manager', description: 'Database testing and setup' },
    { path: '/login', name: 'Login', description: 'User authentication' },
    { path: '/signup', name: 'Signup', description: 'User registration' },
    { path: '/patients', name: 'Patients', description: 'Patient management' },
    { path: '/med-checker', name: 'Med Checker', description: 'Medication analysis' },
    { path: '/diagnosis-review', name: 'Diagnosis Review', description: 'Diagnosis analysis' }
  ]

  const testRoute = (path) => {
    try {
      navigate(path)
      return true
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error)
      return false
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Route Debugger</h3>
      </div>

      {/* Current Location */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Current Location</h4>
        <div className="text-sm text-blue-800">
          <p><strong>Pathname:</strong> {location.pathname}</p>
          <p><strong>Search:</strong> {location.search || 'None'}</p>
          <p><strong>Hash:</strong> {location.hash || 'None'}</p>
        </div>
      </div>

      {/* Route Status */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Available Routes</h4>
        <div className="space-y-2">
          {routes.map((route) => (
            <div key={route.path} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{route.name}</span>
                  <span className="text-sm text-gray-500">({route.path})</span>
                  {location.pathname === route.path && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{route.description}</p>
              </div>
              
              <button
                onClick={() => testRoute(route.path)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Test
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Quick Navigation</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => navigate('/test-data')}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Test Data
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reload
          </button>
        </div>
      </div>

      {/* Route Issues */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Common Route Issues</h4>
        <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
          <li>If routes don't work, try refreshing the page</li>
          <li>Check browser console for JavaScript errors</li>
          <li>Ensure development server is running on correct port</li>
          <li>Clear browser cache if routes seem cached incorrectly</li>
        </ul>
      </div>

      {/* Browser Info */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Browser Info</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>Origin:</strong> {window.location.origin}</p>
        </div>
      </div>
    </div>
  )
}

export default RouteDebugger
