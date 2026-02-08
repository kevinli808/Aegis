import { Link } from 'react-router-dom'
import { Mic, FileText, SirenIcon } from 'lucide-react'
import { Footer } from './Footer'
import { useState, useEffect } from 'react'
import { LiveMap } from './LiveMap'
import { DisasterUpdates } from './DisasterUpdates'
import { API_BASE } from '../config'

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
      const response = await fetch(`${API_BASE}/incidents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch requests: ${errorText}`)
      }

      const data = await response.json()

      // Map MongoDB response to HelpRequest shape
      const mappedRequests: HelpRequest[] = (data || []).map((req: any) => ({
        id: req._id, // MongoDB's _id as id
        name: req.name || '',
        phone: req.phone || '',
        location: req.location?.type === 'Point' && Array.isArray(req.location?.coordinates)
          ? `${req.location.coordinates[1].toFixed(4)}, ${req.location.coordinates[0].toFixed(4)}`
          : req.location?.display_name || req.city || req.province || '',
        city: req.city || '',
        province: req.province || '',
        postalCode: req.postalCode || '',
        latitude:
          req.location && req.location.type === 'Point' && Array.isArray(req.location.coordinates)
            ? String(req.location.coordinates[1])
            : '',
        longitude:
          req.location && req.location.type === 'Point' && Array.isArray(req.location.coordinates)
            ? String(req.location.coordinates[0])
            : '',
        situation: req.type || req.situation || req.safety_status || '',
        medicalConditions: req.medicalConditions || (req.symptoms ? req.symptoms.join(', ') : ''),
        immediacy: req.immediacy || '',
        isChild: req.isChild ?? false,
        hasMobilityLimitations: req.hasMobilityLimitations ?? false,
        environmentalHazards: req.environmentalHazards || '',
        numberOfPeople: req.numberOfPeople || (req.num_people ? String(req.num_people) : ''),
        priorityScore: req.priorityScore ?? req.final_score ?? req.score ?? 0,
        timestamp: req.timestamp || '',
        status: req.status || '',
      }));

      setRequests(mappedRequests);

    } catch (error) {
      console.error('Error fetching help requests:', error)
    }
  }

  const activeRequests = requests.filter(r => r.status !== 'resolved')
  const peopleAffected = activeRequests.reduce((sum, r) => sum + (parseInt(r.numberOfPeople, 10) || 1), 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-left">
          <Link to="/" className="flex items-center gap-3 mb-3 text-white hover:text-white/90">
            <h1 className="text-4xl sm:text-5xl font-bold">Aegis</h1>
            <img src="/aegis-logo.png" alt="Aegis" className="w-10 h-10 sm:w-12 sm:h-12" />
          </Link>
          <p className="text-lg sm:text-xl text-gray-300">Help when it matters</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-6 text-left">
        <DisasterUpdates />

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-1 sm:flex-[2] bg-red-700 text-white rounded-lg p-6 text-left sm:min-h-[220px] border border-gray-300">
            <div className="flex items-center gap-2 mb-6">
              <SirenIcon className="w-6 h-6" />
              <h3 className="text-xl sm:text-2xl font-bold">Need Help?</h3>
            </div>
            <p className="text-sm sm:text-base text-red-100 mb-6">Choose how you'd like to submit your help request:</p>
            <div className="flex flex-col gap-3">
              <Link
                to="/request-help?input=voice"
                className="flex items-center gap-2 border-2 border-red-700 bg-red-800 text-white hover:bg-red-800 p-3 rounded-lg transition-colors text-left"
              >
                <Mic className="w-5 h-5 text-white" />
                <span className="font-semibold">Voice Call</span>
              </Link>
              <Link
                to="/request-help?input=form"
                className="flex items-center gap-2 border-2 border-red-700 bg-red-800 text-white hover:bg-red-800 p-3 rounded-lg transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-white" />
                <span className="font-semibold">Form</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:gap-4 flex-1">
            <div className="bg-yellow-100 rounded-lg p-3 sm:p-4 flex-1 flex flex-col justify-center border border-gray-300">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-800">{activeRequests.length}</div>
              <div className="text-xs sm:text-sm text-yellow-800">Active Incidents</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-3 sm:p-4 flex-1 flex flex-col justify-center border border-gray-300">
              <div className="text-2xl sm:text-3xl font-bold text-blue-800">{peopleAffected}</div>
              <div className="text-xs sm:text-sm text-blue-800">People Affected</div>
            </div>
          </div>
        </div>  


        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Active Incidents Map</h2>
          <div className="bg-white rounded-xl overflow-hidden border border-gray-300 relative z-0">
            <div className="h-[400px] sm:h-[600px] relative">
              <LiveMap requests={requests} selectedRequest={selectedRequest} onSelectRequest={(r) => setSelectedRequest(r as HelpRequest | null)} centerOnUser />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 relative z-10">
          <Link to="/request-help" className="border-2 border-red-600 bg-red-700 text-white rounded-xl p-6 hover:bg-red-700 active:scale-95 transition-all text-left">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold">Need Help?</h3>
            </div>
            <p className="text-sm sm:text-base text-red-100">Submit help request</p>
          </Link>

          <Link to="/responder" className="border-2 border-zinc-600 bg-zinc-700 text-white rounded-xl p-6 hover:bg-gray-800 active:scale-95 transition-all text-left">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Responders</h3>
            <p className="text-sm sm:text-base text-sky-100">View full dashboard</p>
          </Link>

          <Link to="/info" className="border-2 border-zinc-600 bg-zinc-700 text-white rounded-xl p-6 hover:bg-gray-800 active:scale-95 transition-all text-left">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold">Safety Info</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-300">Disaster guidelines</p>
          </Link>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-300 relative z-10">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-3 text-gray-700">
            <p>1. People in need submit help requests with their location and situation</p>
            <p>2. AI analyzes and prioritizes requests based on severity and urgency</p>
            <p>3. Responders coordinate to provide assistance</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default LandingPage
