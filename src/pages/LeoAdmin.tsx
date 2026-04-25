import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRoute } from '../components/admin/AdminRoute';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminRestaurantList } from '../components/admin/AdminRestaurantList';
import { AdminRestaurantDetail } from '../components/admin/AdminRestaurantDetail';
import { AdminRevenue } from '../components/admin/AdminRevenue';
import { AdminHealth } from '../components/admin/AdminHealth';
import { AdminSettings } from '../components/admin/AdminSettings';

export default function LeoAdmin() {
  return (
    <AdminRoute>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="restaurants" element={<AdminRestaurantList />} />
          <Route path="restaurants/:id" element={<AdminRestaurantDetail />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="health" element={<AdminHealth />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/leomenu-admin" replace />} />
        </Route>
      </Routes>
    </AdminRoute>
  );
}
