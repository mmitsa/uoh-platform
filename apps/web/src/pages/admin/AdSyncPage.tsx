import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { Card, CardBody, Badge, Alert } from '../../components/ui';
import {
  IconAdmin,
  IconUser,
  IconCheckCircle,
  IconInfo,
  IconSync,
  IconTrash,
  IconPencil,
  IconPlus,
  IconX,
  IconSearch,
  IconLock,
} from '../../components/icons';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AdGroupMapping {
  id: string;
  adGroupId: string;
  adGroupDisplayName: string;
  roleId: string;
  roleName?: string;
  roleNameAr?: string;
  isActive: boolean;
  priority: number;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

interface AdSyncLogEntry {
  id: string;
  syncType: string;
  triggeredByObjectId?: string;
  startedAtUtc: string;
  completedAtUtc?: string;
  status: string;
  totalProcessed: number;
  usersCreated: number;
  usersUpdated: number;
  rolesAssigned: number;
  rolesRemoved: number;
  photosSynced: number;
  errors: number;
  groupId?: string;
}

interface AdGroupSearchResult {
  groupId: string;
  displayName: string;
  description?: string;
}

interface RoleOption {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface PaginatedHistory {
  page: number;
  pageSize: number;
  total: number;
  items: AdSyncLogEntry[];
}

interface AdConnectionSettings {
  ad: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    instance: string;
    domain: string;
    organizerUpn: string;
    hasSecret: boolean;
  };
  sync: {
    scheduledEnabled: boolean;
    intervalMinutes: number;
    batchSize: number;
    syncPhotos: boolean;
    removeUnmappedRoles: boolean;
  };
}

interface ConnectionTestResult {
  success: boolean;
  status: string;
  message: string;
  organizationName?: string;
}

interface ConnectionStatus {
  status: string;
  configured: boolean;
  lastSyncStatus?: string;
  lastSyncTime?: string;
}

type ActiveTab = 'mappings' | 'history' | 'settings';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function AdSyncPage() {
  const { t } = useTranslation();
  const { get, post, put, del } = useApi();

  /* ---- Global state ---- */
  const [activeTab, setActiveTab] = useState<ActiveTab>('mappings');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ---- Mappings state ---- */
  const [mappings, setMappings] = useState<AdGroupMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  /* ---- History state ---- */
  const [history, setHistory] = useState<AdSyncLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(20);
  const [historyTotal, setHistoryTotal] = useState(0);

  /* ---- Modal state: mapping form ---- */
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AdGroupMapping | null>(null);
  const [formGroupId, setFormGroupId] = useState('');
  const [formGroupName, setFormGroupName] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formPriority, setFormPriority] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---- AD group search state ---- */
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<AdGroupSearchResult[]>([]);
  const [groupSearchLoading, setGroupSearchLoading] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const groupSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  /* ---- Roles list for dropdown ---- */
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  /* ---- Sync confirmation modal ---- */
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  /* ---- Settings state ---- */
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  // AD fields
  const [sTenantId, setSTenantId] = useState('');
  const [sClientId, setSClientId] = useState('');
  const [sClientSecret, setSClientSecret] = useState('');
  const [sInstance, setSInstance] = useState('https://login.microsoftonline.com/');
  const [sDomain, setSDomain] = useState('');
  const [sOrganizerUpn, setSOrganizerUpn] = useState('');
  // Sync fields
  const [sScheduledEnabled, setSScheduledEnabled] = useState(false);
  const [sIntervalMinutes, setSIntervalMinutes] = useState(360);
  const [sBatchSize, setSBatchSize] = useState(100);
  const [sSyncPhotos, setSSyncPhotos] = useState(true);
  const [sRemoveUnmappedRoles, setSRemoveUnmappedRoles] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*  Fetch Mappings                                                          */
  /* ------------------------------------------------------------------------ */

  const fetchMappings = useCallback(async () => {
    setMappingsLoading(true);
    try {
      const data = await get<AdGroupMapping[]>('/api/v1/admin/ad-sync/mappings');
      setMappings(data);
    } catch {
      setErrorMsg('Failed to load mappings');
    } finally {
      setMappingsLoading(false);
    }
  }, [get]);

  /* ------------------------------------------------------------------------ */
  /*  Fetch History                                                           */
  /* ------------------------------------------------------------------------ */

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await get<PaginatedHistory>(
        `/api/v1/admin/ad-sync/history?page=${historyPage}&pageSize=${historyPageSize}`,
      );
      setHistory(data.items);
      setHistoryTotal(data.total);
    } catch {
      setErrorMsg('Failed to load sync history');
    } finally {
      setHistoryLoading(false);
    }
  }, [get, historyPage, historyPageSize]);

  /* ------------------------------------------------------------------------ */
  /*  Fetch Roles (for form dropdown)                                         */
  /* ------------------------------------------------------------------------ */

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const data = await get<{ items: RoleOption[] }>('/api/v1/roles?page=1&pageSize=100');
      setRoles(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* roles load silently fails */
    } finally {
      setRolesLoading(false);
    }
  }, [get]);

  /* ------------------------------------------------------------------------ */
  /*  Settings: Fetch / Save / Test                                          */
  /* ------------------------------------------------------------------------ */

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await get<AdConnectionSettings>('/api/v1/admin/ad-sync/settings');
      setSTenantId(data.ad.tenantId);
      setSClientId(data.ad.clientId);
      setSClientSecret(data.ad.clientSecret);
      setSInstance(data.ad.instance || 'https://login.microsoftonline.com/');
      setSDomain(data.ad.domain);
      setSOrganizerUpn(data.ad.organizerUpn);
      setSScheduledEnabled(data.sync.scheduledEnabled);
      setSIntervalMinutes(data.sync.intervalMinutes);
      setSBatchSize(data.sync.batchSize);
      setSSyncPhotos(data.sync.syncPhotos);
      setSRemoveUnmappedRoles(data.sync.removeUnmappedRoles);
    } catch {
      setErrorMsg(t('adSync.settings.loadFailed'));
    } finally {
      setSettingsLoading(false);
    }
  }, [get, t]);

  const fetchConnectionStatus = useCallback(async () => {
    try {
      const data = await get<ConnectionStatus>('/api/v1/admin/ad-sync/connection-status');
      setConnectionStatus(data);
    } catch {
      /* silent */
    }
  }, [get]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setErrorMsg(null);
    try {
      await put('/api/v1/admin/ad-sync/settings', {
        tenantId: sTenantId,
        clientId: sClientId,
        clientSecret: sClientSecret,
        instance: sInstance,
        domain: sDomain,
        organizerUpn: sOrganizerUpn,
        scheduledEnabled: sScheduledEnabled,
        intervalMinutes: sIntervalMinutes,
        batchSize: sBatchSize,
        syncPhotos: sSyncPhotos,
        removeUnmappedRoles: sRemoveUnmappedRoles,
      });
      setSuccessMsg(t('adSync.settings.saved'));
      fetchConnectionStatus();
    } catch {
      setErrorMsg(t('adSync.settings.saveFailed'));
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const result = await post<ConnectionTestResult>('/api/v1/admin/ad-sync/test-connection', {
        tenantId: sTenantId,
        clientId: sClientId,
        clientSecret: sClientSecret,
      });
      setTestResult(result);
    } catch {
      setTestResult({ success: false, status: 'error', message: 'Request failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Effects                                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (activeTab === 'mappings') {
      fetchMappings();
    } else if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'settings') {
      fetchSettings();
      fetchConnectionStatus();
    }
  }, [activeTab, fetchMappings, fetchHistory, fetchSettings, fetchConnectionStatus]);

  /* Close group dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Auto-dismiss success message */
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  /* ------------------------------------------------------------------------ */
  /*  AD Group Search with debounce                                           */
  /* ------------------------------------------------------------------------ */

  const searchGroups = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setGroupSearchResults([]);
        setShowGroupDropdown(false);
        return;
      }
      setGroupSearchLoading(true);
      try {
        const data = await get<AdGroupSearchResult[]>(
          `/api/v1/admin/ad-sync/groups/search?q=${encodeURIComponent(query)}`,
        );
        setGroupSearchResults(data);
        setShowGroupDropdown(true);
      } catch {
        setGroupSearchResults([]);
      } finally {
        setGroupSearchLoading(false);
      }
    },
    [get],
  );

  const handleGroupSearchChange = (value: string) => {
    setGroupSearchQuery(value);
    setFormGroupId('');
    setFormGroupName('');

    if (groupSearchTimerRef.current) {
      clearTimeout(groupSearchTimerRef.current);
    }
    groupSearchTimerRef.current = setTimeout(() => {
      searchGroups(value);
    }, 350);
  };

  const selectGroup = (group: AdGroupSearchResult) => {
    setFormGroupId(group.groupId);
    setFormGroupName(group.displayName);
    setGroupSearchQuery(group.displayName);
    setShowGroupDropdown(false);
    setGroupSearchResults([]);
  };

  /* ------------------------------------------------------------------------ */
  /*  Mapping CRUD                                                            */
  /* ------------------------------------------------------------------------ */

  const openAddMapping = () => {
    setEditingMapping(null);
    setFormGroupId('');
    setFormGroupName('');
    setGroupSearchQuery('');
    setFormRoleId('');
    setFormPriority(0);
    setFormIsActive(true);
    setGroupSearchResults([]);
    setShowGroupDropdown(false);
    setShowMappingModal(true);
    fetchRoles();
  };

  const openEditMapping = (mapping: AdGroupMapping) => {
    setEditingMapping(mapping);
    setFormGroupId(mapping.adGroupId);
    setFormGroupName(mapping.adGroupDisplayName);
    setGroupSearchQuery(mapping.adGroupDisplayName);
    setFormRoleId(mapping.roleId);
    setFormPriority(mapping.priority);
    setFormIsActive(mapping.isActive);
    setGroupSearchResults([]);
    setShowGroupDropdown(false);
    setShowMappingModal(true);
    fetchRoles();
  };

  const closeMappingModal = () => {
    setShowMappingModal(false);
    setEditingMapping(null);
  };

  const handleSaveMapping = async () => {
    if (!formGroupId || !formRoleId) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        adGroupId: formGroupId,
        adGroupDisplayName: formGroupName,
        roleId: formRoleId,
        priority: formPriority,
        isActive: formIsActive,
      };
      if (editingMapping) {
        await put(`/api/v1/admin/ad-sync/mappings/${editingMapping.id}`, payload);
      } else {
        await post('/api/v1/admin/ad-sync/mappings', payload);
      }
      setSuccessMsg(editingMapping ? 'Mapping updated' : 'Mapping created');
      closeMappingModal();
      fetchMappings();
    } catch {
      setErrorMsg('Failed to save mapping');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!window.confirm(t('adSync.deleteConfirm'))) return;
    try {
      await del(`/api/v1/admin/ad-sync/mappings/${id}`);
      setSuccessMsg('Mapping deleted');
      fetchMappings();
    } catch {
      setErrorMsg('Failed to delete mapping');
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Run Sync                                                                */
  /* ------------------------------------------------------------------------ */

  const handleRunSync = async () => {
    setSyncing(true);
    setErrorMsg(null);
    try {
      await post('/api/v1/admin/ad-sync/run');
      setSuccessMsg(t('adSync.syncStarted'));
      setShowSyncConfirm(false);
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch {
      setErrorMsg('Failed to start sync');
    } finally {
      setSyncing(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  History pagination                                                      */
  /* ------------------------------------------------------------------------ */

  const totalHistoryPages = Math.max(1, Math.ceil(historyTotal / historyPageSize));

  /* ------------------------------------------------------------------------ */
  /*  Badge helpers                                                           */
  /* ------------------------------------------------------------------------ */

  const statusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="success">{t('adSync.completed')}</Badge>;
      case 'running':
        return <Badge variant="info" dot>{t('adSync.running')}</Badge>;
      case 'failed':
        return <Badge variant="danger">{t('adSync.failed')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const syncTypeBadge = (syncType: string) => {
    switch (syncType.toLowerCase()) {
      case 'manual':
        return <Badge variant="brand">{t('adSync.manual')}</Badge>;
      case 'scheduled':
        return <Badge variant="info">{t('adSync.scheduled')}</Badge>;
      default:
        return <Badge>{syncType}</Badge>;
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/*  Header                                                            */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <IconSync className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{t('adSync.title')}</h1>
            <p className="text-sm text-neutral-500">{t('adSync.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSyncConfirm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={syncing}
        >
          <IconSync className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {t('adSync.runSync')}
        </button>
      </div>

      {/* ---- Alerts ---- */}
      {successMsg && (
        <Alert variant="success" dismissible onDismiss={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="danger" dismissible onDismiss={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* ================================================================== */}
      {/*  Tabs                                                              */}
      {/* ================================================================== */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('mappings')}
            className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'mappings'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
            }`}
          >
            <IconAdmin className="h-4 w-4" />
            {t('adSync.mappingsTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
            }`}
          >
            <IconInfo className="h-4 w-4" />
            {t('adSync.historyTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
            }`}
          >
            <IconLock className="h-4 w-4" />
            {t('adSync.settingsTab')}
          </button>
        </nav>
      </div>

      {/* ================================================================== */}
      {/*  Mappings Tab                                                      */}
      {/* ================================================================== */}
      {activeTab === 'mappings' && (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">{t('adSync.mappingsTab')}</h2>
              <button
                type="button"
                onClick={openAddMapping}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                <IconPlus className="h-4 w-4" />
                {t('adSync.addMapping')}
              </button>
            </div>

            {mappingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            ) : mappings.length === 0 ? (
              <div className="py-12 text-center">
                <IconAdmin className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">{t('adSync.noMappings')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {t('adSync.adGroup')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {t('adSync.role')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {t('adSync.priority')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {t('adSync.status')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {t('adSync.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {mappings.map((mapping) => (
                      <tr key={mapping.id} className="transition-colors hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <IconUser className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-900">
                              {mapping.adGroupDisplayName}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge variant="brand">{mapping.roleName ?? mapping.roleId}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                          {mapping.priority}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {mapping.isActive ? (
                            <Badge variant="success" dot>
                              {t('adSync.active')}
                            </Badge>
                          ) : (
                            <Badge variant="default" dot>
                              {t('adSync.inactive')}
                            </Badge>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditMapping(mapping)}
                              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                              title={t('adSync.editMapping')}
                            >
                              <IconPencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMapping(mapping.id)}
                              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title={t('adSync.delete')}
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ================================================================== */}
      {/*  History Tab                                                       */}
      {/* ================================================================== */}
      {activeTab === 'history' && (
        <Card>
          <CardBody>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">{t('adSync.historyTab')}</h2>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center">
                <IconInfo className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">{t('adSync.noHistory')}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.date')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.type')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.triggeredBy')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.status')}
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.processed')}
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.created')}
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.updated')}
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.rolesChanged')}
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.photos')}
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          {t('adSync.errors')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {history.map((entry) => (
                        <tr key={entry.id} className="transition-colors hover:bg-neutral-50">
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-neutral-700">
                            {formatDateTime(entry.startedAtUtc)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {syncTypeBadge(entry.syncType)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-neutral-600">
                            {entry.triggeredByObjectId ?? '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {statusBadge(entry.status)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-neutral-700">
                            {entry.totalProcessed}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-neutral-700">
                            {entry.usersCreated}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-neutral-700">
                            {entry.usersUpdated}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-neutral-700">
                            <span className="text-green-600">+{entry.rolesAssigned}</span>
                            {' / '}
                            <span className="text-red-600">-{entry.rolesRemoved}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-neutral-700">
                            {entry.photosSynced}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm">
                            {entry.errors > 0 ? (
                              <span className="font-medium text-red-600">{entry.errors}</span>
                            ) : (
                              <span className="text-neutral-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalHistoryPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                    <p className="text-sm text-neutral-500">
                      {t('adSync.processed')}: {historyTotal}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage <= 1}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        &laquo;
                      </button>
                      {Array.from({ length: totalHistoryPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalHistoryPages ||
                            Math.abs(p - historyPage) <= 1,
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
                            <span key={`e-${idx}`} className="px-2 text-sm text-neutral-400">
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setHistoryPage(item)}
                              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                historyPage === item
                                  ? 'bg-brand-600 text-white'
                                  : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              {item}
                            </button>
                          ),
                        )}
                      <button
                        type="button"
                        onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                        disabled={historyPage >= totalHistoryPages}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        &raquo;
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* ================================================================== */}
      {/*  Settings Tab                                                      */}
      {/* ================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Connection Status Banner */}
          {connectionStatus && (
            <div
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                connectionStatus.configured
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  connectionStatus.configured ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-medium">
                {connectionStatus.configured
                  ? t('adSync.settings.connected')
                  : t('adSync.settings.notConfigured')}
              </span>
              {connectionStatus.lastSyncTime && (
                <span className="text-sm opacity-75">
                  | {t('adSync.settings.lastSync')}: {formatDateTime(connectionStatus.lastSyncTime)}
                </span>
              )}
            </div>
          )}

          {settingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* AD Connection Settings Card */}
              <Card>
                <CardBody>
                  <h2 className="mb-4 text-lg font-semibold text-neutral-900">
                    {t('adSync.settings.connectionTitle')}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Tenant ID */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700">
                        {t('adSync.settings.tenantId')}
                      </label>
                      <input
                        type="text"
                        value={sTenantId}
                        onChange={(e) => setSTenantId(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    {/* Client ID */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700">
                        {t('adSync.settings.clientId')}
                      </label>
                      <input
                        type="text"
                        value={sClientId}
                        onChange={(e) => setSClientId(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    {/* Client Secret */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700">
                        <IconLock className="mr-1 inline h-3.5 w-3.5 text-neutral-400" />
                        {t('adSync.settings.clientSecret')}
                      </label>
                      <input
                        type="password"
                        value={sClientSecret}
                        onChange={(e) => setSClientSecret(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <p className="mt-1 text-xs text-neutral-400">
                        {t('adSync.settings.secretHint')}
                      </p>
                    </div>
                    {/* Login Instance */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700">
                        {t('adSync.settings.instance')}
                      </label>
                      <input
                        type="url"
                        value={sInstance}
                        onChange={(e) => setSInstance(e.target.value)}
                        placeholder="https://login.microsoftonline.com/"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    {/* Organization Domain */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700">
                        {t('adSync.settings.domain')}
                      </label>
                      <input
                        type="text"
                        value={sDomain}
                        onChange={(e) => setSDomain(e.target.value)}
                        placeholder="university.edu.sa"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    {/* Organizer UPN */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700">
                        {t('adSync.settings.organizerUpn')}
                      </label>
                      <input
                        type="email"
                        value={sOrganizerUpn}
                        onChange={(e) => setSOrganizerUpn(e.target.value)}
                        placeholder="meetings@university.edu.sa"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || !sTenantId || !sClientId}
                      className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-0 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {testingConnection ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      ) : (
                        <IconSync className="h-4 w-4" />
                      )}
                      {testingConnection
                        ? t('adSync.settings.testing')
                        : t('adSync.settings.testConnection')}
                    </button>
                    {testResult && (
                      <span
                        className={`text-sm font-medium ${
                          testResult.success ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {testResult.message}
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Sync Options Card */}
              <Card>
                <CardBody>
                  <h2 className="mb-4 text-lg font-semibold text-neutral-900">
                    {t('adSync.settings.syncOptionsTitle')}
                  </h2>
                  <div className="space-y-4">
                    {/* Scheduled Sync Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          {t('adSync.settings.scheduledSync')}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {t('adSync.settings.scheduledSyncDesc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sScheduledEnabled}
                        onClick={() => setSScheduledEnabled((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          sScheduledEnabled ? 'bg-brand-600' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-0 shadow ring-0 transition-transform ${
                            sScheduledEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Interval Minutes */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700">
                          {t('adSync.settings.intervalMinutes')}
                        </label>
                        <input
                          type="number"
                          value={sIntervalMinutes}
                          onChange={(e) => setSIntervalMinutes(Number(e.target.value))}
                          min={5}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      {/* Batch Size */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700">
                          {t('adSync.settings.batchSize')}
                        </label>
                        <input
                          type="number"
                          value={sBatchSize}
                          onChange={(e) => setSBatchSize(Number(e.target.value))}
                          min={10}
                          max={500}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    {/* Sync Photos Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          {t('adSync.settings.syncPhotos')}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {t('adSync.settings.syncPhotosDesc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sSyncPhotos}
                        onClick={() => setSSyncPhotos((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          sSyncPhotos ? 'bg-brand-600' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-0 shadow ring-0 transition-transform ${
                            sSyncPhotos ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Remove Unmapped Roles Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          {t('adSync.settings.removeUnmappedRoles')}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sRemoveUnmappedRoles}
                        onClick={() => setSRemoveUnmappedRoles((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                          sRemoveUnmappedRoles ? 'bg-red-600' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-0 shadow ring-0 transition-transform ${
                            sRemoveUnmappedRoles ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {sRemoveUnmappedRoles && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {t('adSync.settings.removeRolesWarning')}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Save / Cancel Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fetchSettings}
                  disabled={settingsSaving}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                >
                  {t('actions.cancel') ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {settingsSaving && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {t('adSync.settings.saveSettings')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/*  Add / Edit Mapping Modal                                          */}
      {/* ================================================================== */}
      {showMappingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeMappingModal();
          }}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-neutral-0 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label={editingMapping ? t('adSync.editMapping') : t('adSync.addMapping')}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editingMapping ? t('adSync.editMapping') : t('adSync.addMapping')}
              </h2>
              <button
                type="button"
                onClick={closeMappingModal}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4 px-5 py-4">
              {/* AD Group search */}
              <div ref={groupDropdownRef} className="relative">
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  {t('adSync.adGroup')}
                </label>
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => handleGroupSearchChange(e.target.value)}
                    onFocus={() => {
                      if (groupSearchResults.length > 0) setShowGroupDropdown(true);
                    }}
                    placeholder={t('adSync.searchGroups')}
                    className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {groupSearchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    </div>
                  )}
                </div>

                {/* Selected group indicator */}
                {formGroupId && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                    <IconCheckCircle className="h-3.5 w-3.5" />
                    <span>{formGroupName}</span>
                  </div>
                )}

                {/* Dropdown results */}
                {showGroupDropdown && groupSearchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-0 shadow-lg">
                    {groupSearchResults.map((group) => (
                      <button
                        key={group.groupId}
                        type="button"
                        onClick={() => selectGroup(group)}
                        className="flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                      >
                        <span className="text-sm font-medium text-neutral-900">
                          {group.displayName}
                        </span>
                        {group.description && (
                          <span className="text-xs text-neutral-500">{group.description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Role dropdown */}
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  {t('adSync.role')}
                </label>
                <select
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value)}
                  disabled={rolesLoading}
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="">{rolesLoading ? '...' : `-- ${t('adSync.role')} --`}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nameEn} / {role.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  {t('adSync.priority')}
                </label>
                <input
                  type="number"
                  value={formPriority}
                  onChange={(e) => setFormPriority(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  {t('adSync.active')}
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formIsActive}
                  onClick={() => setFormIsActive((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    formIsActive ? 'bg-brand-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-0 shadow ring-0 transition-transform ${
                      formIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={closeMappingModal}
                  disabled={saving}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                >
                  {t('actions.cancel') ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveMapping}
                  disabled={saving || !formGroupId || !formRoleId}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {t('adSync.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/*  Run Sync Confirmation Modal                                       */}
      {/* ================================================================== */}
      {showSyncConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSyncConfirm(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-neutral-0 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label={t('adSync.runSync')}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">{t('adSync.runSync')}</h2>
              <button
                type="button"
                onClick={() => setShowSyncConfirm(false)}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <p className="text-sm text-neutral-600">{t('adSync.runSyncConfirm')}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSyncConfirm(false)}
                  disabled={syncing}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                >
                  {t('actions.cancel') ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleRunSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {syncing && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <IconSync className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {t('adSync.runSync')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
