import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Card, CardBody, DataList, EmptyState, LoadingSpinner, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import type { Attachment, Announcement, PagedResponse } from '../../api/types';

/* ---- Types ---- */

interface ChatAttachment {
  id: string;
  conversationId: string;
  conversationName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  senderDisplayName: string;
  uploadedAtUtc: string;
}

/* ---- Helpers ---- */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType?: string): keyof typeof Ionicons.glyphMap {
  if (!mimeType) return 'document-outline';
  if (mimeType.startsWith('image/')) return 'image-outline';
  if (mimeType.startsWith('video/')) return 'videocam-outline';
  if (mimeType.startsWith('audio/')) return 'musical-note-outline';
  if (mimeType.includes('pdf')) return 'document-text-outline';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'grid-outline';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'easel-outline';
  return 'document-outline';
}

/* ---- Tabs Content ---- */

function ChatAttachmentsTab() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-chat-attachments'],
    queryFn: () => api.get<PagedResponse<ChatAttachment>>('/api/v1/chat/my-attachments'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <DataList
      data={data?.items}
      isLoading={isLoading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      emptyTitle={t('archive.noChatAttachments')}
      keyExtractor={(item: ChatAttachment) => item.id}
      renderItem={({ item }: { item: ChatAttachment }) => (
        <View style={styles.fileItem}>
          <View style={[styles.fileIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name={fileIcon(item.mimeType)} size={22} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
            <Text style={styles.fileMeta}>
              {item.senderDisplayName} - {item.conversationName}
            </Text>
            <View style={styles.fileDetailsRow}>
              <Text style={styles.fileSize}>{formatFileSize(item.sizeBytes)}</Text>
              <Text style={styles.fileDate}>
                {new Date(item.uploadedAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}

function FileAttachmentsTab() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-file-attachments'],
    queryFn: () => api.get<PagedResponse<Attachment>>('/api/v1/attachments'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <DataList
      data={data?.items}
      isLoading={isLoading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      emptyTitle={t('archive.noFileAttachments')}
      keyExtractor={(item: Attachment) => item.id}
      renderItem={({ item }: { item: Attachment }) => (
        <View style={styles.fileItem}>
          <View style={[styles.fileIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name={fileIcon(item.mimeType)} size={22} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>{item.title}</Text>
            <View style={styles.fileDetailsRow}>
              <Badge variant="info" label={item.domain} size="sm" />
              {item.sizeBytes != null && (
                <Text style={styles.fileSize}>{formatFileSize(item.sizeBytes)}</Text>
              )}
            </View>
            {item.uploadedAtUtc && (
              <Text style={styles.fileDate}>
                {new Date(item.uploadedAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </Text>
            )}
          </View>
        </View>
      )}
    />
  );
}

function AnnouncementsTab() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-announcements'],
    queryFn: () => api.get<PagedResponse<Announcement>>('/api/v1/announcements'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const typeVariant = (type: string) => {
    switch (type) {
      case 'circular': return 'brand' as const;
      case 'news': return 'info' as const;
      case 'announcement': return 'warning' as const;
      default: return 'default' as const;
    }
  };

  return (
    <DataList
      data={data?.items}
      isLoading={isLoading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      emptyTitle={t('archive.noAnnouncements')}
      keyExtractor={(item: Announcement) => item.id}
      renderItem={({ item }: { item: Announcement }) => (
        <Card style={{ marginHorizontal: 16, marginTop: 8 }}>
          <CardBody>
            <View style={styles.announcementHeader}>
              <Badge variant={typeVariant(item.type)} label={t(`announcements.types.${item.type}`, item.type)} size="sm" />
              <Text style={styles.announcementDate}>
                {new Date(item.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </Text>
            </View>
            <Text style={styles.announcementTitle}>
              {isAr ? item.titleAr : item.titleEn}
            </Text>
            <Text style={styles.announcementBody} numberOfLines={3}>
              {isAr ? item.bodyAr : item.bodyEn}
            </Text>
          </CardBody>
        </Card>
      )}
    />
  );
}

/* ---- Main Component ---- */

export function MyArchiveScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('chat');

  const segments = [
    { key: 'chat', label: t('archive.chatAttachments') },
    { key: 'files', label: t('archive.fileAttachments') },
    { key: 'announcements', label: t('archive.announcements') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t('archive.title')}</Text>

      <SegmentedControl
        segments={segments}
        selected={activeTab}
        onSelect={setActiveTab}
      />

      <View style={{ flex: 1 }}>
        {activeTab === 'chat' && <ChatAttachmentsTab />}
        {activeTab === 'files' && <FileAttachmentsTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
      </View>
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  screenTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16, paddingBottom: 8 },

  fileItem: {
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
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  fileMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  fileDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  fileSize: { fontSize: 12, color: theme.colors.textSecondary },
  fileDate: { fontSize: 11, color: theme.colors.textMuted },

  announcementHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  announcementDate: { fontSize: 11, color: theme.colors.textMuted },
  announcementTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  announcementBody: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, lineHeight: 20 },
});
