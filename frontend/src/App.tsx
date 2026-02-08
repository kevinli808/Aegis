import { Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import FloatingActionButton from './components/FloatingActionButton'
import './App.css'

export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#1a1a1a' }}>
      <Outlet />
      <FloatingActionButton />
      <BottomNav />
    </div>
  )
}
