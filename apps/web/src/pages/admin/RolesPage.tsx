import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import {
  Button,
  Input,
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
  IconRoles,
  IconPlus,
  IconPencil,
  IconTrash,
  IconShield,
  IconLock,
  IconCheck,
} from '../../components/icons';
import { usePermissions } from '../../app/permissions';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Role {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAtUtc: string;
}

interface Permission {
  id: string;
  key: string;
  category: string;
  nameAr: string;
  nameEn: string;
  route?: string;
  sortOrder: number;
}

interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

interface RoleFormData {
  key: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

const EMPTY_FORM: RoleFormData = {
  key: '',
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function RolesPage() {
  const { t, i18n } = useTranslation();
  const { get, post, put, del } = useApi();
  const { success, error } = useToast();
  usePermissions();
  const isRtl = i18n.language === 'ar';

  /* ---- State: table ---- */
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ---- State: create / edit modal ---- */
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ---- State: delete confirmation ---- */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- State: permissions modal ---- */
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
  const [allPermissionsGrouped, setAllPermissionsGrouped] = useState<Record<string, Permission[]>>({});
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*  Data fetching                                                           */
  /* ------------------------------------------------------------------------ */

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedResponse<Role>>(
        `/api/v1/roles?page=${page}&pageSize=${pageSize}&isActive=true`,
      );
      setRoles(data.items);
      setTotal(data.total);
    } catch {
      error(t('roleManagement.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [get, page, pageSize, error, t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  /* ------------------------------------------------------------------------ */
  /*  Create / Edit helpers                                                   */
  /* ------------------------------------------------------------------------ */

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    setShowRoleModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      key: role.key,
      nameAr: role.nameAr,
      nameEn: role.nameEn,
      descriptionAr: role.descriptionAr ?? '',
      descriptionEn: role.descriptionEn ?? '',
    });
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setEditingRole(null);
    setFormData(EMPTY_FORM);
  };

  const handleSaveRole = async () => {
    setSaving(true);
    try {
      if (editingRole) {
        await put(`/api/v1/roles/${editingRole.id}`, {
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
          descriptionAr: formData.descriptionAr || undefined,
          descriptionEn: formData.descriptionEn || undefined,
        });
        success(t('roleManagement.roleUpdated'));
      } else {
        await post('/api/v1/roles', {
          key: formData.key,
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
          descriptionAr: formData.descriptionAr || undefined,
          descriptionEn: formData.descriptionEn || undefined,
        });
        success(t('roleManagement.roleCreated'));
      }
      closeRoleModal();
      fetchRoles();
    } catch {
      error(t('roleManagement.saveError'));
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Delete helpers                                                          */
  /* ------------------------------------------------------------------------ */

  const openDeleteModal = (role: Role) => {
    if (role.isSystem) {
      error(t('roleManagement.cannotDeleteSystem'));
      return;
    }
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingRole(null);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      await del(`/api/v1/roles/${deletingRole.id}`);
      success(t('roleManagement.roleDeleted'));
      closeDeleteModal();
      fetchRoles();
    } catch {
      error(t('roleManagement.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Permissions helpers                                                     */
  /* ------------------------------------------------------------------------ */

  const openPermissionsModal = async (role: Role) => {
    setPermissionsRole(role);
    setShowPermissionsModal(true);
    setLoadingPermissions(true);

    try {
      const [grouped, assigned] = await Promise.all([
        get<Record<string, Permission[]>>('/api/v1/permissions'),
        get<Permission[]>(`/api/v1/roles/${role.id}/permissions`),
      ]);
      setAllPermissionsGrouped(grouped);
      setSelectedPermissionIds(new Set(assigned.map((p) => p.id)));
    } catch {
      error(t('roleManagement.permissionsError'));
    } finally {
      setLoadingPermissions(false);
    }
  };

  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setPermissionsRole(null);
    setAllPermissionsGrouped({});
    setSelectedPermissionIds(new Set());
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (categoryPermissions: Permission[]) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const allSelected = categoryPermissions.every((p) => next.has(p.id));
      categoryPermissions.forEach((p) => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const selectAllPermissions = () => {
    const allIds = Object.values(allPermissionsGrouped)
      .flat()
      .map((p) => p.id);
    setSelectedPermissionIds(new Set(allIds));
  };

  const deselectAllPermissions = () => {
    setSelectedPermissionIds(new Set());
  };

  const handleSavePermissions = async () => {
    if (!permissionsRole) return;
    setSavingPermissions(true);
    try {
      await put(`/api/v1/roles/${permissionsRole.id}/permissions`, {
        permissionIds: Array.from(selectedPermissionIds),
      });
      success(t('roleManagement.permissionsUpdated'));
      closePermissionsModal();
    } catch {
      error(t('roleManagement.permissionsError'));
    } finally {
      setSavingPermissions(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Table columns                                                           */
  /* ------------------------------------------------------------------------ */

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: t('roleManagement.roleName'),
      render: (role) => (
        <div className="flex items-center gap-2">
          {role.isSystem && (
            <IconLock className="h-4 w-4 shrink-0 text-amber-500" />
          )}
          <span className="font-medium">
            {isRtl ? role.nameAr : role.nameEn}
          </span>
        </div>
      ),
    },
    {
      key: 'key',
      header: t('roleManagement.roleKey'),
      render: (role) => (
        <code className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {role.key}
        </code>
      ),
    },
    {
      key: 'type',
      header: t('roleManagement.type'),
      render: (role) =>
        role.isSystem ? (
          <Badge variant="warning">{t('roleManagement.system')}</Badge>
        ) : (
          <Badge variant="info">{t('roleManagement.custom')}</Badge>
        ),
    },
    {
      key: 'status',
      header: t('roleManagement.status'),
      render: (role) =>
        role.isActive ? (
          <Badge variant="success">
            <IconCheck className="mr-1 inline h-3 w-3" />
            {t('roleManagement.active')}
          </Badge>
        ) : (
          <Badge variant="default">
            {t('roleManagement.inactive')}
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (role) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(role)}
            title={t('roleManagement.editRole')}
          >
            <IconPencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPermissionsModal(role)}
            title={t('roleManagement.managePermissions')}
          >
            <IconShield className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(role)}
            disabled={role.isSystem}
            title={
              role.isSystem
                ? t('roleManagement.cannotDeleteSystem')
                : t('roleManagement.deleteRole')
            }
            className={role.isSystem ? 'cursor-not-allowed opacity-40' : 'text-red-500 hover:text-red-700'}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <PageHeader
        title={t('roleManagement.title')}
        description={t('roleManagement.description')}
        actions={
          <Button onClick={openCreateModal}>
            <IconPlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('roleManagement.createRole')}
          </Button>
        }
      />

      {/* ---- Data table ---- */}
      <Card>
        <CardBody>
          <DataTable<Role>
            columns={columns}
            data={roles}
            loading={loading}
            keyExtractor={(role) => role.id}
            emptyIcon={<IconRoles className="mx-auto h-12 w-12 text-gray-400" />}
            emptyTitle={t('roleManagement.noRoles')}
            emptyDescription={t('roleManagement.noRolesDesc')}
          />
        </CardBody>

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
            <p className="text-xs text-neutral-500">
              {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} / ${total}`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                &laquo;
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                &raquo;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ================================================================== */}
      {/*  Create / Edit Role Modal                                          */}
      {/* ================================================================== */}
      <Modal
        open={showRoleModal}
        onClose={closeRoleModal}
        title={editingRole ? t('roleManagement.editRole') : t('roleManagement.createRole')}
      >
        <div className="space-y-4">
          {/* Key — only shown when creating */}
          {!editingRole && (
            <Input
              label={t('roleManagement.roleKey')}
              value={formData.key}
              onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
              placeholder="e.g. project_manager"
              required
            />
          )}

          <Input
            label={t('roleManagement.nameAr')}
            value={formData.nameAr}
            onChange={(e) => setFormData((prev) => ({ ...prev, nameAr: e.target.value }))}
            dir="rtl"
            required
          />

          <Input
            label={t('roleManagement.nameEn')}
            value={formData.nameEn}
            onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
            dir="ltr"
            required
          />

          <Input
            label={t('roleManagement.descriptionAr')}
            value={formData.descriptionAr}
            onChange={(e) => setFormData((prev) => ({ ...prev, descriptionAr: e.target.value }))}
            dir="rtl"
          />

          <Input
            label={t('roleManagement.descriptionEn')}
            value={formData.descriptionEn}
            onChange={(e) => setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))}
            dir="ltr"
          />

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeRoleModal} disabled={saving}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={saving || !formData.nameAr || !formData.nameEn || (!editingRole && !formData.key)}
              loading={saving}
            >
              {editingRole
                ? (t('actions.save') ?? 'Save')
                : (t('roleManagement.createRole'))}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/*  Delete Confirmation Modal                                         */}
      {/* ================================================================== */}
      <Modal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        title={t('roleManagement.deleteRole')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {t('roleManagement.confirmDelete')}{' '}
            <strong>{deletingRole && (isRtl ? deletingRole.nameAr : deletingRole.nameEn)}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDeleteModal} disabled={deleting}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteRole}
              loading={deleting}
              disabled={deleting}
            >
              {t('roleManagement.deleteRole')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/*  Manage Permissions Modal                                          */}
      {/* ================================================================== */}
      <Modal
        open={showPermissionsModal}
        onClose={closePermissionsModal}
        title={`${t('roleManagement.managePermissions')} — ${
          permissionsRole ? (isRtl ? permissionsRole.nameAr : permissionsRole.nameEn) : ''
        }`}
        className="sm:max-w-2xl lg:max-w-3xl"
      >
        <div className="space-y-4">
          {/* Select All / Deselect All */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAllPermissions}>
              <IconCheck className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t('roleManagement.selectAll')}
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllPermissions}>
              {t('roleManagement.deselectAll')}
            </Button>

            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {selectedPermissionIds.size} / {Object.values(allPermissionsGrouped).flat().length}{' '}
              {t('roleManagement.permissionsCount')}
            </span>
          </div>

          {/* Grouped permissions */}
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(allPermissionsGrouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, perms]) => {
                  const sorted = [...perms].sort((a, b) => a.sortOrder - b.sortOrder);
                  const allSelected = sorted.every((p) => selectedPermissionIds.has(p.id));
                  const someSelected = sorted.some((p) => selectedPermissionIds.has(p.id));

                  return (
                    <Card key={category}>
                      <CardBody>
                        {/* Category header */}
                        <div className="mb-3 flex items-center gap-2">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={() => toggleCategory(sorted)}
                            />
                            <span className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                              {category}
                            </span>
                          </label>

                          <Badge variant="default" className="ml-auto">
                            {sorted.filter((p) => selectedPermissionIds.has(p.id)).length}/{sorted.length}
                          </Badge>
                        </div>

                        {/* Individual permissions */}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {sorted.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                checked={selectedPermissionIds.has(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {isRtl ? perm.nameAr : perm.nameEn}
                              </span>
                            </label>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closePermissionsModal} disabled={savingPermissions}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleSavePermissions}
              loading={savingPermissions}
              disabled={savingPermissions}
            >
              {t('actions.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
