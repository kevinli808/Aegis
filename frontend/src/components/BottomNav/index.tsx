import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
  { to: '/home', label: 'Home', icon: '⌂' },
  { to: '/info', label: 'Info', icon: 'ℹ' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{icon}</span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
