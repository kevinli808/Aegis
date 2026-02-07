import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useMongoDB } from "../providers/MongoDBProvider";

export default function HomePage() {
  const {
    user,
    isAuthenticated,
    sendOtp,
    verifyOtp,
    logout,
    isLoading: authLoading,
    error: authError,
    clearError,
  } = useAuth();
  const { get } = useMongoDB();
  const [health, setHealth] = useState<{ mongodb: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    get<{ status: string; mongodb: string }>("/health")
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, [get]);

  const handleChangeNumber = () => {
    setCodeSent(false);
    setCode("");
    clearError();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await sendOtp(phone);
      setCodeSent(true);
    } catch {
      // handled by AuthProvider
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await verifyOtp(phone, code);
    } catch {
      // handled by AuthProvider
    }
  };

  return (
    <>
      <h1>Aegis</h1>
      {authLoading && <p>Loading...</p>}
      {isAuthenticated && user && (
        <p>
          Logged in as <strong>{user.phone}</strong>{" "}
          <button type="button" onClick={logout}>
            Logout
          </button>
        </p>
      )}
      {!isAuthenticated && (
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          {!codeSent ? (
            <form
              onSubmit={handleSendOtp}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                alignItems: "center",
              }}
            >
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {authError && <p style={{ color: "red" }}>{authError}</p>}
              <button type="submit">Send code</button>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyOtp}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                alignItems: "center",
              }}
            >
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
              />
              {authError && <p style={{ color: "red" }}>{authError}</p>}
              <button type="submit">Verify</button>
              <button type="button" onClick={handleChangeNumber}>
                Change number
              </button>
            </form>
          )}
        </div>
      )}
      {error && <p style={{ color: "red" }}>API Error: {error}</p>}
      {health && (
        <p>
          MongoDB: <strong>{health.mongodb}</strong>
        </p>
      )}
    </>
  );
}
