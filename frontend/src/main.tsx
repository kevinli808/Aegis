import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import CallPage from './pages/Call'
import { AuthProvider, MongoDBProvider } from './providers'

// New UI components (Disaster Response UI)
import { IndexChoice } from './components/IndexChoice'
import LandingPage from './components/LandingPage'
import { ResponderDashboard } from './components/ResponderDashboard'
import { RespondeeForm } from './components/RespondeeForm'
import { DisasterInfo } from './components/DisasterInfo'
import { AdminLogin } from './components/AdminLogin'
import { AdminDashboard } from './components/AdminDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MongoDBProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<LandingPage />} />
            <Route path="/responder" element={<ResponderDashboard />} />
            <Route path="/request-help" element={<RespondeeForm />} />
            <Route path="/info" element={<DisasterInfo />} />
            <Route path="/call" element={<CallPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </MongoDBProvider>
    </AuthProvider>
  </StrictMode>,
)
