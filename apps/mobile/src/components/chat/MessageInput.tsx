import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

interface Props {
  onSend: (text: string) => void;
  onAttach?: () => void;
  onTyping?: () => void;
}

export function MessageInput({ onSend, onAttach, onTyping }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const trimmed = text.trim();
  const canSend = trimmed.length > 0;

  const handleChangeText = (value: string) => {
    setText(value);
    if (onTyping && value.length > 0) {
      onTyping();
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      {onAttach && (
        <Pressable onPress={onAttach} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="attach" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      )}
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        placeholder={t('chat.typeMessage', 'Type a message...')}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        maxLength={2000}
        textAlignVertical="center"
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendBtn,
          canSend ? styles.sendBtnActive : styles.sendBtnDisabled,
          pressed && canSend && { opacity: 0.7 },
        ]}
        hitSlop={8}
      >
        <Ionicons name="send" size={20} color={canSend ? '#ffffff' : theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      ...Platform.select({
        ios: { paddingBottom: 24 },
        default: {},
      }),
    },
    iconBtn: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 15,
      color: theme.colors.text,
      marginHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    sendBtnDisabled: {
      backgroundColor: theme.colors.borderLight,
    },
  });
