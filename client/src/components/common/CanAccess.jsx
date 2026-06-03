import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessPath, getDefaultPath } from '../../config/roles';

/**
 * Route guard — redirects if user's role cannot access this path.
 */
export default function CanAccess({ path, roles, children, fallback = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-surface-800/40">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    if (fallback !== null) return fallback;
    return <Navigate to={getDefaultPath(user)} replace />;
  }

  if (path && !canAccessPath(user, path)) {
    if (fallback !== null) return fallback;
    return <Navigate to={getDefaultPath(user)} replace />;
  }

  return children;
}
