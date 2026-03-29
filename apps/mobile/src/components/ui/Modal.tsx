import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          {title && <Text style={styles.title}>{title}</Text>}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, padding: 20, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },
});
