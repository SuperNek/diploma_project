import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute', { user, loading });
  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}