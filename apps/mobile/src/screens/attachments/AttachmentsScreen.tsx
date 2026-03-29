import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { EmptyState } from '../../components/ui';

export function AttachmentsScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <EmptyState icon="attach-outline" title={t('attachments.title')} message={t('attachments.noFiles')} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
