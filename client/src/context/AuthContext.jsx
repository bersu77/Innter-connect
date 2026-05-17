// AuthContext — single source of truth for the current user / session on the frontend.
// Stable contract consumed by ProtectedRoute and every role dashboard.
// Phase 2 (Auth module) finalises the exact backend request/response shapes.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client, { tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate the session from a stored token on first load.
  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await client.get('/auth/me');
        if (active) setUser(data.user ?? data.data ?? null);
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    if (data.token) tokenStore.set(data.token);
    setUser(data.user ?? null);
    return data.user;
  }

  async function register(payload) {
    const { data } = await client.post('/auth/register', payload);
    if (data.token) tokenStore.set(data.token);
    setUser(data.user ?? null);
    return data.user;
  }

  async function logout() {
    try {
      await client.post('/auth/logout');
    } catch {
      // Logging out locally must succeed even if the network call fails.
    }
    tokenStore.clear();
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, register, logout }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
