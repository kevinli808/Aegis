import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, MongoDBProvider } from './providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MongoDBProvider>
        <App />
      </MongoDBProvider>
    </AuthProvider>
  </StrictMode>,
)
