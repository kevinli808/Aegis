import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

interface HelpRequest {
  id: string
  name: string
  location: string
  city?: string
  province?: string
  postalCode?: string
  latitude: string
  longitude: string
  priorityScore: number
  status: string
  situation: string
}

interface LiveMapProps {
  requests: HelpRequest[]
  selectedRequest: HelpRequest | null
  onSelectRequest: (request: HelpRequest | null) => void
  centerOnUser?: boolean
}

const DEFAULT_CENTER: [number, number] = [56.1304, -106.3468]
const DEFAULT_ZOOM = 4

export function LiveMap({ requests, selectedRequest, onSelectRequest, centerOnUser = false }: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const cssLoadedRef = useRef(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const getMarkerColor = (score: number) => {
    if (score >= 80) return '#dc2626'
    if (score >= 60) return '#ea580c'
    if (score >= 40) return '#ca8a04'
    return '#16a34a'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'in-progress':
        return '🚑'
      case 'resolved':
        return '✅'
      default:
        return '📍'
    }
  }

  const createCustomIcon = (color: string, status: string) => {
    const statusIcon = getStatusIcon(status)
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative;">
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
          "></div>
          <div style="
            position: absolute;
            top: 6px;
            left: 8px;
            font-size: 14px;
            transform: rotate(45deg);
          ">${statusIcon}</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }

  useEffect(() => {
    if (cssLoadedRef.current || !containerRef.current) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isComponentMounted = true

    const initializeMap = () => {
      if (!isComponentMounted || !containerRef.current || mapRef.current) return

      try {
        mapRef.current = L.map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: false,
        })
        L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapRef.current)

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    link.onload = () => {
      cssLoadedRef.current = true
      initializeMap()
    }

    link.onerror = () => {
      console.error('Failed to load Leaflet CSS')
      timeoutId = setTimeout(initializeMap, 100)
    }

    document.head.appendChild(link)

    return () => {
      isComponentMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      try {
        if (link.parentNode) document.head.removeChild(link)
      } catch (e) {
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Request geolocation and center map on user when centerOnUser is true
  useEffect(() => {
    if (!centerOnUser || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 10, { animate: true })
        }
      },
      () => { /* Silent fail - keep default center */ }
    )
  }, [centerOnUser])

  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    const validRequests = requests.filter(req => req.latitude && req.longitude && !isNaN(parseFloat(req.latitude)) && !isNaN(parseFloat(req.longitude)))

    if (validRequests.length === 0) {
      const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : DEFAULT_CENTER
      mapRef.current.setView(center, userLocation ? 10 : DEFAULT_ZOOM)
      return
    }

    const bounds: L.LatLngExpression[] = []
    validRequests.forEach(request => {
      const lat = parseFloat(request.latitude)
      const lng = parseFloat(request.longitude)
      if (isNaN(lat) || isNaN(lng)) return

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(getMarkerColor(request.priorityScore), request.status),
      })

      const getPriorityLabel = (score: number) => {
        if (score >= 80) return 'CRITICAL'
        if (score >= 60) return 'HIGH'
        if (score >= 40) return 'MEDIUM'
        return 'LOW'
      }

      const addressDisplay =
        request.location || request.city || request.province
          ? [request.location, request.city, request.province].filter(Boolean).join(', ')
          : !isNaN(lat) && !isNaN(lng)
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : 'Unknown'

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${request.name}</h3>
          <div style="margin-bottom: 8px;">
            <span style="background-color: ${getMarkerColor(request.priorityScore)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${getPriorityLabel(request.priorityScore)} (${request.priorityScore})
            </span>
          </div>
          <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong>Status:</strong> ${request.status}</p>
          <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong>Location:</strong> ${addressDisplay}</p>
          <p style="margin: 8px 0; font-size: 14px; color: #374151; max-width: 250px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            <strong>Situation:</strong> ${request.situation}
          </p>
          <button onclick="window.selectRequestFromMap('${request.id}')" style="margin-top: 8px; background-color: #2563eb; color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%;">
            View Full Details
          </button>
        </div>
      `)

      marker.on('click', () => {
        onSelectRequest(request)
      })

      marker.addTo(mapRef.current!)
      markersRef.current.push(marker)
      bounds.push([lat, lng])
    })

    if (userLocation) bounds.push([userLocation.lat, userLocation.lng])

    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 15 })
    }

    ;(window as any).selectRequestFromMap = (requestId: string) => {
      const request = requests.find(r => r.id === requestId)
      if (request) onSelectRequest(request)
    }
  }, [requests, onSelectRequest, userLocation])

  useEffect(() => {
    if (!mapRef.current || !selectedRequest) return
    const lat = parseFloat(selectedRequest.latitude)
    const lng = parseFloat(selectedRequest.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.setView([lat, lng], 16, { animate: true })

      const marker = markersRef.current.find(m => {
        const pos = m.getLatLng()
        return pos.lat === lat && pos.lng === lng
      })

      if (marker) marker.openPopup()
    }
  }, [selectedRequest])

  const validRequestsCount = requests.filter(req => req.latitude && req.longitude && !isNaN(parseFloat(req.latitude)) && !isNaN(parseFloat(req.longitude))).length

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {validRequestsCount === 0 && requests.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 pointer-events-none">
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Requests</h3>
            <p className="text-gray-600">When help requests are submitted, they'll appear here</p>
          </div>
        </div>
      )}
      {validRequestsCount === 0 && requests.length > 0 && (
        <div className="absolute top-4 left-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 max-w-xs pointer-events-none">
          <p className="text-sm text-yellow-900 font-semibold">⚠️ {requests.length} request{requests.length !== 1 ? 's' : ''} without GPS coordinates</p>
          <p className="text-xs text-yellow-800 mt-1">View in List View on the responder dashboard</p>
        </div>
      )}
    </div>
  )
}

export default LiveMap
