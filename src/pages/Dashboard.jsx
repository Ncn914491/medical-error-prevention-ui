import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  LogOut,
  Plus,
  Search,
  Loader2
} from 'lucide-react'
import * as db from '../services/database'
import TestingUtils from '../components/TestingUtils'

const Dashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [severityData, setSeverityData] = useState([])
  const [riskData, setRiskData] = useState([])
  const [showTesting, setShowTesting] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch analytics data
        const analyticsData = await db.analyticsService.getDashboardStats()
        setStats({
          totalPatients: analyticsData.patientCount,
          activeAlerts: analyticsData.highRiskCount + analyticsData.criticalMedicationCount,
          totalSessions: analyticsData.diagnosisCount + analyticsData.medicationCount,
          errorPreventionRate: '94%' // Mock data
        })
        
        // Fetch recent activities (combining diagnosis and medication sessions)
        const [diagnosisSessions, medicationSessions] = await Promise.all([
          db.diagnosisService.getDiagnosisSessions(),
          db.medicationService.getMedicationSessions()
        ])
        
        // Combine and sort recent activities
        const activities = [
          ...diagnosisSessions.map(session => ({
            id: session.id,
            type: 'diagnosis',
            title: `Diagnosis Analysis - ${session.patients?.first_name || 'Unknown'} ${session.patients?.last_name || ''}`,
            timestamp: session.session_date || session.created_at,
            status: session.status || 'completed',
            risk_level: session.risk_level || 'low'
          })),
          ...medicationSessions.map(session => ({
            id: session.id,
            type: 'medication',
            title: `Medication Check - ${session.patients?.first_name || 'Unknown'} ${session.patients?.last_name || ''}`,
            timestamp: session.session_date || session.created_at,
            status: session.status || 'completed',
            risk_level: session.severity_level || 'low'
          }))
        ]
        
        // Sort by timestamp and take the 10 most recent
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setRecentActivities(activities.slice(0, 10))
        
        // Process data for charts
        const severityCount = { Low: 0, Medium: 0, High: 0, Critical: 0 }
        const riskCount = { Low: 0, Medium: 0, High: 0 }
        
        activities.forEach(activity => {
          if (activity.risk_level) {
            if (activity.risk_level === 'critical') {
              severityCount.Critical++
            } else {
              severityCount[activity.risk_level.charAt(0).toUpperCase() + activity.risk_level.slice(1)]++
            }
            
            if (activity.risk_level !== 'critical') {
              riskCount[activity.risk_level.charAt(0).toUpperCase() + activity.risk_level.slice(1)]++
            }
          }
        })
        
        setSeverityData([
          { name: 'Low', value: severityCount.Low, color: '#10B981' },
          { name: 'Medium', value: severityCount.Medium, color: '#F59E0B' },
          { name: 'High', value: severityCount.High, color: '#EF4444' },
          { name: 'Critical', value: severityCount.Critical, color: '#7C2D12' }
        ])
        
        setRiskData([
          { name: 'Low', value: riskCount.Low, color: '#10B981' },
          { name: 'Medium', value: riskCount.Medium, color: '#F59E0B' },
          { name: 'High', value: riskCount.High, color: '#EF4444' }
        ])
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      fetchDashboardData()
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Create dynamic stats array
  const dynamicStats = stats ? [
    {
      title: 'Total Patients',
      value: stats.totalPatients?.toString() || '0',
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts?.toString() || '0',
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-8%'
    },
    {
      title: 'Reports Generated',
      value: stats.totalSessions?.toString() || '0',
      icon: FileText,
      color: 'bg-green-500',
      change: '+24%'
    },
    {
      title: 'Error Prevention Rate',
      value: stats.errorPreventionRate || '0%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+2.1%'
    }
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Medical Error Prevention System
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dynamicStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{new Date(activity.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                          activity.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                          activity.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {activity.risk_level || 'Low'} Risk
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{activity.status}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No recent activities found
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Plus className="h-4 w-4 mr-2" />
                Add New Patient
              </button>
              
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </button>
              
              <button 
                onClick={() => setShowTesting(true)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Testing & Demo
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Testing Utils Modal */}
      {showTesting && (
        <TestingUtils onClose={() => setShowTesting(false)} />
      )}
    </div>
  )
}

export default Dashboard
