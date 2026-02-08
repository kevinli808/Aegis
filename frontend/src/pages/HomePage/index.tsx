import { useEffect, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useMongoDB } from "../../providers/MongoDBProvider";
import "./HomePage.css";

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

  const handleSendOtp = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    try {
      await sendOtp(phone);
      setCodeSent(true);
    } catch {
      // handled by AuthProvider
    }
  };

  const handleVerifyOtp = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    try {
      await verifyOtp(phone, code);
    } catch {
      // handled by AuthProvider
    }
  };

  return (
    <div className="home-page">
      <h1>Aegis</h1>
      <p className="home-desc">Disaster response for Hack the Coast 2026</p>

      {authLoading && <p className="loading">Loading...</p>}
      {isAuthenticated && user && (
        <div className="logged-in">
          Logged in as <strong>{user.phone}</strong>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      )}
      {!isAuthenticated && (
        <div className="auth-section">
          {!codeSent ? (
            <form onSubmit={handleSendOtp} className="auth-form">
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {authError && <p className="auth-error">{authError}</p>}
              <button type="submit">Send code</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form">
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
              {authError && <p className="auth-error">{authError}</p>}
              <div className="btn-group">
                <button type="submit">Verify</button>
                <button type="button" onClick={handleChangeNumber}>
                  Change number
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {error && <p className="api-error">API Error: {error}</p>}
      {health && (
        <p className="health-status">
          MongoDB: <strong>{health.mongodb}</strong>
        </p>
      )}
    </div>
  );
}
