import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGame } from './engine/GameContext'
import Navbar from './components/Navbar'
import Notifications from './components/Notifications'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import StoreView from './components/StoreView'
import Catalog from './components/Catalog'
import Market from './components/Market'
import WhiteLabel from './components/WhiteLabel'
import Franchises from './components/Franchises'
import Community from './components/Community'
import './styles/global.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useGame()
  if (!state.user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { state } = useGame()

  return (
    <>
      <Navbar />
      <Notifications />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/store/:id" element={
          <ProtectedRoute><StoreView /></ProtectedRoute>
        } />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/market" element={<Market />} />
        <Route path="/white-label" element={
          <ProtectedRoute><WhiteLabel /></ProtectedRoute>
        } />
        <Route path="/franchises" element={
          <ProtectedRoute><Franchises /></ProtectedRoute>
        } />
        <Route path="/community" element={<Community />} />
      </Routes>
    </>
  )
}
