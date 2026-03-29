import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, DataList, Fab, Input, Modal, Select } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import type { Announcement, PagedResponse } from '../../api/types';

/* ---- Types ---- */

interface AnnouncementForm {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type: 'circular' | 'news' | 'announcement';
}

const EMPTY_FORM: AnnouncementForm = {
  titleAr: '',
  titleEn: '',
  bodyAr: '',
  bodyEn: '',
  type: 'announcement',
};

/* ---- Helpers ---- */

function typeVariant(type: string) {
  switch (type) {
    case 'circular': return 'brand' as const;
    case 'news': return 'info' as const;
    case 'announcement': return 'warning' as const;
    default: return 'default' as const;
  }
}

function typeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'circular': return 'document-text';
    case 'news': return 'newspaper';
    case 'announcement': return 'megaphone';
    default: return 'megaphone';
  }
}

/* ---- Component ---- */

export function AnnouncementsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => api.get<PagedResponse<Announcement>>('/api/v1/announcements'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  // Create mutation
  const createMut = useMutation({
    mutationFn: (body: AnnouncementForm) => api.post('/api/v1/announcements', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  // Toggle active mutation
  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/api/v1/announcements/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleCreate = () => {
    if (!form.titleAr.trim() || !form.titleEn.trim() || !form.bodyAr.trim() || !form.bodyEn.trim()) {
      Alert.alert(t('common.error'), t('admin.fillAllFields'));
      return;
    }
    createMut.mutate(form);
  };

  const handleToggleActive = (item: Announcement) => {
    const action = item.isActive ? t('admin.deactivate') : t('admin.activate');
    Alert.alert(
      action,
      t('admin.toggleAnnouncementConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: action,
          onPress: () => toggleActiveMut.mutate({ id: item.id, isActive: !item.isActive }),
        },
      ],
    );
  };

  const typeOptions = [
    { value: 'circular', label: t('announcements.types.circular') },
    { value: 'news', label: t('announcements.types.news') },
    { value: 'announcement', label: t('announcements.types.announcement') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('admin.announcements')}</Text>

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('admin.noAnnouncements')}
        keyExtractor={(item: Announcement) => item.id}
        renderItem={({ item }: { item: Announcement }) => (
          <Card style={{ marginHorizontal: 16, marginTop: 8 }}>
            <CardBody>
              {/* Header Row */}
              <View style={styles.itemHeader}>
                <View style={[styles.typeIconWrap, { backgroundColor: `${typeVariant(item.type) === 'brand' ? theme.colors.primary : typeVariant(item.type) === 'info' ? theme.colors.info : theme.colors.warning}18` }]}>
                  <Ionicons
                    name={typeIcon(item.type)}
                    size={20}
                    color={typeVariant(item.type) === 'brand' ? theme.colors.primary : typeVariant(item.type) === 'info' ? theme.colors.info : theme.colors.warning}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {isAr ? item.titleAr : item.titleEn}
                  </Text>
                  <Text style={styles.itemDate}>
                    {new Date(item.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgeRow}>
                <Badge variant={typeVariant(item.type)} label={t(`announcements.types.${item.type}`, item.type)} size="sm" />
                <Badge
                  variant={item.isActive ? 'success' : 'default'}
                  label={item.isActive ? t('admin.active') : t('admin.inactive')}
                  size="sm"
                />
              </View>

              {/* Body Preview */}
              <Text style={styles.itemBody} numberOfLines={2}>
                {isAr ? item.bodyAr : item.bodyEn}
              </Text>

              {/* Toggle Button */}
              <View style={styles.itemActions}>
                <Button
                  variant={item.isActive ? 'danger' : 'primary'}
                  size="sm"
                  onPress={() => handleToggleActive(item)}
                  loading={toggleActiveMut.isPending}
                  icon={<Ionicons name={item.isActive ? 'eye-off' : 'eye'} size={14} color="#fff" />}
                >
                  {item.isActive ? t('admin.deactivate') : t('admin.activate')}
                </Button>
              </View>
            </CardBody>
          </Card>
        )}
      />

      {/* FAB to create */}
      <Fab icon="add" onPress={() => setShowForm(true)} />

      {/* Create Form Modal */}
      <Modal
        visible={showForm}
        onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }}
        title={t('admin.createAnnouncement')}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
          <Select
            label={t('admin.announcementType')}
            options={typeOptions}
            value={form.type}
            onChange={(value: string) => setForm(prev => ({ ...prev, type: value as AnnouncementForm['type'] }))}
          />

          <View style={{ marginTop: 12 }}>
            <Input
              label={t('admin.titleAr')}
              value={form.titleAr}
              onChangeText={(text: string) => setForm(prev => ({ ...prev, titleAr: text }))}
              placeholder={t('admin.titleArPlaceholder')}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Input
              label={t('admin.titleEn')}
              value={form.titleEn}
              onChangeText={(text: string) => setForm(prev => ({ ...prev, titleEn: text }))}
              placeholder={t('admin.titleEnPlaceholder')}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Input
              label={t('admin.bodyAr')}
              value={form.bodyAr}
              onChangeText={(text: string) => setForm(prev => ({ ...prev, bodyAr: text }))}
              placeholder={t('admin.bodyArPlaceholder')}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Input
              label={t('admin.bodyEn')}
              value={form.bodyEn}
              onChangeText={(text: string) => setForm(prev => ({ ...prev, bodyEn: text }))}
              placeholder={t('admin.bodyEnPlaceholder')}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            variant="secondary"
            onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }}
            style={{ flex: 1 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onPress={handleCreate}
            loading={createMut.isPending}
            style={{ flex: 1 }}
          >
            {t('admin.create')}
          </Button>
        </View>
      </Modal>
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16, paddingBottom: 8 },

  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  itemDate: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  itemBody: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
