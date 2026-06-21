import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user_data');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (data) => {
    const userData = { username: data.username, rol: data.rol, permisos: data.permisos };
    setUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('admin_access', data.access);
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    window.location.href = '/';
  };

  const tienePermiso = (modulo, accion) => {
    if (user?.rol === 'superusuario') return true;
    return user?.permisos?.[modulo]?.[accion] || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
