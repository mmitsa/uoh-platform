import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setLocale } from '../i18n';
import { useTheme, useThemeMode, useThemedStyles } from '../contexts/ThemeContext';
import type { Theme } from '../ui/theme';
import { queryClient } from '../lib/queryClient';

type ThemeMode = 'light' | 'dark' | 'system';

export function SettingsScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { mode, setMode } = useThemeMode();
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<'ar' | 'en'>((i18n.language as 'ar' | 'en') ?? 'ar');

  function selectLang(next: 'ar' | 'en') {
    setLang(next);
    void setLocale(next);
  }

  function clearCache() {
    queryClient.clear();
    Alert.alert(t('common.success'));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.langRow}>
          <Pressable onPress={() => selectLang('ar')} style={[styles.langBtn, lang === 'ar' && styles.langBtnActive]}>
            <Text style={styles.langText}>العربية</Text>
          </Pressable>
          <Pressable onPress={() => selectLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}>
            <Text style={styles.langText}>English</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
        <View style={styles.langRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.langBtn, mode === m && styles.langBtnActive]}>
              <Ionicons
                name={m === 'light' ? 'sunny-outline' : m === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                size={16}
                color={mode === m ? theme.colors.primary : theme.colors.textMuted}
                style={{ marginEnd: 6 }}
              />
              <Text style={styles.langText}>{t(`settings.theme${m.charAt(0).toUpperCase() + m.slice(1)}`)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.menuItem} onPress={clearCache}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          <Text style={[styles.menuText, { color: theme.colors.danger }]}>{t('settings.clearCache')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textMuted} />
          <Text style={styles.menuText}>{t('settings.version')}</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight, marginBottom: 12, overflow: 'hidden' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, paddingHorizontal: 16, paddingTop: 12, textTransform: 'uppercase' },
  langRow: { flexDirection: 'row', gap: 10, padding: 16 },
  langBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  langBtnActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  langText: { fontWeight: '700', color: theme.colors.text },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
  versionText: { fontSize: 14, color: theme.colors.textMuted },
});
