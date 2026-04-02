import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminLayout() {
  const { userEmail } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <AdminSidebar />

      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6">
          <p className="text-xs font-bold text-gray-400">Leomenu Admin Dashboard</p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#008081] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              Admin
            </span>
            <span className="text-xs text-gray-500 font-medium">{userEmail}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
