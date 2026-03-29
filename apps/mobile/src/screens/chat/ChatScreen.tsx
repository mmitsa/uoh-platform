import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { ChatMessage, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { TypingIndicator } from '../../components/chat/TypingIndicator';

export function ChatScreen({ route, navigation }: any) {
  const { conversationId, title } = route.params as { conversationId: string; title: string };
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { markAsRead, setActiveConversation, typingUsers, conversations } = useChat();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Set header title
  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  // Track active conversation
  useEffect(() => {
    setActiveConversation(conversationId);
    markAsRead(conversationId);
    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation, markAsRead]);

  // Fetch messages
  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () =>
      api.get<PagedResponse<ChatMessage>>(
        `/api/v1/chat/conversations/${conversationId}/messages`,
      ),
    refetchInterval: 15000,
  });

  const messages = useMemo(() => {
    if (!data?.items) return [];
    // Sort newest first for inverted FlatList
    return [...data.items].sort(
      (a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
    );
  }, [data]);

  // Determine if this is a group conversation for showing sender names
  const conversation = conversations.find(c => c.id === conversationId);
  const isGroup = conversation?.type === 'group';

  // Compute typing users for this conversation
  const activeTypingUsers = useMemo(() => {
    const names: string[] = [];
    typingUsers.forEach((displayName, key) => {
      const [convId, userId] = key.split(':');
      if (convId === conversationId && userId !== user?.id) {
        names.push(displayName);
      }
    });
    return names;
  }, [typingUsers, conversationId, user?.id]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post<ChatMessage>(`/api/v1/chat/conversations/${conversationId}/messages`, {
        content,
        type: 'text',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
    },
  });

  const handleSend = useCallback(
    (text: string) => {
      sendMutation.mutate(text);
    },
    [sendMutation],
  );

  const handleAttach = useCallback(() => {
    // Attachment flow can be extended later
  }, []);

  const handleTyping = useCallback(() => {
    // Notify server that user is typing via API
    api.post(`/api/v1/chat/conversations/${conversationId}/typing`).catch(() => {});
  }, [conversationId]);

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isOwn = item.senderObjectId === user?.id;
      // Show sender name in group if the previous message (visually below, so next in array) is from a different sender
      const nextItem = messages[index + 1];
      const showSender = isGroup && !isOwn && (!nextItem || nextItem.senderObjectId !== item.senderObjectId);

      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          showSender={showSender}
        />
      );
    },
    [user?.id, isGroup, messages],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Date separator
  const renderDateSeparator = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr);
      const label = date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{label}</Text>
        </View>
      );
    },
    [isAr, styles],
  );

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeTypingUsers.length > 0 ? (
            <TypingIndicator displayName={activeTypingUsers.join(', ')} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('chat.noMessages', 'No messages yet. Say hello!')}
            </Text>
          </View>
        }
      />
      <MessageInput
        onSend={handleSend}
        onAttach={handleAttach}
        onTyping={handleTyping}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      paddingVertical: 8,
    },
    dateSeparator: {
      alignItems: 'center',
      marginVertical: 12,
    },
    dateSeparatorText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      backgroundColor: theme.colors.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      // Since the list is inverted, the empty component appears upside-down unless rotated
      transform: [{ scaleY: -1 }],
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });
