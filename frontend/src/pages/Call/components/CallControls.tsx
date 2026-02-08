import type { CallStatus } from '../types'

interface CallControlsProps {
  status: CallStatus
  hasAgentId: boolean
  onStartCall: () => void
  onEndCall: () => void
}

export default function CallControls({
  status,
  hasAgentId,
  onStartCall,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="call-controls">
      {status === 'idle' && (
        <button
          type="button"
          className="call-btn start"
          onClick={onStartCall}
          disabled={!hasAgentId}
        >
          Start call
        </button>
      )}
      {(status === 'connecting' || status === 'connected') && (
        <button
          type="button"
          className="call-btn end"
          onClick={onEndCall}
          disabled={status === 'connecting'}
        >
          End call
        </button>
      )}
    </div>
  )
}
