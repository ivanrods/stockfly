import { Routes, Route, Navigate } from 'react-router-dom';
import Register from '@/features/auth/pages/register';

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
