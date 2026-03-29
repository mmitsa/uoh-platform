import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { MeetingRoom, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, Input, Select } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

export function RoomBookingScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [buildingFilter, setBuildingFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

  const queryParams: string[] = [];
  if (buildingFilter) queryParams.push(`building=${encodeURIComponent(buildingFilter)}`);
  if (capacityFilter) queryParams.push(`minCapacity=${capacityFilter}`);
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['meeting-rooms', buildingFilter, capacityFilter],
    queryFn: () =>
      api.get<PagedResponse<MeetingRoom>>(`/api/v1/meeting-rooms${queryString}`),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  /* Extract unique buildings for filter */
  const buildings = Array.from(
    new Set((data?.items ?? []).map((r) => r.building).filter(Boolean) as string[]),
  );

  const capacityOptions = [
    { value: '', label: t('rooms.anyCapacity') },
    { value: '5', label: '5+' },
    { value: '10', label: '10+' },
    { value: '20', label: '20+' },
    { value: '50', label: '50+' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('rooms.title')}</Text>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={{ flex: 1 }}>
          <Select
            label={t('rooms.building')}
            value={buildingFilter}
            options={[
              { value: '', label: t('rooms.allBuildings') },
              ...buildings.map((b) => ({ value: b, label: b })),
            ]}
            onChange={setBuildingFilter}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            label={t('rooms.capacity')}
            value={capacityFilter}
            options={capacityOptions}
            onChange={setCapacityFilter}
          />
        </View>
      </View>

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() =>
              navigation.navigate('RoomAvailability', {
                id: item.id,
                name: isAr ? item.nameAr : item.nameEn,
              })
            }
          >
            <View style={styles.roomIcon}>
              <Ionicons name="business-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomName} numberOfLines={1}>
                {isAr ? item.nameAr : item.nameEn}
              </Text>
              <View style={styles.roomMeta}>
                {item.building && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.metaText}>
                      {item.building}
                      {item.floor ? `, ${t('rooms.floor')} ${item.floor}` : ''}
                    </Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={12} color={theme.colors.textMuted} />
                  <Text style={styles.metaText}>{item.capacity}</Text>
                </View>
              </View>
              <View style={styles.featureRow}>
                {item.hasVideoConference && (
                  <Badge variant="info" label={t('rooms.videoConference')} size="sm" />
                )}
                {item.hasProjector && (
                  <Badge variant="brand" label={t('rooms.projector')} size="sm" />
                )}
                {!item.isActive && (
                  <Badge variant="danger" label={t('common.inactive')} size="sm" />
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    filters: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    item: {
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
    roomIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roomName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    roomMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: theme.colors.textMuted },
    featureRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  });
