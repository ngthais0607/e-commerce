import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = user?.role;

    // Admin always has access
    const hasAccess = userRole === 'ADMIN' || (userRole && roles.includes(userRole));

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

