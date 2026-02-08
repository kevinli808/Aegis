const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? ''

export default function CallSetup() {
  if (AGENT_ID) return null

  return (
    <p className="call-setup">
      Set <code>VITE_ELEVENLABS_AGENT_ID</code> in <code>.env</code> (get it from{' '}
      <a
        href="https://elevenlabs.io/app/conversational-ai"
        target="_blank"
        rel="noreferrer"
      >
        ElevenLabs dashboard
      </a>
      )
    </p>
  )
}
