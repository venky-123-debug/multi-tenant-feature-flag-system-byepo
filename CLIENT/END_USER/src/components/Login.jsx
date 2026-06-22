import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Mail,
  Lock,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Login({ onNavigateToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "Login failed. Please verify your credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#070b19]">
      {/* Background Neon Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[100px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md p-8 z-10">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 mb-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Byepo Console
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            End User Access Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="flex items-center gap-3 p-3 mb-6 border rounded-xl bg-red-950/20 border-red-500/30 text-red-400 text-sm animate-shake">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                User Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                </span>
              )}
            </button>
          </form>

          {/* Navigation to Signup */}
          <div className="mt-5 text-center text-sm">
            <span className="text-slate-500">Don't have an account? </span>
            <button
              type="button"
              onClick={onNavigateToSignup}
              className="text-blue-500 hover:text-blue-400 font-semibold transition-colors"
            >
              Register Account
            </button>
          </div>
        </div>

        {/* Footer Notes */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Sessions are encrypted. Authorized access only.
        </p>
      </div>
    </div>
  );
}
