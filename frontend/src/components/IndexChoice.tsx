import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, AlertCircle } from 'lucide-react'
import { LiveMap } from './LiveMap'
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

export function IndexChoice() {
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
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      const filtered = (data.requests || []).filter((req: HelpRequest) => {
        const testNames = ['Kevin Li']
        const testSituations = ['i might actually die from a snake', 'helpppp', 'hj']
        return !testNames.includes(req.name) && !testSituations.includes(req.situation)
      })
      setRequests(filtered)
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  const activeRequests = requests.filter(r => r.status !== 'resolved')

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl text-left">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Aegis</h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6">Help when it matters.</p>

        {/* Map */}
        <div className="mb-6">
          <h2 className="text-gray-600 font-medium mb-3">Active incidents</h2>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
            <div className="h-[280px] sm:h-[320px] relative">
              <LiveMap
                requests={activeRequests}
                selectedRequest={selectedRequest}
                onSelectRequest={(r) => setSelectedRequest(r ? requests.find(req => req.id === r.id) ?? null : null)}
              />
            </div>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Would you like to report an incident or are you a responder?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            to="/request-help"
            className="bg-red-600 text-white rounded-xl p-6 sm:p-8 hover:bg-red-700 active:scale-95 transition-all text-left sm:text-center flex flex-col items-start sm:items-center justify-center gap-3"
          >
            <AlertCircle className="w-12 h-12 sm:w-14 sm:h-14" />
            <span className="text-xl sm:text-2xl font-bold">I need help</span>
            <span className="text-sm text-red-100">Report an incident or request assistance</span>
          </Link>
          <Link
            to="/responder"
            className="bg-blue-600 text-white rounded-xl p-6 sm:p-8 hover:bg-blue-700 active:scale-95 transition-all text-left sm:text-center flex flex-col items-start sm:items-center justify-center gap-3"
          >
            <Shield className="w-12 h-12 sm:w-14 sm:h-14" />
            <span className="text-xl sm:text-2xl font-bold">I'm a responder</span>
            <span className="text-sm text-blue-100">View incidents and provide assistance</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
