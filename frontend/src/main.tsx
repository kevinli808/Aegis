import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { ToastProvider } from './components/Toast'
import { ConfirmModalProvider } from './components/ConfirmModal'
import './index.css'
import CallPage from './pages/Call'
import GeminiChatPage from './pages/GeminiChat'
import { AuthProvider, MongoDBProvider } from './providers'
import LandingPage from './components/LandingPage'
import { ResponderDashboard } from './components/ResponderDashboard'
import { RespondeeForm } from './components/RespondeeForm'
import { DisasterInfo } from './components/DisasterInfo'
import { AdminLogin } from './components/AdminLogin'
import { AdminDashboard } from './components/AdminDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmModalProvider>
      <AuthProvider>
        <MongoDBProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<LandingPage />} />
              <Route path="/responder" element={<ResponderDashboard />} />
              <Route path="/request-help" element={<RespondeeForm />} />
              <Route path="/gemini-chat" element={<GeminiChatPage />} />
              <Route path="/info" element={<DisasterInfo />} />
              <Route path="/call" element={<CallPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </BrowserRouter>
        </MongoDBProvider>
      </AuthProvider>
      </ConfirmModalProvider>
    </ToastProvider>
  </StrictMode>,
)
