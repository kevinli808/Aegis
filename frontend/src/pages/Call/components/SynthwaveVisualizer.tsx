import { useEffect, useRef } from 'react'
import { Conversation } from '@elevenlabs/client'
import type { ConversationMode } from '../types'

interface SynthwaveVisualizerProps {
  conversation: Conversation | null
  mode: ConversationMode
}

export default function SynthwaveVisualizer({ conversation, mode }: SynthwaveVisualizerProps) {
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
