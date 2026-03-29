import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { api } from '../../api/apiClient';
import type { Attachment, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, Fab } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

/* ---- Helpers ---- */

function mimeIcon(mime?: string): keyof typeof Ionicons.glyphMap {
  if (!mime) return 'document-outline';
  if (mime.startsWith('image/')) return 'image-outline';
  if (mime.startsWith('video/')) return 'videocam-outline';
  if (mime.startsWith('audio/')) return 'musical-notes-outline';
  if (mime.includes('pdf')) return 'document-text-outline';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return 'grid-outline';
  if (mime.includes('presentation') || mime.includes('powerpoint'))
    return 'easel-outline';
  if (mime.includes('word') || mime.includes('document')) return 'document-outline';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar'))
    return 'archive-outline';
  return 'document-outline';
}

function mimeColor(mime: string | undefined, theme: Theme): string {
  if (!mime) return theme.colors.textMuted;
  if (mime.startsWith('image/')) return '#e11d48';
  if (mime.startsWith('video/')) return '#7c3aed';
  if (mime.startsWith('audio/')) return '#0891b2';
  if (mime.includes('pdf')) return '#dc2626';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return '#16a34a';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '#ea580c';
  if (mime.includes('word')) return '#2563eb';
  return theme.colors.textMuted;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---- Component ---- */

export function AttachmentsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attachments'],
    queryFn: () => api.get<PagedResponse<Attachment>>('/api/v1/attachments?domain=all'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const handleDownload = async (attachment: Attachment) => {
    try {
      const downloadUrl = `/api/v1/attachments/${attachment.id}/download`;
      Alert.alert(
        t('attachments.download'),
        t('attachments.downloadConfirm', { name: attachment.title }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('attachments.download'),
            onPress: async () => {
              try {
                const baseUrl = 'http://localhost:5062';
                await Linking.openURL(`${baseUrl}${downloadUrl}`);
              } catch {
                Alert.alert(t('common.error'), t('common.errorOccurred'));
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    }
  };

  const handleUpload = () => {
    Alert.alert(t('attachments.upload'), t('attachments.uploadHint'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t('attachments.title')}</Text>

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('attachments.noFiles')}
        emptyMessage={t('attachments.noFilesMessage')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => handleDownload(item)}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: mimeColor(item.mimeType, theme) + '15' },
              ]}
            >
              <Ionicons
                name={mimeIcon(item.mimeType)}
                size={24}
                color={mimeColor(item.mimeType, theme)}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.fileMeta}>
                {item.mimeType && (
                  <Text style={styles.fileMetaText} numberOfLines={1}>
                    {item.mimeType.split('/').pop()?.toUpperCase()}
                  </Text>
                )}
                {item.sizeBytes != null && (
                  <Text style={styles.fileMetaText}>{formatFileSize(item.sizeBytes)}</Text>
                )}
                {item.uploadedAtUtc && (
                  <Text style={styles.fileMetaText}>
                    {new Date(item.uploadedAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => handleDownload(item)}
              hitSlop={8}
              style={styles.downloadBtn}
            >
              <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
            </Pressable>
          </Pressable>
        )}
      />

      <Fab icon="cloud-upload" onPress={handleUpload} />
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    screenTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
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
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    fileMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
    fileMetaText: { fontSize: 12, color: theme.colors.textMuted },
    downloadBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
