import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, NavLink } from 'react-router-dom';

import { useApi } from '../../hooks/useApi';
import { Card, CardBody, Badge, PageHeader, Skeleton } from '../../components/ui';
import { IconUser, IconShield, IconArrowLeft } from '../../components/icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserRole {
  id: string;
  role: { id: string; key: string; nameAr: string; nameEn: string };
  assignedAtUtc: string;
  expiresAtUtc?: string;
}

interface User {
  id: string;
  objectId: string;
  displayNameAr: string;
  displayNameEn: string;
  email: string;
  department?: string;
  jobTitleAr?: string;
  jobTitleEn?: string;
  isActive: boolean;
  userRoles: UserRole[];
}

interface PermissionEntry {
  key: string;
  name: string;
  category: string;
}

interface RolePermissions {
  roleId: string;
  roleName: string;
  permissions: PermissionEntry[];
}

interface UserPermissionSummary {
  userId: string;
  displayName: string;
  roles: RolePermissions[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract the module prefix from a dot-separated permission key. */
function moduleOf(key: string): string {
  const idx = key.indexOf('.');
  return idx > 0 ? key.substring(0, idx) : key;
}

/** Colour classes (raw Tailwind) for category badges when we need explicit purple. */
function categoryBadgeClasses(category: string): string {
  switch (category.toLowerCase()) {
    case 'module':
      return 'bg-purple-50 text-purple-700';
    case 'page':
      return 'bg-blue-50 text-blue-700';
    case 'action':
      return 'bg-green-50 text-green-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UserPermissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { get } = useApi();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  /* ---- state ---- */
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---- data fetching ---- */
  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    void (async () => {
      try {
        setLoading(true);
        const [userData, permData] = await Promise.all([
          get<User>(`/api/v1/users/${id}`, controller.signal),
          get<UserPermissionSummary>(`/api/v1/users/${id}/permissions`, controller.signal),
        ]);
        setUser(userData);
        setPermissions(permData);
      } catch {
        /* silently handle abort / error */
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, get]);

  /* ---- derived: group permissions by module ---- */
  const groupedPermissions = useMemo(() => {
    if (!permissions) return new Map<string, { permission: PermissionEntry; roles: string[] }[]>();

    // Build a map: permissionKey -> { permission, roleNames[] }
    const permMap = new Map<string, { permission: PermissionEntry; roles: string[] }>();

    for (const role of permissions.roles) {
      for (const perm of role.permissions) {
        const existing = permMap.get(perm.key);
        if (existing) {
          if (!existing.roles.includes(role.roleName)) {
            existing.roles.push(role.roleName);
          }
        } else {
          permMap.set(perm.key, { permission: perm, roles: [role.roleName] });
        }
      }
    }

    // Group by module (first segment of the dot key)
    const moduleMap = new Map<string, { permission: PermissionEntry; roles: string[] }[]>();

    for (const entry of permMap.values()) {
      const mod = moduleOf(entry.permission.key);
      const list = moduleMap.get(mod) ?? [];
      list.push(entry);
      moduleMap.set(mod, list);
    }

    return moduleMap;
  }, [permissions]);

  const displayName = user
    ? isAr
      ? user.displayNameAr
      : user.displayNameEn
    : '';

  const jobTitle = user
    ? isAr
      ? user.jobTitleAr
      : user.jobTitleEn
    : '';

  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || '?';

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---- Back link ---- */}
      <NavLink
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t('userPermissionReview.backToUsers')}
      </NavLink>

      {/* ---- Page header ---- */}
      <PageHeader
        title={t('userPermissionReview.title')}
        description={t('userPermissionReview.description')}
      />

      {/* ================================================================ */}
      {/*  Loading skeleton                                                */}
      {/* ================================================================ */}
      {loading && (
        <>
          {/* User info skeleton */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Roles skeleton */}
          <Card>
            <CardBody>
              <Skeleton className="mb-4 h-5 w-40" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Permissions skeleton */}
          <Card>
            <CardBody>
              <Skeleton className="mb-4 h-5 w-52" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Skeleton key={n} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* ================================================================ */}
      {/*  Loaded content                                                  */}
      {/* ================================================================ */}
      {!loading && user && (
        <>
          {/* -------------------------------------------------------------- */}
          {/*  User info card                                                 */}
          {/* -------------------------------------------------------------- */}
          <Card>
            <CardBody>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xl font-bold">
                  {avatarLetter}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 truncate">
                      {displayName}
                    </h2>
                    <Badge
                      variant={user.isActive ? 'success' : 'danger'}
                      dot
                    >
                      {user.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    </Badge>
                  </div>

                  <p className="mt-0.5 text-sm text-neutral-500 truncate">{user.email}</p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    {user.department && (
                      <span>
                        <span className="font-medium text-neutral-700">{t('userPermissionReview.userInfo')}:</span>{' '}
                        {user.department}
                      </span>
                    )}
                    {jobTitle && (
                      <span>{jobTitle}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* -------------------------------------------------------------- */}
          {/*  Assigned Roles                                                 */}
          {/* -------------------------------------------------------------- */}
          <Card>
            <CardBody>
              <div className="mb-4 flex items-center gap-2">
                <IconShield className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  {t('userPermissionReview.assignedRoles')}
                </h3>
              </div>

              {user.userRoles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
                  <IconShield className="mx-auto h-8 w-8 text-neutral-300" />
                  <p className="mt-2 text-sm text-neutral-500">
                    {t('userPermissionReview.noRoles')}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {user.userRoles.map((ur) => (
                    <div
                      key={ur.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100"
                    >
                      <Badge variant="brand" className="mb-2">
                        {isAr ? ur.role.nameAr : ur.role.nameEn}
                      </Badge>
                      <p className="text-[11px] text-neutral-400">
                        {new Date(ur.assignedAtUtc).toLocaleDateString(
                          isAr ? 'ar-SA' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' },
                        )}
                      </p>
                      {ur.expiresAtUtc && (
                        <p className="mt-0.5 text-[11px] text-amber-600">
                          {t('common.expires', 'Expires')}:{' '}
                          {new Date(ur.expiresAtUtc).toLocaleDateString(
                            isAr ? 'ar-SA' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' },
                          )}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* -------------------------------------------------------------- */}
          {/*  Effective Permissions (tree grouped by module)                  */}
          {/* -------------------------------------------------------------- */}
          <Card>
            <CardBody>
              <div className="mb-4 flex items-center gap-2">
                <IconUser className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  {t('userPermissionReview.effectivePermissions')}
                </h3>
              </div>

              {groupedPermissions.size === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
                  <IconShield className="mx-auto h-8 w-8 text-neutral-300" />
                  <p className="mt-2 text-sm text-neutral-500">
                    {t('userPermissionReview.noPermissions')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(groupedPermissions.entries()).map(([moduleName, entries]) => (
                    <div key={moduleName}>
                      {/* Module header */}
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                        <span className="text-sm font-semibold capitalize text-neutral-800">
                          {moduleName}
                        </span>
                        <span className="text-xs text-neutral-400">
                          ({entries.length})
                        </span>
                      </div>

                      {/* Permission items */}
                      <div className="ml-4 border-l-2 border-neutral-200 pl-4 space-y-2">
                        {entries.map(({ permission, roles }) => (
                          <div
                            key={permission.key}
                            className="rounded-lg border border-neutral-100 bg-neutral-0 p-3 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <code className="text-xs font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                {permission.key}
                              </code>
                              <span className="text-sm font-medium text-neutral-800">
                                {permission.name}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeClasses(permission.category)}`}
                              >
                                {permission.category}
                              </span>
                            </div>

                            {/* Granted via roles */}
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {roles.map((roleName) => (
                                <span
                                  key={roleName}
                                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700"
                                >
                                  <IconShield className="h-3 w-3" />
                                  {t('userPermissionReview.grantedVia')}: {roleName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
