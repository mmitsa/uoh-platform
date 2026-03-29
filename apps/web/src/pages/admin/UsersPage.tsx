import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { useApi } from '../../hooks/useApi';
import { usePermissions } from '../../app/permissions';
import {
  Button,
  Input,
  Select,
  Card,
  CardBody,
  Badge,
  DataTable,
  type Column,
  Modal,
  PageHeader,
  useToast,
} from '../../components/ui';
import {
  IconUser,
  IconSearch,
  IconSync,
  IconShield,
  IconPencil,
  IconEye,
  IconPlus,
  IconX,
} from '../../components/icons';

/* ---------- types ---------- */

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
  employeeId?: string;
  jobTitleAr?: string;
  jobTitleEn?: string;
  department?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  isSynced: boolean;
  lastLoginAtUtc?: string;
  lastSyncAtUtc?: string;
  userRoles: UserRole[];
}

interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

interface Role {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
}

interface AdUserInfo {
  objectId: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
}

interface UpdateUserForm {
  displayNameAr: string;
  displayNameEn: string;
  email: string;
  employeeId: string;
  jobTitleAr: string;
  jobTitleEn: string;
  department: string;
  phoneNumber: string;
}

/* ---------- constants ---------- */

const PAGE_SIZE = 20;

/* ---------- component ---------- */

