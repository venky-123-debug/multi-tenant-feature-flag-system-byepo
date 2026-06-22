import React from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Login from "./components/Login"
import Dashboard from "./components/Dashboard"

function MainContent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070b19]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return isAuthenticated ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}
