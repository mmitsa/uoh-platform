import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Card, CardBody, SegmentedControl } from '../../components/ui';

export function ReportsScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [tab, setTab] = useState('committee');

  const segments = [
    { key: 'committee', label: t('reports.committeeActivity') },
    { key: 'attendance', label: t('reports.meetingAttendance') },
    { key: 'tasks', label: t('reports.taskPerformance') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('reports.title')}</Text>
      <SegmentedControl segments={segments} selected={tab} onSelect={setTab} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <CardBody>
            <Text style={styles.hint}>{t('common.noData')}</Text>
          </CardBody>
        </Card>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16 },
  hint: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' },
});
