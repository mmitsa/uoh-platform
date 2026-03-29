import { Navigate } from 'react-router-dom';
import { useAuth, type AppRole } from '../app/auth';
import { usePermissions } from '../app/permissions';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
  requiredPermission?: string | string[];
}

function AccessDenied() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-neutral-900">{t('errors.accessDenied', 'Access Denied')}</h2>
      <p className="max-w-md text-sm text-neutral-600">{t('errors.noPermission', "You don't have the required permissions to access this page.")}</p>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const { hasAnyPermission } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Legacy role check (backward compatible)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!hasRole(...roles)) {
      return <AccessDenied />;
    }
  }

  // New permission check
  if (requiredPermission) {
    const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    if (!hasAnyPermission(...perms)) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
}
