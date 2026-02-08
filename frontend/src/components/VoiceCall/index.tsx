import { useState, useCallback, useEffect, useRef } from 'react'
import { Conversation } from '@elevenlabs/client'
import { ArrowLeft } from 'lucide-react'
import './VoiceCall.css'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? ''

type CallStatus = 'idle' | 'connecting' | 'connected' | 'error'
type ConversationMode = 'agent-speaking' | 'user-speaking' | 'listening'

function SynthwaveVisualizer({
  conversation,
  mode,
}: {
  conversation: Conversation | null
  mode: ConversationMode
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    if (!conversation || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GRID_LINES = 12
    const WAVE_POINTS = 64

    const draw = async () => {
      try {
        timeRef.current += 0.05

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

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0a0520')
        gradient.addColorStop(0.6, '#1a0a30')
        gradient.addColorStop(1, '#2d1650')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.strokeStyle = isAgent ? '#ff00ff40' : '#00ffff40'
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
          const wave1 = Math.sin(i * 0.2 + timeRef.current) * 0.15
          const wave2 = Math.sin(i * 0.1 - timeRef.current * 0.7) * 0.1
          const totalAmp = (amplitude * 0.7 + wave1 + wave2) * canvas.height * 0.25
          const y = baseY - totalAmp
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()

        const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        if (isAgent) {
          waveGradient.addColorStop(0, '#ff00ff')
          waveGradient.addColorStop(0.5, '#ff00ff80')
          waveGradient.addColorStop(1, '#ff00ff20')
        } else {
          waveGradient.addColorStop(0, '#00ffff')
          waveGradient.addColorStop(0.5, '#00ffff80')
          waveGradient.addColorStop(1, '#00ffff20')
        }
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
          const wave1 = Math.sin(i * 0.2 + timeRef.current) * 0.15
          const wave2 = Math.sin(i * 0.1 - timeRef.current * 0.7) * 0.1
          const totalAmp = (amplitude * 0.7 + wave1 + wave2) * canvas.height * 0.25
          const y = baseY - totalAmp
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = isAgent ? '#ff00ff' : '#00ffff'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.shadowBlur = 20
        ctx.shadowColor = isAgent ? '#ff00ff' : '#00ffff'
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
      className="voice-waveform"
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
}

export function VoiceCall({ title = 'Aegis AI Call', embedded = false, onBack, onLocationUpdate }: VoiceCallProps) {
  const [status, setStatus] = useState<CallStatus>('idle')
  const [mode, setMode] = useState<ConversationMode>('listening')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)

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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
          setStatus('idle')
          setConversation(null)
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
    <div className={`voice-call ${embedded ? 'voice-call--embedded' : ''}`}>
      <h2 className="mb-2">{title}</h2>
      <p className="voice-call-desc">Speak to our AI assistant to submit your help request</p>

      <div className="voice-call-controls">
        {onBack && (
          <button
            type="button"
            className="voice-call-btn back"
            onClick={onBack}
            disabled={status === 'connecting' || status === 'connected'}
          >
            <ArrowLeft className="w-4 h-4 inline-block mr-1 align-middle" />
            Back to form
          </button>
        )}
        {status === 'idle' && (
          <button
            type="button"
            className="voice-call-btn start"
            onClick={startCall}
            disabled={!AGENT_ID}
          >
            Start call
          </button>
        )}
        {(status === 'connecting' || status === 'connected') && (
          <button
            type="button"
            className="voice-call-btn end"
            onClick={endCall}
            disabled={status === 'connecting'}
          >
            End call
          </button>
        )}
      </div>

      {!AGENT_ID && (
        <p className="voice-call-setup">
          Set <code>VITE_ELEVENLABS_AGENT_ID</code> in <code>.env</code> (get it from{' '}
          <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noreferrer">
            ElevenLabs dashboard
          </a>
          )
        </p>
      )}

      {error && <p className="voice-call-error">{error}</p>}

      {status === 'connecting' && (
        <p className="voice-call-status">Connecting… Allow microphone access when prompted.</p>
      )}
      {status === 'connected' && (
        <>
          {locationStatus && (
            <p className="voice-call-status text-sm text-gray-600 mb-2">
              📍 {locationStatus}
            </p>
          )}
          <div className="voice-call-waveform-wrap">
            <SynthwaveVisualizer conversation={conversation} mode={mode} />
          </div>
          <p className="voice-call-status mode">
            {mode === 'agent-speaking' && 'Agent speaking…'}
            {mode === 'user-speaking' && 'Your turn — speak now'}
          </p>
        </>
      )}

      <div className="voice-call-transcript">
        <h3>Call log</h3>
        <div className="transcript-lines">
          {transcript.length === 0 ? (
            <p className="transcript-empty">
              {status === 'idle' && 'Start a call to see the log.'}
              {status === 'connecting' && 'Connecting…'}
              {status === 'connected' && 'Conversation will appear here.'}
              {status === 'error' && 'No messages.'}
            </p>
          ) : (
            transcript.map((line, i) => (
              <div key={i} className="transcript-line">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
