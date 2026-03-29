import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import type { CommitteeMember } from '../../api/types';
import { Avatar, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { useAuth } from '../../contexts/AuthContext';

export function CommitteeMembersScreen({ route }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';
  const { id } = route.params as { id: string };
  const qc = useQueryClient();
  const [actionTarget, setActionTarget] = useState<CommitteeMember | null>(null);
  const isAdmin = hasRole('SystemAdmin');

  const { data: members, isLoading } = useQuery({
    queryKey: ['committee-members', id],
    queryFn: () => api.get<CommitteeMember[]>(`/api/v1/committees/${id}/members`),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.del(`/api/v1/committees/${id}/members/${memberId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['committee-members', id] }); },
    onError: () => Alert.alert(t('errors.generic')),
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: { userObjectId: string; role: string }) =>
      api.put(`/api/v1/committees/${id}/members`, { ...data, displayName: '', email: '', isActive: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['committee-members', id] }); },
    onError: () => Alert.alert(t('errors.generic')),
  });

  if (isLoading) return <LoadingSpinner />;

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = isAr
      ? { head: 'رئيس', secretary: 'أمين', member: 'عضو', observer: 'مراقب' }
      : { head: 'Head', secretary: 'Secretary', member: 'Member', observer: 'Observer' };
    return labels[role] ?? role;
  };

  const actionOptions = actionTarget ? [
    { label: roleLabel('head'), icon: 'star-outline' as const, onPress: () => changeRoleMutation.mutate({ userObjectId: actionTarget.userObjectId, role: 'head' }) },
    { label: roleLabel('secretary'), icon: 'pencil-outline' as const, onPress: () => changeRoleMutation.mutate({ userObjectId: actionTarget.userObjectId, role: 'secretary' }) },
    { label: roleLabel('member'), icon: 'person-outline' as const, onPress: () => changeRoleMutation.mutate({ userObjectId: actionTarget.userObjectId, role: 'member' }) },
    { label: t('actions.delete'), icon: 'trash-outline' as const, destructive: true, onPress: () => {
      Alert.alert(t('common.confirmDelete'), '', [
        { text: t('common.cancel') },
        { text: t('common.yes'), style: 'destructive', onPress: () => removeMutation.mutate(actionTarget.id) },
      ]);
    }},
  ] : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={members ?? []}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState icon="people-outline" title={t('committees.members')} message={t('common.noData')} />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onLongPress={() => isAdmin && setActionTarget(item)}>
            <Avatar name={item.displayName} size={44} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{item.displayName}</Text>
              <Text style={[styles.email, { color: theme.colors.textMuted }]}>{item.email}</Text>
            </View>
            <Badge variant={item.role === 'head' ? 'success' : item.role === 'secretary' ? 'info' : 'default'}>
              {roleLabel(item.role)}
            </Badge>
          </Pressable>
        )}
      />
      <ActionSheet
        visible={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.displayName}
        options={actionOptions}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.colors.surface, borderRadius: 12, marginBottom: 8 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  email: { fontSize: 12, marginTop: 2 },
});
