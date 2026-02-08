import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface BackToHomeButtonProps {
  className?: string
}

export function BackToHomeButton({ className = '' }: BackToHomeButtonProps) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 hover:bg-gray-100 rounded-lg px-2 py-1.5 -mx-2 -my-1.5 transition-colors text-sm sm:text-base ${className}`}
    >
      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
      Back to Home
    </Link>
  )
}
