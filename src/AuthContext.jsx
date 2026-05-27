import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { setLoading(false); return; }
    try { setUser(await getUser()); }
    catch { localStorage.removeItem('authToken'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Pick up accessToken from Google OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get('accessToken');
    if (token) {
      localStorage.setItem('authToken', token);
      window.history.replaceState({}, '', window.location.pathname);
    }
    loadUser();
  }, [loadUser]);

  const loginSuccess = (token, userData) => {
    localStorage.setItem('authToken', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
