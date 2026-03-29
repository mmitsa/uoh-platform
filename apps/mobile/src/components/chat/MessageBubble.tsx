import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import type { ChatMessage } from '../../api/types';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
}

function formatTime(dateStr: string, isAr: boolean): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageBubble({ message, isOwn, showSender }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        {showSender && !isOwn && (
          <Text style={styles.senderName}>{message.senderDisplayName}</Text>
        )}
        <Text style={[styles.content, isOwn ? styles.contentOwn : styles.contentOther]}>
          {message.content}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.timestamp, isOwn ? styles.timestampOwn : styles.timestampOther]}>
            {formatTime(message.createdAtUtc, isAr)}
          </Text>
          {isOwn && (
            <Ionicons
              name={
                message.readByCount && message.readByCount > 0
                  ? 'checkmark-done'
                  : 'checkmark'
              }
              size={14}
              color={
                message.readByCount && message.readByCount > 0
                  ? '#93c5fd'
                  : 'rgba(255,255,255,0.6)'
              }
              style={{ marginStart: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 12,
      marginVertical: 2,
    },
    wrapperOwn: {
      alignItems: 'flex-end',
    },
    wrapperOther: {
      alignItems: 'flex-start',
    },
    bubble: {
      maxWidth: '80%',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
    },
    bubbleOwn: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleOther: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    senderName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    content: {
      fontSize: 15,
      lineHeight: 20,
    },
    contentOwn: {
      color: '#ffffff',
    },
    contentOther: {
      color: theme.colors.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    timestamp: {
      fontSize: 11,
    },
    timestampOwn: {
      color: 'rgba(255,255,255,0.7)',
    },
    timestampOther: {
      color: theme.colors.textMuted,
    },
  });
