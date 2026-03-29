import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Directive, DirectiveDecision } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'warning',
  active: 'success',
  closed: 'default',
};

interface DirectiveDetail extends Directive {
  decisions?: DirectiveDecision[];
}

export function DirectiveDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['directive', id],
    queryFn: () => api.get<DirectiveDetail>(`/api/v1/directives/${id}`),
  });

  if (isLoading || !data) return <LoadingSpinner />;

  const title = isAr ? data.titleAr : data.titleEn;
  const altTitle = isAr ? data.titleEn : data.titleAr;
  const description = isAr ? data.descriptionAr : data.descriptionEn;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <Text style={styles.title}>{title}</Text>
          {altTitle ? <Text style={styles.subtitle}>{altTitle}</Text> : null}

          <View style={styles.badgeRow}>
            <Badge
              variant={STATUS_VARIANT[data.status] ?? 'default'}
              label={t(`directives.statuses.${data.status}`, data.status)}
            />
          </View>

          {data.referenceNumber && (
            <>
              <Text style={styles.label}>{t('directives.referenceNumber')}</Text>
              <Text style={styles.value}>#{data.referenceNumber}</Text>
            </>
          )}

          {data.issuedBy && (
            <>
              <Text style={styles.label}>{t('directives.issuedBy')}</Text>
              <Text style={styles.value}>{data.issuedBy}</Text>
            </>
          )}

          <Text style={styles.label}>{t('directives.createdAt')}</Text>
          <Text style={styles.value}>
            {new Date(data.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
          </Text>

          {description && (
            <>
              <Text style={styles.label}>{t('directives.description')}</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </>
          )}
        </CardBody>
      </Card>

      {/* Linked Decisions */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('directives.linkedDecisions')}</Text>
          {data.decisions && data.decisions.length > 0 ? (
            data.decisions.map((decision) => (
              <View key={decision.id} style={styles.decisionItem}>
                <View style={styles.decisionIcon}>
                  <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.decisionTitle}>
                    {isAr ? decision.titleAr : decision.titleEn}
                  </Text>
                  {(isAr ? decision.notesAr : decision.notesEn) && (
                    <Text style={styles.decisionNotes} numberOfLines={2}>
                      {isAr ? decision.notesAr : decision.notesEn}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyDecisions}>
              <Ionicons name="folder-open-outline" size={32} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>{t('directives.noDecisions')}</Text>
            </View>
          )}
        </CardBody>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={() => navigation.navigate('DirectiveForm', { id })}
          style={{ flex: 1 }}
        >
          {t('actions.edit')}
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 16,
      textTransform: 'uppercase',
    },
    value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
    descriptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    decisionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    decisionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    decisionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    decisionNotes: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
      lineHeight: 18,
    },
    emptyDecisions: { alignItems: 'center', padding: 24 },
    emptyText: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  });
