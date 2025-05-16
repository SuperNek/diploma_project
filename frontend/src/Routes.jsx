import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth/AuthPage';
import AdminPage from './pages/Admin/AdminPage';
import UserPage from './pages/User/UserPage';
import CoordinatorPage from './pages/Coordinator/CoordinatorPage';
import ExpertPage from './pages/Expert/ExpertPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
      <Route path="/user" element={
        <ProtectedRoute roles={['user']}>
          <MainLayout>
            <UserPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/coordinator" element={<ProtectedRoute roles={['coordinator']}><CoordinatorPage /></ProtectedRoute>} />
      <Route path="/expert" element={<ProtectedRoute roles={['expert']}><ExpertPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}