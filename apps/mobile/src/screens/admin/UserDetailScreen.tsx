import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Avatar, Badge, Button, Card, CardBody, LoadingSpinner, Modal, Select } from '../../components/ui';
import type { AdminUser, Role, PagedResponse } from '../../api/types';

/* ---- Component ---- */

export function UserDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { id } = route.params as { id: string };
  const qc = useQueryClient();

  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // Fetch user detail
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get<AdminUser>(`/api/v1/users/${id}`),
  });

  // Fetch all roles for assigning
  const { data: allRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<PagedResponse<Role>>('/api/v1/roles'),
  });

  // Toggle active mutation
  const toggleActiveMut = useMutation({
    mutationFn: () => api.put(`/api/v1/users/${id}/active`, { isActive: !user?.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  // Add role mutation
  const addRoleMut = useMutation({
    mutationFn: (roleId: string) => api.post(`/api/v1/users/${id}/roles`, { roleId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
      setShowAddRole(false);
      setSelectedRoleId('');
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  // Remove role mutation
  const removeRoleMut = useMutation({
    mutationFn: (roleId: string) => api.del(`/api/v1/users/${id}/roles/${roleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleToggleActive = () => {
    const action = user?.isActive ? t('admin.deactivate') : t('admin.activate');
    Alert.alert(
      action,
      t('admin.toggleActiveConfirm', { name: user?.displayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: action, onPress: () => toggleActiveMut.mutate(), style: user?.isActive ? 'destructive' : 'default' },
      ],
    );
  };

  const handleRemoveRole = (roleId: string, roleName: string) => {
    Alert.alert(
      t('admin.removeRole'),
      t('admin.removeRoleConfirm', { role: roleName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.removeRole'), style: 'destructive', onPress: () => removeRoleMut.mutate(roleId) },
      ],
    );
  };

  const handleAddRole = () => {
    if (!selectedRoleId) {
      Alert.alert(t('common.error'), t('admin.selectRole'));
      return;
    }
    addRoleMut.mutate(selectedRoleId);
  };

  if (isLoading || !user) return <LoadingSpinner />;

  const userRoleIds = user.roles.map(r => r.id);
  const availableRoles = (allRoles?.items ?? []).filter(r => !userRoleIds.includes(r.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Profile Header */}
      <Card>
        <CardBody>
          <View style={styles.profileHeader}>
            <Avatar name={user.displayName} size={64} />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: user.isActive ? theme.colors.success : theme.colors.danger }]} />
                <Text style={[styles.statusText, { color: user.isActive ? theme.colors.success : theme.colors.danger }]}>
                  {user.isActive ? t('admin.active') : t('admin.inactive')}
                </Text>
              </View>
            </View>
          </View>
        </CardBody>
      </Card>

      {/* User Details Card */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('admin.userDetails')}</Text>

          <View style={styles.detailRow}>
            <Ionicons name="finger-print-outline" size={18} color={theme.colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>{t('admin.objectId')}</Text>
              <Text style={styles.detailValue} selectable>{user.objectId}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>{t('admin.email')}</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
          </View>

          {user.lastLoginUtc && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('admin.lastLogin')}</Text>
                <Text style={styles.detailValue}>
                  {new Date(user.lastLoginUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}
        </CardBody>
      </Card>

      {/* Roles Card */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <View style={styles.rolesSectionHeader}>
            <Text style={styles.sectionTitle}>{t('admin.roles')}</Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setShowAddRole(true)}
              icon={<Ionicons name="add" size={14} color={theme.colors.primary} />}
            >
              {t('admin.addRole')}
            </Button>
          </View>

          {user.roles.length === 0 ? (
            <Text style={styles.noRolesText}>{t('admin.noRoles')}</Text>
          ) : (
            user.roles.map((role) => (
              <View key={role.id} style={styles.roleItem}>
                <View style={styles.roleIconWrap}>
                  <Ionicons name="shield-checkmark" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleName}>{isAr ? role.nameAr : role.nameEn}</Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleRemoveRole(role.id, isAr ? role.nameAr : role.nameEn)}
                  loading={removeRoleMut.isPending}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
                </Button>
              </View>
            ))
          )}
        </CardBody>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant={user.isActive ? 'danger' : 'primary'}
          onPress={handleToggleActive}
          loading={toggleActiveMut.isPending}
          icon={<Ionicons name={user.isActive ? 'close-circle' : 'checkmark-circle'} size={18} color="#fff" />}
          style={{ flex: 1 }}
        >
          {user.isActive ? t('admin.deactivateUser') : t('admin.activateUser')}
        </Button>
      </View>

      {/* Add Role Modal */}
      <Modal
        visible={showAddRole}
        onClose={() => { setShowAddRole(false); setSelectedRoleId(''); }}
        title={t('admin.addRole')}
      >
        <Select
          label={t('admin.selectRole')}
          options={availableRoles.map(r => ({
            value: r.id,
            label: isAr ? r.nameAr : r.nameEn,
          }))}
          value={selectedRoleId}
          onChange={setSelectedRoleId}
          placeholder={t('admin.chooseRole')}
        />
        <View style={styles.modalActions}>
          <Button
            variant="secondary"
            onPress={() => { setShowAddRole(false); setSelectedRoleId(''); }}
            style={{ flex: 1 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onPress={handleAddRole}
            loading={addRoleMut.isPending}
            disabled={!selectedRoleId}
            style={{ flex: 1 }}
          >
            {t('admin.addRole')}
          </Button>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileInfo: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  email: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '500', color: theme.colors.text },

  rolesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  noRolesText: { fontSize: 14, color: theme.colors.textMuted, fontStyle: 'italic' },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  roleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },

  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
