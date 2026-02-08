import type { CallStatus } from '../types'

interface CallTranscriptProps {
  status: CallStatus
  transcript: string[]
}

export default function CallTranscript({ status, transcript }: CallTranscriptProps) {
  return (
    <div className="call-transcript">
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
  )
}
