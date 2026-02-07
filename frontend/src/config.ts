/**
 * API base URL. When empty, providers use mock mode (no backend calls).
 * Set VITE_API_URL in .env to point at your Python backend when ready.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? ''
export const isMockMode = !API_BASE
