import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  adminOnly?: boolean;
}

export function PrivateRoute({ adminOnly = false }: PrivateRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // admin, distributor, agency는 관리자 페이지 접근 가능
  if (adminOnly) {
    const adminRoles = ['admin', 'distributor', 'agency'];
    const hasAdminAccess = adminRoles.includes(user?.role || '') || (user?.level && user.level <= 3);
    
    if (!hasAdminAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}