import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'

interface NavbarProps {
  /** Optional content for the right side (e.g. Admin link, Logout) */
  rightContent?: ReactNode
}

export function Navbar({ rightContent }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/aegis-logo.png" alt="Aegis" className="w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform" />
          <span className="text-xl sm:text-2xl font-bold text-slate-900">Aegis</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/info" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
              Safety Guidelines
            </Link>
            <Link
              to="/responder"
              className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sky-700 transition-all"
            >
              Responder Dashboard
            </Link>
          </div>
          {rightContent}
        </div>
      </div>
    </nav>  
  )
}
