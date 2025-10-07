import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token); // if we have a token, try /auth/me

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      // token probably invalid
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  // OAuth2PasswordRequestForm expects x-www-form-urlencoded: username, password
  async function login({ username, password }) {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const { data } = await api.post("/auth/token", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    await fetchMe();
    return data;
  }

  async function register({ username, email, password }) {
    // create user
    await api.post("/users/", { username, email, password });
    // then log them in
    return await login({ username, password });
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  const value = { user, token, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
