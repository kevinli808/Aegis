import { Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import FloatingActionButton from './components/FloatingActionButton'
import './App.css'

export default function App() {
  return (
    <div>
      <Outlet />
      <FloatingActionButton />
      <BottomNav />
    </div>
  )
}
