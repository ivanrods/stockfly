import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/shared/auth/auth-provider';
import ProtectedRoute from '@/shared/auth/protected-route';
import PublicRoute from '@/shared/auth/public-route';
import Login from '@/features/auth/pages/login-page';
import Register from '@/features/auth/pages/register-page';
import HomePage from '@/features/home/pages/home-page';
import CompanySettingsPage from '@/features/companies/pages/company-settings-page';
import MainLayout from '@/shared/layouts/main-layout';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
