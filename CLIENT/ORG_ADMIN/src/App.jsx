import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";

function MainContent() {
  const { isAuthenticated, loading } = useAuth();
  const [view, setView] = useState("login"); // 'login' | 'signup'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070b19]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return view === "login" ? (
    <Login onNavigateToSignup={() => setView("signup")} />
  ) : (
    <Signup onNavigateToLogin={() => setView("login")} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
