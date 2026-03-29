import type { NavigationContainerRef } from '@react-navigation/native';

/**
 * Maps notification entityType values to their corresponding screen names
 * and the tab that contains them.
 */
const ENTITY_SCREEN_MAP: Record<string, { tab: string; screen: string }> = {
  meeting: { tab: 'MeetingsTab', screen: 'MeetingDetail' },
  task: { tab: 'TasksTab', screen: 'TaskDetail' },
  mom: { tab: 'MoreTab', screen: 'MomDetail' },
  committee: { tab: 'CommitteesTab', screen: 'CommitteeDetail' },
  survey: { tab: 'MoreTab', screen: 'SurveyDetail' },
  vote: { tab: 'MoreTab', screen: 'VotingDetail' },
};

export interface NotificationData {
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

/**
 * Resolves a notification's entity type to the target screen and tab.
 * Returns null if the entity type is unknown or missing.
 */
export function resolveNotificationTarget(data: NotificationData | undefined) {
  if (!data?.entityType || !data?.entityId) return null;

  const mapping = ENTITY_SCREEN_MAP[data.entityType];
  if (!mapping) return null;

  return {
    tab: mapping.tab,
    screen: mapping.screen,
    params: { id: data.entityId },
  };
}

/**
 * Navigates to the appropriate screen when a notification is tapped.
 * Requires a ref to the root NavigationContainer.
 */
export function handleNotificationNavigation(
  navigationRef: NavigationContainerRef<any> | null,
  data: NotificationData | undefined,
) {
  if (!navigationRef?.isReady()) return;

  const target = resolveNotificationTarget(data);
  if (!target) return;

  // Navigate to Main -> target tab -> target screen
  (navigationRef as any).navigate('Main', {
    screen: target.tab,
    params: {
      screen: target.screen,
      params: target.params,
    },
  });
}
