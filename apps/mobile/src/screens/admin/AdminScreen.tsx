import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Card, CardBody } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

export function AdminScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{t('admin.title')}</Text>
      <Card>
        <CardBody>
          <Text style={styles.label}>{t('admin.identity')}</Text>
          <Text style={styles.value}>{user?.displayName}</Text>
          <Text style={styles.value}>{user?.email}</Text>
          <Text style={styles.value}>{user?.roles.join(', ')}</Text>
        </CardBody>
      </Card>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  value: { fontSize: 15, color: theme.colors.text, marginBottom: 4 },
});
