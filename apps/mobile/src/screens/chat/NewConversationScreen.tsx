import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { ChatConversation, ChatParticipant } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Avatar, DataList } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

interface Contact {
  userObjectId: string;
  displayName: string;
  email: string;
}

export function NewConversationScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const { fetchConversations } = useChat();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Fetch contacts
  const { data, isLoading } = useQuery({
    queryKey: ['chat-contacts', debouncedSearch],
    queryFn: () =>
      api.get<Contact[]>(
        `/api/v1/chat/contacts${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`,
      ),
  });

  // Create or get existing conversation
  const createMutation = useMutation({
    mutationFn: (participantId: string) =>
      api.post<ChatConversation>('/api/v1/chat/conversations', {
        type: 'direct',
        participantIds: [participantId],
      }),
    onSuccess: (conversation) => {
      fetchConversations();
      // Determine the title for the chat header
      const other = conversation.participants.find(
        (p: ChatParticipant) => p.userObjectId !== user?.id,
      );
      const title = other?.displayName ?? t('chat.conversation', 'Conversation');
      navigation.replace('Chat', { conversationId: conversation.id, title });
    },
  });

  const handleSelectContact = (contact: Contact) => {
    if (createMutation.isPending) return;
    createMutation.mutate(contact.userObjectId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chat.newConversation', 'New Conversation')}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('chat.searchContacts', 'Search contacts...')}
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoFocus
        />
        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={theme.colors.textMuted}
            onPress={() => setSearch('')}
          />
        )}
      </View>

      {createMutation.isError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
          <Text style={styles.errorText}>
            {t('chat.createError', 'Failed to create conversation. Please try again.')}
          </Text>
        </View>
      )}

      <DataList
        data={data}
        isLoading={isLoading || createMutation.isPending}
        emptyTitle={t('chat.noContacts', 'No contacts found')}
        emptyMessage={debouncedSearch ? t('chat.tryDifferentSearch', 'Try a different search term') : undefined}
        keyExtractor={(item: Contact) => item.userObjectId}
        renderItem={({ item }: { item: Contact }) => (
          <Pressable
            style={({ pressed }) => [styles.contactItem, pressed && styles.contactPressed]}
            onPress={() => handleSelectContact(item)}
            disabled={createMutation.isPending}
          >
            <Avatar name={item.displayName} size={44} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.displayName}</Text>
              <Text style={styles.contactEmail}>{item.email}</Text>
            </View>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      marginStart: 8,
      paddingVertical: 0,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fee2e2',
      marginHorizontal: 16,
      marginTop: 8,
      padding: 10,
      borderRadius: theme.radius.sm,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.danger,
      marginStart: 8,
      flex: 1,
    },
    contactItem: {
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
    contactPressed: {
      opacity: 0.7,
    },
    contactInfo: {
      flex: 1,
      marginStart: 12,
    },
    contactName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    contactEmail: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
