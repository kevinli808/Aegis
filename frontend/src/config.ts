/**
 * API base URL for MongoDB backend.
 * Set VITE_API_URL in .env to override (e.g. for production).
 */
// export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
export const isMockMode = !API_BASE
