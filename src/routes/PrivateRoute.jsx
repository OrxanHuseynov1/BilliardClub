import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-10">Yüklənir...</p>;
  }

  if (!user?.token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}