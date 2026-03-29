import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import type { Role, PagedResponse } from '../../api/types';

/* ---- Component ---- */

export function RolesScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<PagedResponse<Role>>('/api/v1/roles'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('admin.roles')}</Text>

      {/* Role Count */}
      {data && (
        <Text style={styles.countText}>
          {t('admin.totalRoles', { count: data.items.length })}
        </Text>
      )}

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('admin.noRoles')}
        keyExtractor={(item: Role) => item.id}
        renderItem={({ item }: { item: Role }) => (
          <Pressable
            style={styles.roleItem}
            onPress={() => navigation.navigate('Permissions', { roleId: item.id })}
          >
            <View style={styles.roleIconWrap}>
              <Ionicons
                name={item.isBuiltIn ? 'shield' : 'shield-half'}
                size={22}
                color={item.isBuiltIn ? theme.colors.primary : theme.colors.accent}
              />
            </View>

            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>{isAr ? item.nameAr : item.nameEn}</Text>
              <Text style={styles.roleKey}>{item.key}</Text>

              <View style={styles.badgeRow}>
                {item.isBuiltIn && (
                  <Badge variant="brand" label={t('admin.builtIn')} size="sm" />
                )}
                <Badge
                  variant={item.isActive ? 'success' : 'default'}
                  label={item.isActive ? t('admin.active') : t('admin.inactive')}
                  size="sm"
                />
              </View>

              {(isAr ? item.descriptionAr : item.descriptionEn) ? (
                <Text style={styles.roleDescription} numberOfLines={2}>
                  {isAr ? item.descriptionAr : item.descriptionEn}
                </Text>
              ) : null}
            </View>

            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16, paddingBottom: 8 },
  countText: { fontSize: 12, color: theme.colors.textMuted, paddingHorizontal: 16, marginBottom: 8 },

  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: { flex: 1 },
  roleName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  roleKey: { fontSize: 12, fontFamily: 'monospace', color: theme.colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  roleDescription: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
