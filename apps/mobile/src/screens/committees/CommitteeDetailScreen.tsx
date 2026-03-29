import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { CommitteeItem } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

export function CommitteeDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['committee', id],
    queryFn: () => api.get<CommitteeItem>(`/api/v1/committees/${id}`),
  });

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <CardBody>
          <Text style={styles.name}>{isAr ? data.nameAr : data.nameEn}</Text>
          <View style={styles.row}>
            <Badge variant="brand" label={t(`committees.types.${data.type}`, data.type)} />
            <Badge variant={data.status === 'active' ? 'success' : 'default'} label={t(`committees.statuses.${data.status}`, data.status)} />
          </View>
          <Text style={styles.label}>{t('committees.nameAr')}</Text>
          <Text style={styles.value}>{data.nameAr}</Text>
          <Text style={styles.label}>{t('committees.nameEn')}</Text>
          <Text style={styles.value}>{data.nameEn}</Text>
        </CardBody>
      </Card>

      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => navigation.navigate('CommitteeForm', { id })} style={{ flex: 1 }}>{t('actions.edit')}</Button>
        <Button variant="secondary" onPress={() => navigation.navigate('CommitteeMembers', { id })} style={{ flex: 1 }}>{t('committees.members')}</Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, marginTop: 16, textTransform: 'uppercase' },
  value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
