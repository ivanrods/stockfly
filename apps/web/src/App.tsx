import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/features/auth/pages/login-page';
import Register from '@/features/auth/pages/register-page';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
