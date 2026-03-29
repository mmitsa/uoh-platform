import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../app/auth';
import { useApi } from '../hooks/useApi';
import { useFileUpload } from '../hooks/useFileUpload';
import {
  Card,
  CardBody,
  Badge,
  Alert,
  Button,
  Input,
  Select,
  PageHeader,
} from '../components/ui';
import {
  IconUser,
  IconAdmin as IconSettings,
  IconCheckCircle,
  IconInfo,
  IconLock,
} from '../components/icons';

/* ---------- Types ---------- */

interface ProfileData {
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
  lastLoginAtUtc?: string;
  roles: string[];
}

interface PreferencesData {
  language: string;
  theme: string;
  notifyByEmail: boolean;
  notifyByPush: boolean;
  notifyBySms: boolean;
  emailDigestFrequency: string;
}

/* ---------- Component ---------- */

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { get, put, post } = useApi();
  const { uploading, uploadFiles } = useFileUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- State ---- */
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ---- Data loading ---- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profileRes, prefsRes] = await Promise.all([
          get<ProfileData>('/api/v1/profile'),
          get<PreferencesData>('/api/v1/profile/preferences'),
        ]);
        if (!cancelled) {
          setProfile(profileRes);
          setPreferences(prefsRes);
        }
      } catch {
        if (!cancelled) setErrorMsg('Failed to load profile data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Helpers ---- */
  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  const getInitial = (): string => {
    if (profile?.displayNameAr) return profile.displayNameAr.charAt(0);
    if (profile?.displayNameEn) return profile.displayNameEn.charAt(0);
    if (user?.displayName) return user.displayName.charAt(0);
    return '?';
  };

  /* ---- Avatar upload ---- */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploaded = await uploadFiles(Array.from(files));
      if (uploaded.length > 0) {
        await put('/api/v1/profile/avatar', { fileId: uploaded[0].fileId });
        // Reload profile to get updated avatarUrl
        const updated = await get<ProfileData>('/api/v1/profile');
        setProfile(updated);
        showSuccess(t('profile.saved'));
      }
    } catch {
      setErrorMsg('Failed to upload avatar');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    try {
      await put('/api/v1/profile/avatar', { fileId: null });
      setProfile((prev) => (prev ? { ...prev, avatarUrl: undefined } : prev));
      showSuccess(t('profile.saved'));
    } catch {
      setErrorMsg('Failed to remove avatar');
    }
  };

  /* ---- Profile form ---- */
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleProfileSave = async () => {
    if (!profile) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await put('/api/v1/profile', {
        displayNameAr: profile.displayNameAr,
        displayNameEn: profile.displayNameEn,
        jobTitleAr: profile.jobTitleAr,
        jobTitleEn: profile.jobTitleEn,
        department: profile.department,
        phoneNumber: profile.phoneNumber,
      });
      showSuccess(t('profile.saved'));
    } catch {
      setErrorMsg('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Change password ---- */
  const handleChangePassword = async () => {
    try {
      const res = await post<{ url: string }>('/api/v1/profile/change-password');
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setErrorMsg('Failed to initiate password change');
    }
  };

  /* ---- Preferences ---- */
  const handlePrefChange = <K extends keyof PreferencesData>(
    field: K,
    value: PreferencesData[K],
  ) => {
    setPreferences((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handlePrefsSave = async () => {
    if (!preferences) return;
    setSavingPrefs(true);
    setErrorMsg(null);
    try {
      await put('/api/v1/profile/preferences', preferences);
      showSuccess(t('profile.saved'));
    } catch {
      setErrorMsg('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardBody>
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
              </div>
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardBody>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-neutral-200" />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />

      {/* Success / Error messages */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ========== Profile Card (left / top on mobile) ========== */}
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center gap-4 py-8">
            {/* Avatar */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-neutral-200 transition-all hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              disabled={uploading}
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayNameEn || profile.displayNameAr || ''}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-100 text-3xl font-bold text-brand-700">
                  {getInitial()}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <IconUser className="h-8 w-8 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-0/70">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
                </div>
              )}
            </button>

            {/* Avatar action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                disabled={uploading}
              >
                {t('profile.changePhoto')}
              </Button>
              {profile?.avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  {t('profile.removePhoto')}
                </Button>
              )}
            </div>

            {/* User info */}
            <div className="mt-2 text-center">
              <h2 className="text-lg font-semibold text-neutral-900">
                {profile?.displayNameAr || profile?.displayNameEn || user?.displayName || ''}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">{profile?.email || user?.email}</p>
            </div>

            {/* Role badges */}
            {profile?.roles && profile.roles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {profile.roles.map((role) => (
                  <Badge key={role} variant="brand" dot>
                    {role}
                  </Badge>
                ))}
              </div>
            )}

            {/* Active status */}
            {profile?.isActive && (
              <Badge variant="success" dot>
                <IconCheckCircle className="h-3.5 w-3.5" />
                Active
              </Badge>
            )}
          </CardBody>
        </Card>

        {/* ========== Personal Info Card (right / below on mobile) ========== */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-5 flex items-center gap-2">
              <IconUser className="h-5 w-5 text-brand-700" />
              <h3 className="text-lg font-semibold text-neutral-900">
                {t('profile.personalInfo')}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Display Name AR */}
              <Input
                label={t('profile.displayNameAr')}
                value={profile?.displayNameAr ?? ''}
                onChange={(e) => handleProfileChange('displayNameAr', e.target.value)}
                dir="rtl"
              />

              {/* Display Name EN */}
              <Input
                label={t('profile.displayNameEn')}
                value={profile?.displayNameEn ?? ''}
                onChange={(e) => handleProfileChange('displayNameEn', e.target.value)}
              />

              {/* Job Title AR */}
              <Input
                label={t('profile.jobTitleAr')}
                value={profile?.jobTitleAr ?? ''}
                onChange={(e) => handleProfileChange('jobTitleAr', e.target.value)}
                dir="rtl"
              />

              {/* Job Title EN */}
              <Input
                label={t('profile.jobTitleEn')}
                value={profile?.jobTitleEn ?? ''}
                onChange={(e) => handleProfileChange('jobTitleEn', e.target.value)}
              />

              {/* Department */}
              <Input
                label={t('profile.department')}
                value={profile?.department ?? ''}
                onChange={(e) => handleProfileChange('department', e.target.value)}
              />

              {/* Phone Number */}
              <Input
                label={t('profile.phoneNumber')}
                value={profile?.phoneNumber ?? ''}
                onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                type="tel"
              />

              {/* Email (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <IconLock className="h-3.5 w-3.5 text-neutral-400" />
                  {t('profile.email')}
                </label>
                <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                  {profile?.email ?? ''}
                </div>
                <p className="text-xs text-neutral-400">{t('profile.adManaged')}</p>
              </div>

              {/* Employee ID (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <IconLock className="h-3.5 w-3.5 text-neutral-400" />
                  {t('profile.employeeId')}
                </label>
                <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                  {profile?.employeeId ?? '-'}
                </div>
                <p className="text-xs text-neutral-400">{t('profile.adManaged')}</p>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 flex justify-end">
              <Button onClick={handleProfileSave} loading={saving}>
                {t('profile.save')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ========== Security Card ========== */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center gap-2">
            <IconLock className="h-5 w-5 text-brand-700" />
            <h3 className="text-lg font-semibold text-neutral-900">
              {t('profile.security')}
            </h3>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-600">
                {t('profile.changePasswordDesc')}
              </p>
            </div>
            <Button variant="outline" onClick={handleChangePassword}>
              {t('profile.changePassword')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ========== Preferences Card ========== */}
      <Card>
        <CardBody>
          <div className="mb-5 flex items-center gap-2">
            <IconSettings className="h-5 w-5 text-brand-700" />
            <h3 className="text-lg font-semibold text-neutral-900">
              {t('profile.preferences')}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Language select */}
            <Select
              label={t('profile.language')}
              value={preferences?.language ?? 'ar'}
              onChange={(e) => handlePrefChange('language', e.target.value)}
              options={[
                { value: 'ar', label: 'العربية' },
                { value: 'en', label: 'English' },
              ]}
            />

            {/* Theme select */}
            <Select
              label={t('profile.theme')}
              value={preferences?.theme ?? 'system'}
              onChange={(e) => handlePrefChange('theme', e.target.value)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </div>

          {/* Notification toggles */}
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-medium text-neutral-700">
              <IconInfo className="mb-0.5 me-1.5 inline h-4 w-4 text-neutral-400" />
              Notifications
            </h4>

            <div className="space-y-3">
              {/* Email notifications */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={preferences?.notifyByEmail ?? false}
                  onChange={(e) => handlePrefChange('notifyByEmail', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-sm text-neutral-700">{t('profile.notifyByEmail')}</span>
              </label>

              {/* Push notifications */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={preferences?.notifyByPush ?? false}
                  onChange={(e) => handlePrefChange('notifyByPush', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-sm text-neutral-700">{t('profile.notifyByPush')}</span>
              </label>

              {/* SMS notifications */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={preferences?.notifyBySms ?? false}
                  onChange={(e) => handlePrefChange('notifyBySms', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-sm text-neutral-700">{t('profile.notifyBySms')}</span>
              </label>
            </div>
          </div>

          {/* Email Digest Frequency */}
          <div className="mt-6 max-w-sm">
            <Select
              label={t('profile.emailDigest')}
              value={preferences?.emailDigestFrequency ?? 'none'}
              onChange={(e) => handlePrefChange('emailDigestFrequency', e.target.value)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
              ]}
            />
          </div>

          {/* Save button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handlePrefsSave} loading={savingPrefs}>
              {t('profile.save')}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
