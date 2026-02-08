import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { API_BASE } from '../config'

interface DisasterUpdate {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  author: string
}

export function DisasterUpdates() {
  const [updates, setUpdates] = useState<DisasterUpdate[]>([])

  useEffect(() => {
    fetchUpdates()
    const interval = setInterval(fetchUpdates, 30000)
    return () => clearInterval(interval)
  }, [])

  const mapToDisasterUpdate = (doc: Record<string, unknown>): DisasterUpdate => ({
    id: String(doc._id ?? doc.id ?? ''),
    title: String(doc.title ?? ''),
    message: String(doc.message ?? ''),
    severity: (doc.severity as 'info' | 'warning' | 'critical') || 'info',
    timestamp: String(doc.timestamp ?? ''),
    author: String(doc.author ?? 'System Admin'),
  })

  const fetchUpdates = async () => {
    try {
      const response = await fetch(`${API_BASE}/updates`, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = (await response.json()) as Record<string, unknown>[]
      setUpdates((data || []).slice(0, 3).map(mapToDisasterUpdate))
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  if (updates.length === 0) return null

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-400 text-red-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      default:
        return <Info className="w-5 h-5 flex-shrink-0" />
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3">Official Updates</h2>
      <div className="space-y-3">
        {updates.map(update => (
          <div key={update.id} className={`border-2 rounded-lg p-4 ${getSeverityStyle(update.severity)}`}>
            <div className="flex items-start gap-3">
              {getSeverityIcon(update.severity)}
              <div className="flex-1">
                <h3 className="font-bold text-base">{update.title}</h3>
                <p className="text-sm mt-1">{update.message} {new Date(update.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DisasterUpdates
