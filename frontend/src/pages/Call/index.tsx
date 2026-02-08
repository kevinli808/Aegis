import { useState, useCallback } from "react";
import { Conversation } from "@elevenlabs/client";
import type { CallStatus, ConversationMode } from "./types";
import SynthwaveVisualizer from "./components/SynthwaveVisualizer";
import CallSetup from "./components/CallSetup";
import CallControls from "./components/CallControls";
import CallTranscript from "./components/CallTranscript";
import "./Call.css";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? "";

export default function Call() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [mode, setMode] = useState<ConversationMode>("listening");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const startCall = useCallback(async () => {
    if (!AGENT_ID) {
      setError("VITE_ELEVENLABS_AGENT_ID is not set. Add it to .env");
      return;
    }
    setError(null);
    setStatus("connecting");
    try {
      const conv = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
        onConnect: () => setStatus("connected"),
        onDisconnect: () => {
          setStatus("idle");
          setConversation(null);
        },
        onMessage: (msg: {
          source?: string;
          message?: string;
          role?: string;
          text?: string;
        }) => {
          const text = msg.message ?? msg.text ?? "";
          const source = msg.source ?? msg.role ?? "unknown";
          if (text) setTranscript((prev) => [...prev, `[${source}]: ${text}`]);
        },
        onStatusChange: (prop: { status?: string }) => {
          if (prop?.status === "connected") setStatus("connected");
        },
        onModeChange: (prop: { mode?: string }) => {
          const m = prop?.mode ?? "";
          if (m === "speaking") setMode("agent-speaking");
          else if (m === "listening") setMode("user-speaking");
          else setMode("listening");
        },
        onError: (message: string) => {
          setError(message);
          setStatus("error");
        },
      });
      setConversation(conv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("error");
    }
  }, []);

  const endCall = useCallback(async () => {
    if (conversation) {
      await conversation.endSession();
      setConversation(null);
      setStatus("idle");
    }
  }, [conversation]);

  return (
    <div className="call-page">
      <h1>Aegis AI Agent</h1>
      <p className="call-desc">Voice conversation with Aegis AI</p>

      <CallSetup />

      {error && <p className="call-error">{error}</p>}

      <CallControls
        status={status}
        hasAgentId={!!AGENT_ID}
        onStartCall={startCall}
        onEndCall={endCall}
      />

      {status === "connecting" && (
        <p className="call-status">
          Connecting… Allow microphone access when prompted.
        </p>
      )}
      {status === "connected" && (
        <>
          <div className="call-waveform-wrap">
            <SynthwaveVisualizer conversation={conversation} mode={mode} />
          </div>
          <p className="call-status mode">
            {mode === "agent-speaking" && "Agent speaking…"}
            {mode === "user-speaking" && "Your turn — speak now"}
          </p>
        </>
      )}

      <CallTranscript status={status} transcript={transcript} />
    </div>
  );
}
