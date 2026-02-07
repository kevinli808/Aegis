# Aegis
A disaster response program useful for a post-disaster. Made for Hack the Coast 2026

## Setup

```bash
cd frontend && npm install && npm run dev
```

## AI Call (ElevenLabs)

Visit `/call` to start a voice conversation with an ElevenLabs AI agent. Add your agent ID to `frontend/.env`:

```
VITE_ELEVENLABS_AGENT_ID=your-agent-id
```

Get your agent ID from the [ElevenLabs dashboard](https://elevenlabs.io/app/conversational-ai) → create an agent → copy the ID.

The call log shows the full conversation transcript and persists after the call ends.
