import React, { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Location } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

/* ---- Helpers ---- */

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  building: 'business-outline',
  hall: 'home-outline',
  meeting_room: 'people-outline',
  lab: 'flask-outline',
  auditorium: 'mic-outline',
  department: 'layers-outline',
  outdoor_area: 'leaf-outline',
  gate: 'enter-outline',
  library: 'library-outline',
  cafeteria: 'cafe-outline',
  parking: 'car-outline',
  other: 'location-outline',
};

function flattenLocations(locations: Location[], depth = 0): Array<Location & { depth: number }> {
  const result: Array<Location & { depth: number }> = [];
  for (const loc of locations) {
    result.push({ ...loc, depth });
    if (loc.children && loc.children.length > 0) {
      result.push(...flattenLocations(loc.children, depth + 1));
    }
  }
  return result;
}

/* ---- Component ---- */

export function LocationsListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get<Location[]>('/api/v1/locations'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /* Build visible list based on expanded state */
  function getVisibleLocations(locations: Location[], depth = 0): Array<Location & { depth: number }> {
    const result: Array<Location & { depth: number }> = [];
    for (const loc of locations) {
      result.push({ ...loc, depth });
      if (loc.children && loc.children.length > 0 && expandedIds.has(loc.id)) {
        result.push(...getVisibleLocations(loc.children, depth + 1));
      }
    }
    return result;
  }

  const visibleLocations = data ? getVisibleLocations(data) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locations.title')}</Text>

      <DataList
        data={visibleLocations}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedIds.has(item.id);
          const icon = TYPE_ICON[item.type] ?? 'location-outline';

          return (
            <Pressable
              style={[styles.item, { marginStart: 16 + item.depth * 20 }]}
              onPress={() => navigation.navigate('LocationDetail', { id: item.id })}
            >
              {hasChildren && (
                <Pressable onPress={() => toggleExpand(item.id)} hitSlop={8}>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              )}
              {!hasChildren && <View style={{ width: 18 }} />}

              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Ionicons name={icon} size={18} color={theme.colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {isAr ? item.nameAr : item.nameEn}
                </Text>
                <View style={styles.metaRow}>
                  <Badge
                    variant={item.isActive ? 'success' : 'default'}
                    label={item.isActive ? t('common.active') : t('common.inactive')}
                    size="sm"
                  />
                  <Text style={styles.meta}>
                    {t(`locations.types.${item.type}`, item.type)}
                  </Text>
                  {item.building && (
                    <Text style={styles.meta}>{item.building}</Text>
                  )}
                  {item.floor && (
                    <Text style={styles.meta}>
                      {t('locations.floor')} {item.floor}
                    </Text>
                  )}
                </View>
              </View>

              <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.colors.textMuted} />
            </Pressable>
          );
        }}
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
      paddingBottom: 8,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginEnd: 16,
      marginTop: 6,
      padding: 12,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      gap: 8,
    },
    iconWrapper: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    metaRow: { flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' },
    meta: { fontSize: 11, color: theme.colors.textMuted },
  });
