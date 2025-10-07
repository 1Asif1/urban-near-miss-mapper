import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);
  const [role, setRole] = useState(() => localStorage.getItem('authRole') || null);
  const [userId, setUserId] = useState(() => localStorage.getItem('authUserId') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('authRole', role);
    } else {
      localStorage.removeItem('authRole');
    }
  }, [role]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('authUserId', userId);
    } else {
      localStorage.removeItem('authUserId');
    }
  }, [userId]);

  const value = useMemo(() => ({
    token,
    role,
    userId,
    setAuth: ({ token: t, role: r, userId: id }) => {
      setToken(t || null);
      setRole(r || null);
      setUserId(id || null);
    },
    logout: () => {
      setToken(null);
      setRole(null);
      setUserId(null);
    }
  }), [token, role, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
