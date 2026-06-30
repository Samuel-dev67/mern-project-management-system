import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../common/Spinner';

/**
 * Role gate for admin-only pages (currently: Manage Managers).
 * Sits *inside* ProtectedRoute, so by the time this renders we
 * already know the user is authenticated — this only adds the
 * role check on top, redirecting non-admins back to the dashboard
 * instead of letting them see a page they have no access to.
 * Mirrors the existing ProtectedRoute/PublicRoute pattern.
 */
const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-surface-dark">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
