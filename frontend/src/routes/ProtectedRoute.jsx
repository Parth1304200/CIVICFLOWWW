import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'cm') return <Navigate to="/cm-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  // ADMIN and CM users bypass the profile setup gate entirely
  const isCitizen = user.role === 'citizen';

  // If citizen profile is not set up, and they are not on /setup-profile, redirect them there!
  if (isCitizen && !user.isProfileSetup) {
    if (location.pathname !== '/setup-profile') {
      return <Navigate to="/setup-profile" replace />;
    }
  }

  // If citizen profile IS setup, and they try to visit /setup-profile, redirect them to dashboard
  if (isCitizen && user.isProfileSetup && location.pathname === '/setup-profile') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}
