import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, AlertCircle } from 'lucide-react'
import { LiveMap } from './LiveMap'
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

export function IndexChoice() {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  const mapMongoToHelpRequest = (req: Record<string, unknown>): HelpRequest => {
    const loc = req.location as { type?: string; coordinates?: number[] } | undefined
    const hasCoords = loc?.type === 'Point' && Array.isArray(loc?.coordinates)
    return {
    id: String(req._id ?? ''),
    name: String(req.name ?? ''),
    phone: String(req.phone ?? ''),
    location: hasCoords && loc?.coordinates
      ? `${(loc.coordinates[1] ?? 0).toFixed(4)}, ${(loc.coordinates[0] ?? 0).toFixed(4)}`
      : String(req.location ?? req.city ?? req.province ?? ''),
    city: String(req.city ?? ''),
    province: String(req.province ?? ''),
    postalCode: String(req.postalCode ?? ''),
    latitude: hasCoords && loc?.coordinates ? String(loc.coordinates[1] ?? '') : '',
    longitude: hasCoords && loc?.coordinates ? String(loc.coordinates[0] ?? '') : '',
    situation: String(req.situation ?? req.type ?? req.safety_status ?? ''),
    medicalConditions: String(req.medicalConditions ?? (Array.isArray(req.symptoms) ? req.symptoms.join(', ') : '')),
    immediacy: String(req.immediacy ?? ''),
    isChild: Boolean(req.isChild ?? false),
    hasMobilityLimitations: Boolean(req.hasMobilityLimitations ?? false),
    environmentalHazards: String(req.environmentalHazards ?? ''),
    numberOfPeople: String(req.numberOfPeople ?? req.num_people ?? '1'),
    priorityScore: Number(req.priorityScore ?? req.score ?? req.final_score ?? 0),
    timestamp: String(req.timestamp ?? ''),
    status: String(req.status ?? 'pending'),
  }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents`, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = (await response.json()) as Record<string, unknown>[]
      setRequests((data || []).map(mapMongoToHelpRequest))
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  const activeRequests = requests.filter(r => r.status !== 'resolved')

  return (
    <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl text-center ">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Aegis</h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6">Help when it matters.</p>

        {/* Map */}
        <div className="mb-6">
          <h2 className="text-gray-600 font-medium mb-3">Active incidents</h2>
          <div className="rounded-2xl overflow-hidden border border-gray-300 bg-gray-50">
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
            className="bg-orange-600 text-white rounded-xl p-6 sm:p-8 hover:bg-orange-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-3"
          >
            <AlertCircle className="w-12 h-12 sm:w-14 sm:h-14" />
            <span className="text-xl sm:text-2xl font-bold">I need help</span>
            <span className="text-sm text-orange-100">Report an incident or request assistance</span>
          </Link>
          <Link
            to="/responder"
            className="bg-slate-700 text-white rounded-xl p-6 sm:p-8 hover:bg-slate-800 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-3"
          >
            <Shield className="w-12 h-12 sm:w-14 sm:h-14" />
            <span className="text-xl sm:text-2xl font-bold">I'm a responder</span>
            <span className="text-sm text-slate-200">View incidents and provide assistance</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
