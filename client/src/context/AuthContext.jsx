import { useState } from 'react';
import { AuthContext } from './authContextValue';

const getStoredUser = () => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!savedUser || !token) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};