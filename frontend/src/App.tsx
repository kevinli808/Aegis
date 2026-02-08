import { Link, Outlet } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import './App.css'
import logo from './assets/original-logo.png'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Aegis" className="w-10 h-10 sm:w-12 sm:h-12" />
            <span className="text-xl sm:text-2xl font-bold">Aegis</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/call" className="text-blue-300 hover:text-white">AI Call</Link>
            )}
            <Link to="/admin/login" className="text-gray-300 hover:text-white">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
