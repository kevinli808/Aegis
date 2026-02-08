import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-12 bg-white/80 backdrop-blur-md border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/aegis-logo.png" alt="Aegis" className="w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform" />
            <span className="text-xl sm:text-2xl font-bold text-slate-900">Aegis</span>
          </Link>
          <nav className="flex flex-wrap gap-6 items-center">
            <Link to="/request-help" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">Request Help</Link>
            <Link to="/info" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">Safety Guidelines</Link>
            <Link to="/responder" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">Responder Dashboard</Link>
          </nav>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-300 text-sm text-slate-500">
          © {new Date().getFullYear()} Aegis. Help when it matters.
        </div>
      </div>
    </footer>
  )
}
