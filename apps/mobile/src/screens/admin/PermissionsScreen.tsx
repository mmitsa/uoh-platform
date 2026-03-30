import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, LoadingSpinner, Badge } from '../../components/ui';
import type { Permission, Role } from '../../api/types';

/* ---- Types ---- */

interface RolePermissions {
  roleId: string;
  permissionIds: string[];
}

interface GroupedPermissions {
  category: string;
  permissions: Permission[];
}

/* ---- Helpers ---- */

function groupByCategory(permissions: Permission[]): GroupedPermissions[] {
  const map = new Map<string, Permission[]>();
  for (const p of permissions) {
    const existing = map.get(p.category) ?? [];
    existing.push(p);
    map.set(p.category, existing);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, permissions]) => ({ category, permissions }));
}

/* ---- Component ---- */

export function PermissionsScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { roleId } = route.params as { roleId: string };
  const qc = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch role info
  const { data: role } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => api.get<Role>(`/api/v1/roles/${roleId}`),
  });

  // Fetch role permissions
  const { data: rolePerms, isLoading: rolePermsLoading } = useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => api.get<RolePermissions>(`/api/v1/roles/${roleId}/permissions`),
  });

  // Fetch all permissions
  const { data: allPermissions, isLoading: allPermsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get<Permission[]>('/api/v1/permissions'),
  });

  // Initialize selected IDs from role permissions
  useEffect(() => {
    if (rolePerms) {
      setSelectedIds(new Set(rolePerms.permissionIds));
      setHasChanges(false);
    }
  }, [rolePerms]);

  // Save mutation
  const saveMut = useMutation({
    mutationFn: (permissionIds: string[]) =>
      api.put(`/api/v1/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-permissions', roleId] });
      setHasChanges(false);
      Alert.alert(t('common.success'), t('admin.permissionsSaved'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const togglePermission = useCallback((permId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      setHasChanges(true);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const toggleAllInCategory = useCallback((permissions: Permission[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = permissions.every(p => next.has(p.id));
      for (const p of permissions) {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      }
      setHasChanges(true);
      return next;
    });
  }, []);

  const handleSave = () => {
    saveMut.mutate(Array.from(selectedIds));
  };

  if (rolePermsLoading || allPermsLoading) return <LoadingSpinner />;

  const grouped = groupByCategory(allPermissions ?? []);
  const totalPermissions = allPermissions?.length ?? 0;
  const selectedCount = selectedIds.size;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <Card>
          <CardBody>
            <Text style={styles.roleName}>
              {role ? (isAr ? role.nameAr : role.nameEn) : '...'}
            </Text>
            {role?.key && (
              <Text style={styles.roleKey}>{role.key}</Text>
            )}
            <View style={styles.headerBadges}>
              {role?.isBuiltIn && <Badge variant="brand" label={t('admin.builtIn')} size="sm" />}
              <Badge variant="info" label={`${selectedCount}/${totalPermissions} ${t('admin.permissions')}`} size="sm" />
            </View>
          </CardBody>
        </Card>

        {/* Permission Groups */}
        {grouped.map((group) => {
          const isExpanded = expandedCategories.has(group.category);
          const allSelected = group.permissions.every(p => selectedIds.has(p.id));
          const someSelected = group.permissions.some(p => selectedIds.has(p.id));
          const groupSelectedCount = group.permissions.filter(p => selectedIds.has(p.id)).length;

          return (
            <Card key={group.category} style={{ marginTop: 12 }}>
              <CardBody>
                {/* Category Header */}
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(group.category)}
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                  <Text style={styles.categoryTitle}>{group.category}</Text>
                  <Text style={styles.categoryCount}>
                    {groupSelectedCount}/{group.permissions.length}
                  </Text>
                  <Pressable
                    onPress={() => toggleAllInCategory(group.permissions)}
                    style={styles.selectAllBtn}
                  >
                    <Ionicons
                      name={allSelected ? 'checkbox' : someSelected ? 'remove-circle' : 'square-outline'}
                      size={22}
                      color={allSelected || someSelected ? theme.colors.primary : theme.colors.textMuted}
                    />
                  </Pressable>
                </Pressable>

                {/* Permissions List */}
                {isExpanded && (
                  <View style={styles.permissionsList}>
                    {group.permissions.map((perm) => {
                      const isChecked = selectedIds.has(perm.id);
                      return (
                        <Pressable
                          key={perm.id}
                          style={styles.permissionItem}
                          onPress={() => togglePermission(perm.id)}
                        >
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isChecked ? theme.colors.primary : theme.colors.textMuted}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.permissionName}>
                              {isAr ? perm.nameAr : perm.nameEn}
                            </Text>
                            <Text style={styles.permissionKey}>{perm.key}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </CardBody>
            </Card>
          );
        })}
      </ScrollView>

      {/* Sticky Save Button */}
      {hasChanges && (
        <View style={styles.saveBar}>
          <Button
            variant="primary"
            onPress={handleSave}
            loading={saveMut.isPending}
            icon={<Ionicons name="save" size={18} color="#fff" />}
            style={{ flex: 1 }}
            size="lg"
          >
            {t('admin.savePermissions')}
          </Button>
        </View>
      )}
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  roleName: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  roleKey: { fontSize: 13, fontFamily: 'monospace', color: theme.colors.textMuted, marginTop: 4 },
  headerBadges: { flexDirection: 'row', gap: 8, marginTop: 10 },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1 },
  categoryCount: { fontSize: 12, color: theme.colors.textMuted, marginEnd: 8 },
  selectAllBtn: { padding: 4 },

  permissionsList: { marginTop: 12, gap: 2 },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  permissionName: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  permissionKey: { fontSize: 11, fontFamily: 'monospace', color: theme.colors.textMuted, marginTop: 2 },

  saveBar: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
});
