import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';

interface Props {
  children: JSX.Element;
}

const PrivateRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
