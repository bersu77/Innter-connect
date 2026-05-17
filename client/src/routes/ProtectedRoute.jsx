// ProtectedRoute — route guard.
// Blocks unauthenticated users; optionally restricts a route to specific roles.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // `userType` is the PDF field; `role` is the current backend field (aligned in Phase 1/2).
  const currentRole = user.userType ?? user.role;
  if (roles?.length && !roles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
