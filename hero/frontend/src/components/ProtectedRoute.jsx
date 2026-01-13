import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { signed, user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!signed) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.tipo)) {
     // Redirect to appropriate dashboard based on actual role
     if (user.tipo === 'client') return <Navigate to="/" />;
     if (user.tipo === 'shop_owner') return <Navigate to="/shop-dashboard" />;
     if (user.tipo === 'courier') return <Navigate to="/courier-dashboard" />;
     if (user.tipo === 'admin') return <Navigate to="/admin-dashboard" />;
     return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
