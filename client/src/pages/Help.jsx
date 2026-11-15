import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../config/api';
export default function Help() {
  const location = useLocation();
  const user = isAuthenticated() ? getCurrentUser() : null;
  const panel = new URLSearchParams(location.search).get('panel');
  const base = user ? (user.role === 'admin' ? '/admin' : '/student') : '/';
  return <Navigate replace to={base + '?support=' + (panel === 'review' ? 'review' : panel === 'requests' ? 'requests' : 'help')} />;
}
