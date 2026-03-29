import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import type { Theme } from '../ui/theme';
import { Button, Input } from '../components/ui';
import type { AppRole } from '../api/types';

const DEMO_ROLES: AppRole[] = ['SystemAdmin', 'CommitteeHead', 'CommitteeSecretary', 'CommitteeMember', 'Observer'];

export function LoginScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { login, demoLogin, biometricLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'demo'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch {
      Alert.alert(t('errors.generic'), t('auth.loginFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async (role: AppRole) => {
    setBusy(true);
    try {
      await demoLogin(role);
    } catch {
      Alert.alert(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const handleBiometric = async () => {
    setBusy(true);
    try {
      await biometricLogin();
    } catch {
      Alert.alert(t('errors.generic'), 'Biometric authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Ionicons name="people-circle-outline" size={64} color={theme.colors.primary} />
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable onPress={() => setTab('login')} style={[styles.tab, tab === 'login' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>{t('auth.login')}</Text>
            </Pressable>
            <Pressable onPress={() => setTab('demo')} style={[styles.tab, tab === 'demo' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'demo' && styles.tabTextActive]}>{t('auth.demoMode')}</Text>
            </Pressable>
          </View>

          {tab === 'login' ? (
            <View style={styles.form}>
              <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry containerStyle={{ marginTop: 12 }} />
              <Button onPress={handleLogin} loading={busy} style={{ marginTop: 20 }}>{t('auth.login')}</Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button variant="secondary" onPress={handleBiometric} icon={<Ionicons name="finger-print" size={20} color={theme.colors.primary} />}>
                {t('auth.biometric')}
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.demoHint}>{t('auth.selectRole')}</Text>
              {DEMO_ROLES.map(role => (
                <Pressable key={role} onPress={() => handleDemo(role)} disabled={busy}
                  style={({ pressed }) => [styles.roleBtn, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.roleText}>{t(`auth.roles.${role}`)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, marginTop: 12 },
  tagline: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.borderLight, overflow: 'hidden' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 15, fontWeight: '500', color: theme.colors.textMuted },
  tabTextActive: { color: theme.colors.primary, fontWeight: '700' },
  form: { padding: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: theme.colors.textMuted },
  demoHint: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12, textAlign: 'center' },
  roleBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: theme.radius.sm, backgroundColor: theme.colors.background, marginBottom: 8 },
  roleText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
});
