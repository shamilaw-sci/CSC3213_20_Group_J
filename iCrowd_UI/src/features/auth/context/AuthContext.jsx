import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../api/authApi';
import { AuthContext } from './authState';
import { setSessionToken, clearSession } from '../../../lib/session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [credential, setCredential] = useState(null);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    const synchronize = async () => {
      const revision = ++generation.current;
      const token = localStorage.getItem('token');
      setSessionToken(null); setCredential(null); setUser(null); setInitializing(true);
      try {
        if (token) {
          const next = await getCurrentUser(token);
          if (!active || revision !== generation.current || token !== localStorage.getItem('token')) return;
          try { const checkout=JSON.parse(sessionStorage.getItem('checkoutData') || 'null'); if(checkout && checkout.owner!==String(next.id || next.email)) sessionStorage.removeItem('checkoutData'); } catch { sessionStorage.removeItem('checkoutData'); }
          setSessionToken(token); setCredential(token); setUser(next);
        }
      } catch (err) {
        if (!active || revision !== generation.current) return;
        if (err.response?.status === 401 && localStorage.getItem('token') === token) localStorage.removeItem('token');
        else setError('Your account could not be loaded. Please sign in again or refresh.');
      } finally {
        if (active && revision === generation.current) { setLoading(false); setInitializing(false); }
      }
    };
    const storage = event => { if (event.key === 'token' || event.key === null) { sessionStorage.clear(); synchronize(); } };
    const expired = () => { ++generation.current; setUser(null); setCredential(null); setInitializing(false); setLoading(false); };
    synchronize();
    window.addEventListener('storage', storage); window.addEventListener('session-expired', expired);
    return () => { active = false; window.removeEventListener('storage', storage); window.removeEventListener('session-expired', expired); };
  }, []);
  const login = async credentials => {
    const revision = ++generation.current;
    setLoading(true); setError(null);
    try {
      const data = await loginUser(credentials);
      if (revision !== generation.current) return null;
      if (data.token) {
        sessionStorage.removeItem('checkoutData');
        localStorage.setItem('token', data.token); setSessionToken(data.token); setCredential(data.token); setUser(data.user);
        return data.user;
      }
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); throw err; }
    finally { if (revision === generation.current) { setLoading(false); setInitializing(false); } }
  };
  const register = async data => {
    setLoading(true); setError(null);
    try { return await registerUser(data); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); throw err; }
    finally { setLoading(false); }
  };
  const logout = async () => {
    const token = credential;
    const request = logoutUser();
    clearSession(token);
    await request;
  };
  return <AuthContext.Provider value={{ user, credential, loading, initializing, error,
    isAdmin: user?.role === 'ADMIN', isAuthenticated: !!user, login, register, logout,
    updateUser: data => setUser(previous => previous ? { ...previous, ...data } : null), clearError: () => setError(null),
  }}>{children}</AuthContext.Provider>;
};
