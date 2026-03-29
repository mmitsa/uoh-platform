import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import type { ChatConversation } from '../../api/types';
import { Avatar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  conversation: ChatConversation;
  onPress: () => void;
}

function getTimeAgo(dateStr: string, isAr: boolean): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return isAr ? 'الآن' : 'now';
  if (diffMins < 60) return isAr ? `${diffMins} د` : `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return isAr ? `${diffHours} س` : `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return isAr ? `${diffDays} ي` : `${diffDays}d`;
  const d = new Date(dateStr);
  return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
}

export function ConversationItem({ conversation, onPress }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();

  // Build display title
  let title: string;
  if (conversation.type === 'group') {
    title = (isAr ? conversation.nameAr : conversation.nameEn) || t('chat.group', 'Group');
  } else {
    // For direct conversation, show the other participant's name
    const other = conversation.participants.find(p => p.userObjectId !== user?.id);
    title = other?.displayName ?? t('chat.conversation', 'Conversation');
  }

  const avatarName = title;
  const lastMessagePreview = conversation.lastMessage?.content ?? '';
  const timeAgo = conversation.updatedAtUtc ? getTimeAgo(conversation.updatedAtUtc, isAr) : '';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Avatar name={avatarName} size={48} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, hasUnread && styles.titleUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>{timeAgo}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {lastMessagePreview}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 14,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    pressed: {
      opacity: 0.7,
    },
    body: {
      flex: 1,
      marginStart: 12,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.text,
      flex: 1,
      marginEnd: 8,
    },
    titleUnread: {
      fontWeight: '700',
    },
    time: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    timeUnread: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    preview: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      flex: 1,
      marginEnd: 8,
    },
    previewUnread: {
      color: theme.colors.text,
      fontWeight: '500',
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      minWidth: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '700',
    },
  });
