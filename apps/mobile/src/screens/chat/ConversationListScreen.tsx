import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { DataList, Fab } from '../../components/ui';
import { useChat } from '../../contexts/ChatContext';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { ConversationItem } from '../../components/chat/ConversationItem';
import type { ChatConversation } from '../../api/types';

export function ConversationListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();

  const { conversations, isLoading, fetchConversations } = useChat();
  const { refreshing, onRefresh } = useRefreshControl(fetchConversations);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const filteredConversations = useCallback(() => {
    if (!debouncedSearch.trim()) return conversations;
    const query = debouncedSearch.toLowerCase();
    return conversations.filter(c => {
      // Search in name
      const nameMatch =
        c.nameAr?.toLowerCase().includes(query) ||
        c.nameEn?.toLowerCase().includes(query);
      // Search in participant names
      const participantMatch = c.participants.some(
        p => p.displayName.toLowerCase().includes(query) || p.email.toLowerCase().includes(query),
      );
      // Search in last message
      const messageMatch = c.lastMessage?.content.toLowerCase().includes(query);
      return nameMatch || participantMatch || messageMatch;
    });
  }, [conversations, debouncedSearch])();

  const handlePress = (conversation: ChatConversation) => {
    // Determine the display title for the header
    let title: string;
    if (conversation.type === 'group') {
      title = (isAr ? conversation.nameAr : conversation.nameEn) || t('chat.group', 'Group');
    } else {
      const other = conversation.participants.find(p => p.userObjectId !== user?.id);
      title = other?.displayName ?? t('chat.conversation', 'Conversation');
    }
    navigation.navigate('Chat', { conversationId: conversation.id, title });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chat.title', 'Messages')}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('chat.search', 'Search conversations...')}
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
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

      <DataList
        data={filteredConversations}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('chat.noConversations', 'No conversations yet')}
        emptyMessage={t('chat.startConversation', 'Start a new conversation to begin chatting')}
        keyExtractor={(item: ChatConversation) => item.id}
        renderItem={({ item }: { item: ChatConversation }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handlePress(item)}
          />
        )}
      />

      <Fab
        icon="chatbubble-ellipses"
        onPress={() => navigation.navigate('NewConversation')}
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
  });
