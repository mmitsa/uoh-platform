import React from 'react';
import { FlatList, RefreshControl, type FlatListProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

interface Props<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[] | undefined;
  isLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  renderItem: FlatListProps<T>['renderItem'];
  keyExtractor?: (item: T, index: number) => string;
}

export function DataList<T>({ data, isLoading, refreshing, onRefresh, emptyTitle, emptyMessage, ...rest }: Props<T>) {
  const theme = useTheme();

  if (isLoading && !data?.length) return <LoadingSpinner />;

  return (
    <FlatList
      data={data ?? []}
      contentContainerStyle={!data?.length ? { flex: 1 } : { paddingBottom: 80 }}
      ListEmptyComponent={<EmptyState title={emptyTitle ?? 'No data'} message={emptyMessage} />}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined}
      {...rest}
    />
  );
}
