import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Card, CardBody } from '../../components/ui';

export function WorkflowDetailScreen({ route }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <CardBody>
          <Text style={styles.title}>{t('workflow.detail')}</Text>
          <Text style={styles.hint}>{t('workflow.steps')}</Text>
        </CardBody>
      </Card>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  hint: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8 },
});
