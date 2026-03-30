import React, { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Avatar, Badge, DataList, Input, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { useDebounce } from '../../hooks/useDebounce';
import type { AdminUser, PagedResponse } from '../../api/types';

/* ---- Component ---- */

export function UsersListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const activeParam = filterStatus === 'active' ? '&isActive=true' : filterStatus === 'inactive' ? '&isActive=false' : '';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch, filterStatus],
    queryFn: () => api.get<PagedResponse<AdminUser>>(
      `/api/v1/users?page=${page}&pageSize=20&search=${encodeURIComponent(debouncedSearch)}${activeParam}`,
    ),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const statusSegments = [
    { key: 'all', label: t('admin.allUsers') },
    { key: 'active', label: t('admin.active') },
    { key: 'inactive', label: t('admin.inactive') },
  ];

  const handleLoadMore = () => {
    if (data && data.items.length < data.total) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('admin.usersManagement')}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
          <Input
            placeholder={t('admin.searchUsers')}
            value={search}
            onChangeText={(text: string) => { setSearch(text); setPage(1); }}
            containerStyle={{ flex: 1 }}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter Segments */}
      <SegmentedControl
        segments={statusSegments}
        selected={filterStatus}
        onSelect={(key: string) => { setFilterStatus(key); setPage(1); }}
      />

      {/* Total Count */}
      {data && (
        <Text style={styles.countText}>
          {t('admin.totalUsers', { count: data.total })}
        </Text>
      )}

      {/* Users List */}
      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('admin.noUsersFound')}
        keyExtractor={(item: AdminUser) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }: { item: AdminUser }) => (
          <Pressable
            style={styles.userItem}
            onPress={() => navigation.navigate('UserDetail', { id: item.id })}
          >
            <Avatar name={item.displayName} size={44} />

            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>{item.displayName}</Text>
                <View style={[styles.activeIndicator, { backgroundColor: item.isActive ? theme.colors.success : theme.colors.danger }]} />
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
              <View style={styles.rolesRow}>
                {item.roles.slice(0, 3).map((role) => (
                  <Badge
                    key={role.id}
                    variant="brand"
                    label={isAr ? role.nameAr : role.nameEn}
                    size="sm"
                  />
                ))}
                {item.roles.length > 3 && (
                  <Badge variant="default" label={`+${item.roles.length - 3}`} size="sm" />
                )}
              </View>
            </View>

            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.colors.textMuted} />
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

  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center' },
  searchIcon: { position: 'absolute', start: 12, zIndex: 1 },
  searchInput: { paddingStart: 36 },

  countText: { fontSize: 12, color: theme.colors.textMuted, paddingHorizontal: 16, marginBottom: 8 },

  userItem: {
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
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 15, fontWeight: '600', color: theme.colors.text, flex: 1 },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userEmail: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
});
