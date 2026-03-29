import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Location } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Card, CardBody, LoadingSpinner } from '../../components/ui';

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

export function LocationDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['location', id],
    queryFn: () => api.get<Location>(`/api/v1/locations/${id}`),
  });

  if (isLoading || !data) return <LoadingSpinner />;

  const title = isAr ? data.nameAr : data.nameEn;
  const altTitle = isAr ? data.nameEn : data.nameAr;
  const description = isAr ? data.descriptionAr : data.descriptionEn;
  const icon = TYPE_ICON[data.type] ?? 'location-outline';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={28} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {altTitle && <Text style={styles.subtitle}>{altTitle}</Text>}
            </View>
          </View>

          <View style={styles.badgeRow}>
            <Badge
              variant={data.isActive ? 'success' : 'default'}
              label={data.isActive ? t('common.active') : t('common.inactive')}
            />
            <Badge
              variant="brand"
              label={t(`locations.types.${data.type}`, data.type)}
            />
          </View>

          {data.building && (
            <>
              <Text style={styles.label}>{t('locations.building')}</Text>
              <Text style={styles.value}>{data.building}</Text>
            </>
          )}

          {data.floor && (
            <>
              <Text style={styles.label}>{t('locations.floor')}</Text>
              <Text style={styles.value}>{data.floor}</Text>
            </>
          )}

          {data.roomNumber && (
            <>
              <Text style={styles.label}>{t('locations.roomNumber')}</Text>
              <Text style={styles.value}>{data.roomNumber}</Text>
            </>
          )}

          {description && (
            <>
              <Text style={styles.label}>{t('locations.description')}</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </>
          )}
        </CardBody>
      </Card>

      {/* Map Placeholder */}
      {(data.latitude != null && data.longitude != null) && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('locations.mapLocation')}</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={40} color={theme.colors.textMuted} />
              <Text style={styles.coordText}>
                {t('locations.latitude')}: {data.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordText}>
                {t('locations.longitude')}: {data.longitude.toFixed(6)}
              </Text>
              {data.mapImageUrl && (
                <Text style={styles.mapUrlText} numberOfLines={1}>
                  {data.mapImageUrl}
                </Text>
              )}
            </View>
          </CardBody>
        </Card>
      )}

      {/* Children Locations */}
      {data.children && data.children.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>
              {t('locations.childLocations')} ({data.children.length})
            </Text>
            {data.children.map((child) => {
              const childIcon = TYPE_ICON[child.type] ?? 'location-outline';
              return (
                <Pressable
                  key={child.id}
                  style={styles.childItem}
                  onPress={() =>
                    navigation.push('LocationDetail', { id: child.id })
                  }
                >
                  <View style={styles.childIconWrapper}>
                    <Ionicons
                      name={childIcon}
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>
                      {isAr ? child.nameAr : child.nameEn}
                    </Text>
                    <Text style={styles.childMeta}>
                      {t(`locations.types.${child.type}`, child.type)}
                    </Text>
                  </View>
                  <Badge
                    variant={child.isActive ? 'success' : 'default'}
                    label={child.isActive ? t('common.active') : t('common.inactive')}
                    size="sm"
                  />
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </CardBody>
        </Card>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 16,
      textTransform: 'uppercase',
    },
    value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
    descriptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },

    /* Map placeholder */
    mapPlaceholder: {
      alignItems: 'center',
      paddingVertical: 24,
      backgroundColor: theme.colors.borderLight,
      borderRadius: theme.radius.sm,
    },
    coordText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    mapUrlText: { fontSize: 11, color: theme.colors.info, marginTop: 8 },

    /* Children */
    childItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    childIconWrapper: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    childName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    childMeta: { fontSize: 11, color: theme.colors.textMuted, marginTop: 1 },
  });
