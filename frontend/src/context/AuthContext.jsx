import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка авторизации');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/check');
        setUser(data.user);
        console.log('AuthContext setUser', data.user);
      } catch (error) {
        // Если accessToken истёк, пробуем обновить токен
        try {
          await api.post('/auth/refresh-token');
          // После обновления токена пробуем снова
          const { data } = await api.get('/auth/check');
          setUser(data.user);
        } catch (refreshError) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);