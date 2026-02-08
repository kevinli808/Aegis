import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import HomePage from './pages/HomePage/index.tsx'
import CallPage from './pages/Call/index.tsx'
import InfoPage from './pages/InfoPage/index.tsx'
import ProtectedLayout from './layouts/ProtectedLayout'
import { AuthProvider, MongoDBProvider } from './providers'

import LandingPage from './components/LandingPage.tsx'
import { ResponderDashboard } from './components/ResponderDashboard.tsx'
import { RespondeeForm } from './components/RespondeeForm.tsx'
import { DisasterInfo } from './components/DisasterInfo.tsx'
import { AdminLogin } from './components/AdminLogin.tsx'
import { AdminDashboard } from './components/AdminDashboard.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MongoDBProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<LandingPage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="info" element={<InfoPage />} />
              <Route path="disaster-info" element={<DisasterInfo />} />
              <Route path="responder" element={<ResponderDashboard />} />
              <Route path="request-help" element={<RespondeeForm />} />
              <Route path="admin">
                <Route path="login" element={<AdminLogin />} />
                <Route path="dashboard" element={<AdminDashboard />} />
              </Route>
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
