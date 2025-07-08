import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-10">Yüklənir...</p>;
  }

  return user?.token ? children : <Navigate to="/" />;
}
