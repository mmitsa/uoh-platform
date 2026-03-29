import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Linking, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

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

export function ProfileScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { user } = useAuth();
  const { get, put, post } = useApi();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [prefs, setPrefs] = useState<PreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayNameAr, setDisplayNameAr] = useState('');
  const [displayNameEn, setDisplayNameEn] = useState('');
  const [jobTitleAr, setJobTitleAr] = useState('');
  const [jobTitleEn, setJobTitleEn] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Pref state
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifyByPush, setNotifyByPush] = useState(true);
  const [notifyBySms, setNotifyBySms] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const [p, pf] = await Promise.all([
        get<ProfileData>('/api/v1/profile'),
        get<PreferencesData>('/api/v1/profile/preferences'),
      ]);
      setProfile(p);
      setPrefs(pf);
      setDisplayNameAr(p.displayNameAr);
      setDisplayNameEn(p.displayNameEn);
      setJobTitleAr(p.jobTitleAr ?? '');
      setJobTitleEn(p.jobTitleEn ?? '');
      setDepartment(p.department ?? '');
      setPhoneNumber(p.phoneNumber ?? '');
      setNotifyByEmail(pf.notifyByEmail);
      setNotifyByPush(pf.notifyByPush);
      setNotifyBySms(pf.notifyBySms);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await put('/api/v1/profile', { displayNameAr, displayNameEn, jobTitleAr, jobTitleEn, department, phoneNumber });
      Alert.alert(t('common.success'), t('profile.saved'));
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    try {
      await put('/api/v1/profile/preferences', { notifyByEmail, notifyByPush, notifyBySms });
      Alert.alert(t('common.success'), t('profile.saved'));
    } catch {
      Alert.alert(t('common.error'));
    }
  }

  async function handleChangePassword() {
    try {
      const res = await post<{ url: string }>('/api/v1/profile/change-password');
      await Linking.openURL(res.url);
    } catch {
      Alert.alert(t('common.error'));
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textMuted }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(profile?.displayNameAr || user?.displayName || '?').charAt(0)}</Text>
        </View>
        <Text style={styles.userName}>{profile?.displayNameAr || user?.displayName}</Text>
        <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
        <View style={styles.roleRow}>
          {profile?.roles.map((r) => (
            <View key={r} style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{r}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

        <Text style={styles.fieldLabel}>{t('profile.displayNameAr')}</Text>
        <TextInput style={styles.input} value={displayNameAr} onChangeText={setDisplayNameAr} />

        <Text style={styles.fieldLabel}>{t('profile.displayNameEn')}</Text>
        <TextInput style={styles.input} value={displayNameEn} onChangeText={setDisplayNameEn} />

        <Text style={styles.fieldLabel}>{t('profile.jobTitleAr')}</Text>
        <TextInput style={styles.input} value={jobTitleAr} onChangeText={setJobTitleAr} />

        <Text style={styles.fieldLabel}>{t('profile.jobTitleEn')}</Text>
        <TextInput style={styles.input} value={jobTitleEn} onChangeText={setJobTitleEn} />

        <Text style={styles.fieldLabel}>{t('profile.department')}</Text>
        <TextInput style={styles.input} value={department} onChangeText={setDepartment} />

        <Text style={styles.fieldLabel}>{t('profile.phoneNumber')}</Text>
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

        <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
        <View style={styles.readOnlyField}>
          <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.readOnlyText}>{profile?.email}</Text>
        </View>

        <Text style={styles.fieldLabel}>{t('profile.employeeId')}</Text>
        <View style={styles.readOnlyField}>
          <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.readOnlyText}>{profile?.employeeId || '—'}</Text>
        </View>

        <Pressable style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? t('common.loading') : t('profile.save')}</Text>
        </Pressable>
      </View>

      {/* Security */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('profile.security')}</Text>
        <Pressable style={styles.menuItem} onPress={handleChangePassword}>
          <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.menuText}>{t('profile.changePassword')}</Text>
          <Ionicons name="open-outline" size={16} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      {/* Notification Preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('profile.notifyByEmail')}</Text>
          <Switch value={notifyByEmail} onValueChange={setNotifyByEmail} trackColor={{ true: theme.colors.primary }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('profile.notifyByPush')}</Text>
          <Switch value={notifyByPush} onValueChange={setNotifyByPush} trackColor={{ true: theme.colors.primary }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('profile.notifyBySms')}</Text>
          <Switch value={notifyBySms} onValueChange={setNotifyBySms} trackColor={{ true: theme.colors.primary }} />
        </View>

        <Pressable style={[styles.saveBtn, { marginTop: 8 }]} onPress={savePreferences}>
          <Text style={styles.saveBtnText}>{t('profile.save')}</Text>
        </Pressable>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: theme.colors.primary },
  userName: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  userEmail: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  roleRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: theme.colors.primaryLight },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.colors.text, backgroundColor: theme.colors.background },
  readOnlyField: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.background, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.borderLight },
  readOnlyText: { fontSize: 14, color: theme.colors.textMuted },
  saveBtn: { marginTop: 16, backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  switchLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
});
