import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

const API_BASE_URL = "/api/user/";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("userToken") || null,
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        // Simple manual JWT decoding to extract user details
        const payloadBase64 = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

        // Check if token is expired
        if (decodedPayload.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({
            id: decodedPayload.id,
            email: decodedPayload.email,
            role: decodedPayload.role,
            orgId: decodedPayload.orgId,
            orgName: decodedPayload.orgName || "Unknown Org",
          });
        }
      } catch (e) {
        console.error("Failed to parse token:", e);
        logout();
      }
    } else {
      setUser(null);
    }
    loading && setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid login credentials");
      }

      localStorage.setItem("userToken", data.token);
      setToken(data.token);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password, orgName) => {
    try {
      const res = await fetch(`${API_BASE_URL}signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, orgName }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Signup failed");
      }

      return { success: true };
    } catch (error) {
      console.error("Signup failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, signup, logout, isAuthenticated: !!user, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
