import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('pengwin_token');
    if (!token) { setLoading(false); return; }
    try {
      const me = await userApi.me();
      setUser(me);
    } catch {
      localStorage.removeItem('pengwin_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (token, userData) => {
    localStorage.setItem('pengwin_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pengwin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

