import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-12 bg-slate-900 text-gray-300 py-8 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/aegis-logo.png" alt="Aegis" className="w-8 h-8" />
            <span className="font-semibold text-white">Aegis</span>
          </Link>
          <nav className="flex flex-wrap gap-6">
            <Link to="/request-help" className="hover:text-white transition-colors">Request Help</Link>
            <Link to="/responder" className="hover:text-white transition-colors">Responders</Link>
            <Link to="/info" className="hover:text-white transition-colors">Safety Info</Link>
          </nav>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-700 text-sm text-gray-400">
          © {new Date().getFullYear()} Aegis. Help when it matters.
        </div>
      </div>
    </footer>
  )
}
