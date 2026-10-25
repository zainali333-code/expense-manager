import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then((r) => {
        setUser(r.data);
        setTheme(r.data.theme || 'light');
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const authed = (r) => {
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    setTheme(r.data.user.theme || 'light');
  };

  const login = async (email, password) => authed(await api.post('/auth/login', { email, password }));
  const register = async (name, email, password) => authed(await api.post('/auth/register', { name, email, password }));
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const saveProfile = async (data) => {
    const r = await api.put('/auth/profile', data);
    setUser(r.data);
    if (data.theme) setTheme(data.theme);
  };
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (user) api.put('/auth/profile', { theme: next }).then((r) => setUser(r.data)).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, theme, login, register, logout, saveProfile, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}
