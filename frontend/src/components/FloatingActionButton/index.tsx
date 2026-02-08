import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import './FloatingActionButton.css'

export default function FloatingActionButton() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <Link to="/call" className="fab" title="Create response — AI Agent">
      <span className="fab-icon">+</span>
    </Link>
  )
}
