import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tecnostock_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si hay token, podríamos validar con el backend, por ahora confiamos
    if (token) {
      const storedUser = localStorage.getItem('tecnostock_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('tecnostock_token', jwtToken);
    localStorage.setItem('tecnostock_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tecnostock_token');
    localStorage.removeItem('tecnostock_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
