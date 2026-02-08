import { Link } from 'react-router-dom'
import { Shield, AlertCircle } from 'lucide-react'

export function IndexChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">Aegis</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10">Disaster response coordination</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Would you like to report an incident or are you a responder?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            to="/request-help"
            className="bg-red-600 text-white rounded-xl p-6 sm:p-8 hover:bg-red-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-3"
          >
            <AlertCircle className="w-12 h-12 sm:w-14 sm:h-14" />
            <span className="text-xl sm:text-2xl font-bold">I need help</span>
            <span className="text-sm text-red-100">Report an incident or request assistance</span>
          </Link>
          <Link
            to="/responder"
            className="bg-blue-600 text-white rounded-xl p-6 sm:p-8 hover:bg-blue-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-3"
          >
            <Shield className="w-12 h-12 sm:w-14 sm:h-14" />
            <span className="text-xl sm:text-2xl font-bold">I'm a responder</span>
            <span className="text-sm text-blue-100">View incidents and provide assistance</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
