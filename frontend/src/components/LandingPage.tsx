import { Link } from 'react-router-dom'
import { AlertCircle, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LiveMap } from './LiveMap'
import { DisasterUpdates } from './DisasterUpdates'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface HelpRequest {
  id: string
  name: string
  phone: string
  location: string
  city?: string
  province?: string
  postalCode?: string
  latitude: string
  longitude: string
  situation: string
  medicalConditions: string
  immediacy: string
  isChild: boolean
  hasMobilityLimitations: boolean
  environmentalHazards: string
  numberOfPeople: string
  priorityScore: number
  timestamp: string
  status: string
}

export function LandingPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6/get-requests`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch requests: ${errorText}`)
      }

      const data = await response.json()
      // Filter out test/example requests
      const filteredRequests = (data.requests || []).filter((req: HelpRequest) => {
        const testNames = ['Kevin Li']
        const testSituations = ['i might actually die from a snake', 'helpppp', 'hj']
        return !testNames.includes(req.name) && !testSituations.includes(req.situation)
      })
      setRequests(filteredRequests)
    } catch (error) {
      console.error('Error fetching help requests:', error)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const inProgressRequests = requests.filter(r => r.status === 'in-progress')

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl sm:text-5xl font-bold">Aegis</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-300">Free disaster response coordination</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DisasterUpdates />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gray-100 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{requests.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-800">{pendingRequests.length}</div>
            <div className="text-xs sm:text-sm text-yellow-800">Pending</div>
          </div>
          <div className="bg-blue-100 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-800">{inProgressRequests.length}</div>
            <div className="text-xs sm:text-sm text-blue-800">In Progress</div>
          </div>
          <div className="bg-green-100 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-800">
              {requests.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-xs sm:text-sm text-green-800">Resolved</div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Active Incidents Map</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 relative z-0">
            <div className="h-[400px] sm:h-[600px] relative">
              <LiveMap requests={requests} selectedRequest={selectedRequest} onSelectRequest={setSelectedRequest} />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 relative z-10">
          <Link to="/responder" className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 active:scale-95 transition-all text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Responders</h3>
            <p className="text-sm sm:text-base text-blue-100">View full dashboard</p>
          </Link>

          <Link to="/request-help" className="bg-red-600 text-white rounded-xl p-6 hover:bg-red-700 active:scale-95 transition-all text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-xl sm:text-2xl font-bold">Need Help?</h3>
            </div>
            <p className="text-sm sm:text-base text-red-100">Submit help request</p>
          </Link>

          <Link to="/info" className="bg-gray-700 text-white rounded-xl p-6 hover:bg-gray-800 active:scale-95 transition-all text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Info className="w-6 h-6" />
              <h3 className="text-xl sm:text-2xl font-bold">Safety Info</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-300">Disaster guidelines</p>
          </Link>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200 relative z-10">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-3 text-gray-700">
            <p>1. People in need submit help requests with their location and situation</p>
            <p>2. AI analyzes and prioritizes requests based on severity and urgency</p>
            <p>3. Responders coordinate to provide assistance</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
