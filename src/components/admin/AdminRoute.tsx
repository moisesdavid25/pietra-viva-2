import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdminAuth();

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
