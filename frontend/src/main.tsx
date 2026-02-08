import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import HomePage from './pages/HomePage/'
import CallPage from './pages/Call/'
import InfoPage from './pages/InfoPage'
import ProtectedLayout from './layouts/ProtectedLayout'
import { AuthProvider, MongoDBProvider } from './providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MongoDBProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<HomePage />} />
              <Route path="info" element={<InfoPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="call" element={<CallPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </MongoDBProvider>
    </AuthProvider>
  </StrictMode>,
)
