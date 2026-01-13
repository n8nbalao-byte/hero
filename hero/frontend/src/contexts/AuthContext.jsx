import React, { createContext, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const initialUser = (() => {
    const storagedUser = localStorage.getItem('user');
    if (storagedUser) {
        const u = JSON.parse(storagedUser);
        // Migração de legacy role para tipo
        if (u.role && !u.tipo) u.tipo = u.role;
        return u;
    }
    return null;
  })();
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  }
  const [user, setUser] = useState(initialUser);
  const [loading] = useState(false);

  async function signIn(email, senha) {
    try {
      // Envia email e senha (agora o backend espera 'senha')
      const response = await api.post('/login', { email, senha });
      
      const { user, token } = response.data; // Backend já retorna 'user' com campos em pt se atualizado, ou o que tiver

      // Garantir compatibilidade de tipo/role
      if (user.role && !user.tipo) user.tipo = user.role;
      if (user.tipo && !user.role) user.role = user.tipo; // Backward compatibility frontend

      setUser(user);
      api.defaults.headers.Authorization = `Bearer ${token}`;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      return user; 
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  }

  async function signUp(data) {
     try {
       const response = await api.post('/register', data);
       return response.data;
     } catch (error) {
        console.error("Registration failed", error);
        throw error;
     }
  }

  async function signInWithGoogle(idToken) {
    try {
      const response = await api.post('/login/google', { id_token: idToken });
      const { user, token } = response.data;
      setUser(user);
      api.defaults.headers.Authorization = `Bearer ${token}`;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return user;
    } catch (error) {
      console.error("Google login failed", error);
      throw error;
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    api.defaults.headers.Authorization = undefined;
  }

  function updateUser(updatedData) {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut, signUp, signInWithGoogle, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
