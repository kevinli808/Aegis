import { useState, useCallback, useEffect, useRef } from 'react'
import { Conversation } from '@elevenlabs/client'
import { ArrowLeft } from 'lucide-react'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? ''

type CallStatus = 'idle' | 'connecting' | 'connected' | 'error'
type ConversationMode = 'agent-speaking' | 'user-speaking' | 'listening'

const USER_COLOR = '#ef4444'
const AGENT_COLOR = '#3b82f6'

function SynthwaveVisualizer({
  conversation,
  mode,
}: {
  conversation: Conversation | null
  mode: ConversationMode
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!conversation || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GRID_LINES = 12
    const WAVE_POINTS = 64

    const draw = async () => {
      try {
        const inputData = (
          conversation as { getInputByteFrequencyData?: () => Uint8Array }
        ).getInputByteFrequencyData?.()
        const outputData = (
          conversation as { getOutputByteFrequencyData?: () => Uint8Array }
        ).getOutputByteFrequencyData?.()
        const inputVol = await Promise.resolve(
          (
            conversation as unknown as {
              getInputVolume?: () => number | Promise<number>
            }
          ).getInputVolume?.() ?? 0
        )
        const outputVol = await Promise.resolve(
          (
            conversation as unknown as {
              getOutputVolume?: () => number | Promise<number>
            }
          ).getOutputVolume?.() ?? 0
        )

        const isAgent = mode === 'agent-speaking'
        const data = isAgent ? outputData : inputData
        const vol = isAgent ? outputVol : (inputVol ?? 0)

        const accentColor = isAgent ? AGENT_COLOR : USER_COLOR

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0f172a')
        gradient.addColorStop(0.6, '#1e293b')
        gradient.addColorStop(1, '#334155')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.strokeStyle = `${accentColor}40`
        ctx.lineWidth = 1

        for (let i = 0; i < GRID_LINES; i++) {
          const y = canvas.height * 0.4 + (i / GRID_LINES) * canvas.height * 0.6
          const perspective = i / GRID_LINES
          const offsetX = perspective * 40
          ctx.beginPath()
          ctx.moveTo(offsetX, y)
          ctx.lineTo(canvas.width - offsetX, y)
          ctx.stroke()
        }

        const verticalLines = 16
        for (let i = 0; i < verticalLines; i++) {
          const x = (i / (verticalLines - 1)) * canvas.width
          ctx.beginPath()
          ctx.moveTo(x, canvas.height * 0.4)
          ctx.lineTo(
            canvas.width / 2 + (x - canvas.width / 2) * 1.5,
            canvas.height
          )
          ctx.stroke()
        }

        ctx.beginPath()
        const baseY = canvas.height * 0.35

        for (let i = 0; i < WAVE_POINTS; i++) {
          const x = (i / (WAVE_POINTS - 1)) * canvas.width
          let amplitude = 0
          if (data && data.length > 0) {
            const dataIndex = Math.floor((i / WAVE_POINTS) * data.length)
            amplitude = (data[dataIndex] ?? 0) / 255
          } else {
            amplitude = vol * 0.8
          }
          const totalAmp = amplitude * canvas.height * 0.3
          const y = baseY - totalAmp
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()

        const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        waveGradient.addColorStop(0, accentColor)
        waveGradient.addColorStop(0.5, `${accentColor}80`)
        waveGradient.addColorStop(1, `${accentColor}20`)
        ctx.fillStyle = waveGradient
        ctx.fill()

        ctx.beginPath()
        for (let i = 0; i < WAVE_POINTS; i++) {
          const x = (i / (WAVE_POINTS - 1)) * canvas.width
          let amplitude = 0
          if (data && data.length > 0) {
            const dataIndex = Math.floor((i / WAVE_POINTS) * data.length)
            amplitude = (data[dataIndex] ?? 0) / 255
          } else {
            amplitude = vol * 0.8
          }
          const totalAmp = amplitude * canvas.height * 0.3
          const y = baseY - totalAmp
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.shadowBlur = 12
        ctx.shadowColor = accentColor
        ctx.stroke()
        ctx.shadowBlur = 0
      } catch {}
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [conversation, mode])

  if (!conversation) return null

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full"
      width={640}
      height={320}
    />
  )
}

interface VoiceCallProps {
  title?: string
  embedded?: boolean
  onBack?: () => void
  onLocationUpdate?: (lat: string, lng: string, location: string) => void
  onCallEnd?: (transcript: string[]) => void
}

export function VoiceCall({ title = 'Aegis AI Call', embedded = false, onBack, onLocationUpdate, onCallEnd }: VoiceCallProps) {
  const [status, setStatus] = useState<CallStatus>('idle')
  const [mode, setMode] = useState<ConversationMode>('listening')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const transcriptRef = useRef<string[]>([])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    const el = transcriptScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [transcript])

  useEffect(() => {
    if (status !== 'connected') return
    if (!navigator.geolocation) {
      setLocationStatus('Location not supported')
      return
    }
    setLocationStatus('Getting your location...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString()
        const lng = position.coords.longitude.toString()
        const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        onLocationUpdate?.(lat, lng, location)
        setLocationStatus('Location captured')
      },
      (err) => {
        setLocationStatus(err.code === 1 ? 'Location denied' : 'Location unavailable')
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    )
  }, [status, onLocationUpdate])

  const startCall = useCallback(async () => {
    if (!AGENT_ID) {
      setError('VITE_ELEVENLABS_AGENT_ID is not set. Add it to .env')
      return
    }
    setError(null)
    setStatus('connecting')
    try {
      const conv = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
        onConnect: () => setStatus('connected'),
        onDisconnect: () => {
          const snapshot = [...transcriptRef.current]
          setStatus('idle')
          setConversation(null)
          onCallEnd?.(snapshot)
        },
        onMessage: (msg: { source?: string; message?: string; role?: string; text?: string }) => {
          const text = msg.message ?? msg.text ?? ''
          const source = msg.source ?? msg.role ?? 'unknown'
          if (text) setTranscript((prev) => [...prev, `[${source}]: ${text}`])
        },
        onStatusChange: (prop: { status?: string }) => {
          if (prop?.status === 'connected') setStatus('connected')
        },
        onModeChange: (prop: { mode?: string }) => {
          const m = prop?.mode ?? ''
          if (m === 'speaking') setMode('agent-speaking')
          else if (m === 'listening') setMode('user-speaking')
          else setMode('listening')
        },
        onError: (message: string) => {
          setError(message)
          setStatus('error')
        },
      })
      setConversation(conv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setStatus('error')
    }
  }, [])

  const endCall = useCallback(async () => {
    if (conversation) {
      await conversation.endSession()
      setConversation(null)
      setStatus('idle')
    }
  }, [conversation])

  return (
    <div
      className={`flex flex-col w-full mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 pb-24 sm:pb-4`}
    >
      {/* Header */}
      <header className="mb-4 sm:mb-6">
        <h2 className="m-0 text-lg font-semibold text-neutral-800 sm:text-xl md:text-2xl">{title}</h2>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Describe your situation. We'll collect your info and share your location with responders automatically.
        </p>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center gap-4 flex-1 min-h-0">
        {!AGENT_ID && (
          <div className="w-full bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-800">
            Set <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_ELEVENLABS_AGENT_ID</code> in{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> — get it from the{' '}
            <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noreferrer" className="underline font-medium">
              ElevenLabs dashboard
            </a>
            .
          </div>
        )}

        {error && (
          <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8 sm:py-12">
            <div className="w-14 h-14 rounded-full bg-green-500 animate-pulse" />
            <p className="m-0 text-sm font-medium text-neutral-700">Connecting…</p>
            <p className="m-0 text-xs text-neutral-500">Allow microphone when prompted</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="w-full flex flex-col items-center gap-4">
            {locationStatus && (
              <p className="m-0 text-xs text-neutral-500 flex items-center gap-1.5">
                <span>📍</span> {locationStatus}
              </p>
            )}
            <div className="w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-700 aspect-[2/1] min-h-[200px]">
              <SynthwaveVisualizer conversation={conversation} mode={mode} />
            </div>
            <p className="m-0 text-sm font-medium text-neutral-600">
              {mode === 'agent-speaking' && 'Agent speaking…'}
              {mode === 'user-speaking' && 'Your turn — speak now'}
              {mode === 'listening' && 'Listening…'}
            </p>
          </div>
        )}

        {/* Call button - fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-neutral-200 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:border-0 sm:pt-4 sm:pb-0 sm:bg-transparent sm:flex sm:justify-center">
          {status === 'idle' && (
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px] min-h-12 px-6 py-3 text-base font-semibold rounded-xl border-none cursor-pointer bg-green-500 text-white hover:bg-green-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              onClick={startCall}
              disabled={!AGENT_ID}
            >
              Start call
            </button>
          )}
          {(status === 'connecting' || status === 'connected') && (
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px] min-h-12 px-6 py-3 text-base font-semibold rounded-xl border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              onClick={endCall}
              disabled={status === 'connecting'}
            >
              <span className="text-xl">📵</span>
              End call
            </button>
          )}
        </div>
      </main>

      {/* Transcript */}
      <section className="mt-6 pt-4 border-t border-neutral-200">
        <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Call log</h3>
        <div
          ref={transcriptScrollRef}
          className="max-h-24 sm:max-h-32 overflow-y-auto text-xs leading-relaxed overscroll-contain rounded-lg bg-neutral-50 p-3 border border-neutral-200"
        >
          {transcript.length === 0 ? (
            <p className="text-neutral-400 italic m-0">
              {status === 'idle' && 'Start a call to see the conversation.'}
              {status === 'connecting' && 'Connecting…'}
              {status === 'connected' && 'Conversation will appear here.'}
              {status === 'error' && 'No messages.'}
            </p>
          ) : (
            transcript.map((line, i) => (
              <div key={i} className={`mb-1.5 last:mb-0 break-words ${i % 2 === 0 ? 'text-neutral-800' : 'text-neutral-600'}`}>
                {line}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