export function UsersPage() {
  const { t, i18n } = useTranslation();
  const { get, post, put, del } = useApi();
  usePermissions();
  const { success, error: toastError } = useToast();

  const isAr = i18n.language === 'ar';

  /* ---- list state ---- */
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  /* ---- roles cache ---- */
  const [roles, setRoles] = useState<Role[]>([]);

  /* ---- modals ---- */
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserForm>({
    displayNameAr: '',
    displayNameEn: '',
    email: '',
    employeeId: '',
    jobTitleAr: '',
    jobTitleEn: '',
    department: '',
    phoneNumber: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const [assignRoleUser, setAssignRoleUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assigningSaving, setAssigningSaving] = useState(false);

  const [syncOpen, setSyncOpen] = useState(false);
  const [syncGroupId, setSyncGroupId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number } | null>(null);

  const [adSearchOpen, setAdSearchOpen] = useState(false);
  const [adQuery, setAdQuery] = useState('');
  const [adResults, setAdResults] = useState<AdUserInfo[]>([]);
  const [adSearching, setAdSearching] = useState(false);

  /* ---- fetch users ---- */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('isActive', statusFilter);

      const res = await get<PaginatedResponse<User>>(
        `/api/v1/users?${params.toString()}`,
      );
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      toastError(t('common.errorOccurred') as string);
    } finally {
      setLoading(false);
    }
  }, [get, page, search, statusFilter, t, toastError]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  /* ---- fetch roles (once) ---- */
  useEffect(() => {
    void (async () => {
      try {
        const res = await get<PaginatedResponse<Role>>(
          '/api/v1/roles?page=1&pageSize=100',
        );
        setRoles(res.items);
      } catch {
        /* silent */
      }
    })();
  }, [get]);

  /* ---- search debounce ---- */
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  /* ---- helpers ---- */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const displayName = useCallback(
    (u: User) => (isAr ? u.displayNameAr : u.displayNameEn) || u.displayNameEn || u.displayNameAr,
    [isAr],
  );

  const roleName = useCallback(
    (r: { nameAr: string; nameEn: string }) => (isAr ? r.nameAr : r.nameEn) || r.nameEn,
    [isAr],
  );

  /* ---- edit user ---- */
  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditForm({
      displayNameAr: u.displayNameAr,
      displayNameEn: u.displayNameEn,
      email: u.email,
      employeeId: u.employeeId ?? '',
      jobTitleAr: u.jobTitleAr ?? '',
      jobTitleEn: u.jobTitleEn ?? '',
      department: u.department ?? '',
      phoneNumber: u.phoneNumber ?? '',
    });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      await put(`/api/v1/users/${editUser.id}`, editForm);
      success(t('userManagement.userUpdated'));
      setEditUser(null);
      void fetchUsers();
    } catch {
      toastError(t('common.errorOccurred') as string);
    } finally {
      setEditSaving(false);
    }
  };

  /* ---- toggle active ---- */
  const handleToggleActive = async (u: User) => {
    if (u.isActive && !window.confirm(t('userManagement.confirmDeactivate'))) return;
    try {
      await post(`/api/v1/users/${u.id}/active`, { isActive: !u.isActive });
      success(
        t(u.isActive ? 'userManagement.deactivate' : 'userManagement.activate'),
      );
      void fetchUsers();
    } catch {
      toastError(t('common.errorOccurred') as string);
    }
  };

  /* ---- assign role ---- */
  const handleAssignRole = async () => {
    if (!assignRoleUser || !selectedRoleId) return;
    setAssigningSaving(true);
    try {
      await post(`/api/v1/users/${assignRoleUser.id}/roles`, {
        roleId: selectedRoleId,
      });
      success(t('userManagement.roleAssigned'));
      setAssignRoleUser(null);
      setSelectedRoleId('');
      void fetchUsers();
    } catch {
      toastError(t('common.errorOccurred') as string);
    } finally {
      setAssigningSaving(false);
    }
  };

  /* ---- remove role ---- */
  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await del(`/api/v1/users/${userId}/roles/${roleId}`);
      success(t('userManagement.roleRemoved'));
      void fetchUsers();
    } catch {
      toastError(t('common.errorOccurred') as string);
    }
  };

  /* ---- AD sync ---- */
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const body = syncGroupId ? { groupId: syncGroupId } : {};
      const res = await post<{ count: number }>('/api/v1/users/sync', body);
      setSyncResult(res);
      success(t('userManagement.syncSuccess'));
      void fetchUsers();
    } catch {
      toastError(t('common.errorOccurred') as string);
    } finally {
      setSyncing(false);
    }
  };

  /* ---- AD search ---- */
  const handleAdSearch = async () => {
    if (!adQuery.trim()) return;
    setAdSearching(true);
    try {
      const res = await get<AdUserInfo[]>(
        `/api/v1/users/ad-search?q=${encodeURIComponent(adQuery)}`,
      );
      setAdResults(res);
    } catch {
      toastError(t('common.errorOccurred') as string);
    } finally {
      setAdSearching(false);
    }
  };

  /* ---- status filter options ---- */
  const statusOptions = useMemo(
    () => [
      { value: '', label: t('userManagement.allStatuses') },
      { value: 'true', label: t('userManagement.active') },
      { value: 'false', label: t('userManagement.inactive') },
    ],
    [t],
  );

  /* ---- role select options ---- */
  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: r.id,
        label: roleName(r),
      })),
    [roles, roleName],
  );

  /* ---- table columns ---- */
  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('userManagement.name'),
        render: (u) => (
          <div className="flex items-center gap-3">
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <IconUser className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {displayName(u)}
              </p>
              {u.employeeId && (
                <p className="truncate text-xs text-neutral-400">
                  #{u.employeeId}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: t('userManagement.email'),
        render: (u) => (
          <span className="text-sm text-neutral-600">{u.email}</span>
        ),
      },
      {
        key: 'department',
        header: t('userManagement.department'),
        render: (u) => (
          <span className="text-sm text-neutral-600">
            {u.department || '--'}
          </span>
        ),
      },
      {
        key: 'roles',
        header: t('userManagement.roles'),
        render: (u) => (
          <div className="flex flex-wrap gap-1">
            {u.userRoles.length === 0 && (
              <span className="text-xs text-neutral-400">--</span>
            )}
            {u.userRoles.map((ur) => (
              <div key={ur.id} className="group flex items-center gap-0.5">
                <Badge variant="brand" className="text-[10px]">
                  {roleName(ur.role)}
                </Badge>
                <button
                  onClick={() => handleRemoveRole(u.id, ur.role.id)}
                  className="hidden rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 group-hover:inline-flex"
                  title={t('userManagement.removeRole')}
                >
                  <IconX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: 'status',
        header: t('userManagement.status'),
        render: (u) =>
          u.isActive ? (
            <Badge variant="success" dot>
              {t('userManagement.active')}
            </Badge>
          ) : (
            <Badge variant="danger" dot>
              {t('userManagement.inactive')}
            </Badge>
          ),
      },
      {
        key: 'actions',
        header: t('userManagement.actions'),
        className: 'w-1',
        render: (u) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<IconPencil className="h-4 w-4" />}
              onClick={() => openEditModal(u)}
              title={t('userManagement.editUser')}
            />
            <NavLink to={`/admin/users/${u.id}/permissions`}>
              <Button
                variant="ghost"
                size="sm"
                icon={<IconEye className="h-4 w-4" />}
                title={t('userManagement.viewPermissions')}
              />
            </NavLink>
            <Button
              variant="ghost"
              size="sm"
              icon={<IconShield className="h-4 w-4" />}
              onClick={() => {
                setAssignRoleUser(u);
                setSelectedRoleId('');
              }}
              title={t('userManagement.assignRole')}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={
                u.isActive ? (
                  <IconX className="h-4 w-4 text-red-500" />
                ) : (
                  <IconPlus className="h-4 w-4 text-green-600" />
                )
              }
              onClick={() => handleToggleActive(u)}
              title={t(
                u.isActive
                  ? 'userManagement.deactivate'
                  : 'userManagement.activate',
              )}
            />
          </div>
        ),
      },
    ],
    [t, displayName, roleName],
  );

  /* ---- render ---- */
  return (
    <div className="space-y-6">
      {/* -- Header -- */}
      <PageHeader
        title={t('userManagement.title')}
        description={t('userManagement.description')}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<IconSync className="h-4 w-4" />}
              onClick={() => {
                setSyncOpen(true);
                setSyncResult(null);
                setSyncGroupId('');
              }}
            >
              {t('userManagement.syncFromAd')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<IconPlus className="h-4 w-4" />}
              onClick={() => {
                setAdSearchOpen(true);
                setAdQuery('');
                setAdResults([]);
              }}
            >
              {t('userManagement.addFromAd')}
            </Button>
          </>
        }
      />

      {/* -- Filters -- */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                placeholder={t('userManagement.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                placeholder={t('userManagement.allStatuses')}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* -- Data Table -- */}
      <Card>
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          keyExtractor={(u) => u.id}
          emptyIcon={<IconUser className="h-10 w-10 text-neutral-300" />}
          emptyTitle={t('userManagement.noUsers')}
          emptyDescription={t('userManagement.noUsersDesc')}
        />

        {/* -- Pagination -- */}
        {!loading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
            <p className="text-xs text-neutral-500">
              {t('common.showing', {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, total),
                total,
              }) as string ||
                `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} / ${total}`}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                &laquo;
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1,
                )
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ell-${idx}`}
                      className="px-1 text-xs text-neutral-400"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPage(item as number)}
                    >
                      {item}
                    </Button>
                  ),
                )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                &raquo;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ====== Edit User Modal ====== */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={t('userManagement.editUser')}
        className="sm:max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('userManagement.displayNameAr')}
              value={editForm.displayNameAr}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, displayNameAr: e.target.value }))
              }
            />
            <Input
              label={t('userManagement.displayNameEn')}
              value={editForm.displayNameEn}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, displayNameEn: e.target.value }))
              }
            />
          </div>
          <Input
            label={t('userManagement.email')}
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, email: e.target.value }))
            }
          />
          <Input
            label={t('userManagement.employeeId')}
            value={editForm.employeeId}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, employeeId: e.target.value }))
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('userManagement.jobTitleAr')}
              value={editForm.jobTitleAr}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, jobTitleAr: e.target.value }))
              }
            />
            <Input
              label={t('userManagement.jobTitleEn')}
              value={editForm.jobTitleEn}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, jobTitleEn: e.target.value }))
              }
            />
          </div>
          <Input
            label={t('userManagement.department')}
            value={editForm.department}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, department: e.target.value }))
            }
          />
          <Input
            label={t('userManagement.phoneNumber')}
            value={editForm.phoneNumber}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button loading={editSaving} onClick={handleEditSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====== Assign Role Modal ====== */}
      <Modal
        open={!!assignRoleUser}
        onClose={() => setAssignRoleUser(null)}
        title={t('userManagement.assignRole')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {assignRoleUser && displayName(assignRoleUser)}
          </p>

          {assignRoleUser && assignRoleUser.userRoles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {assignRoleUser.userRoles.map((ur) => (
                <Badge key={ur.id} variant="brand" className="text-xs">
                  {roleName(ur.role)}
                </Badge>
              ))}
            </div>
          )}

          <Select
            label={t('userManagement.selectRole')}
            options={roleOptions}
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            placeholder={t('userManagement.selectRole')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignRoleUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={assigningSaving}
              disabled={!selectedRoleId}
              onClick={handleAssignRole}
            >
              {t('userManagement.assignRole')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====== AD Sync Modal ====== */}
      <Modal
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        title={t('userManagement.syncFromAd')}
      >
        <div className="space-y-4">
          <Input
            label="Group ID"
            placeholder="(optional)"
            value={syncGroupId}
            onChange={(e) => setSyncGroupId(e.target.value)}
          />

          {syncResult && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {t('userManagement.syncCount', { count: syncResult.count })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSyncOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={syncing}
              icon={<IconSync className="h-4 w-4" />}
              onClick={handleSync}
            >
              {t('userManagement.syncFromAd')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====== AD Search Modal ====== */}
      <Modal
        open={adSearchOpen}
        onClose={() => setAdSearchOpen(false)}
        title={t('userManagement.addFromAd')}
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={t('userManagement.searchAd')}
                value={adQuery}
                onChange={(e) => setAdQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleAdSearch();
                }}
              />
            </div>
            <Button
              loading={adSearching}
              icon={<IconSearch className="h-4 w-4" />}
              onClick={handleAdSearch}
            >
              {t('userManagement.searchAd')}
            </Button>
          </div>

          {adResults.length > 0 && (
            <div className="max-h-72 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200">
              {adResults.map((ad) => (
                <div
                  key={ad.objectId}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {ad.displayName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {ad.email}
                      {ad.department && ` - ${ad.department}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<IconPlus className="h-3.5 w-3.5" />}
                    onClick={async () => {
                      try {
                        await post('/api/v1/users/sync', {
                          groupId: ad.objectId,
                        });
                        success(t('userManagement.syncSuccess'));
                        void fetchUsers();
                      } catch {
                        toastError(t('common.errorOccurred') as string);
                      }
                    }}
                  >
                    {t('common.add')}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {adResults.length === 0 && adQuery && !adSearching && (
            <p className="py-6 text-center text-sm text-neutral-400">
              {t('userManagement.noUsers')}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setAdSearchOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
