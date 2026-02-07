import { Link, Outlet } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import './App.css'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#1a1a1a' }}>
      <nav style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#1a1a1a' }}>
          Aegis
        </Link>
        {isAuthenticated && (
          <Link to="/call" style={{ textDecoration: 'none', color: '#2563eb' }}>
            AI Call
          </Link>
        )}
      </nav>
      <Outlet />
    </div>
  )
}
