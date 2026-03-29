import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import type { MainTabParamList, CommitteesStackParamList, MeetingsStackParamList, TasksStackParamList, MoreStackParamList } from './types';

// Phase 2 screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { CommitteesListScreen } from '../screens/committees/CommitteesListScreen';
import { CommitteeDetailScreen } from '../screens/committees/CommitteeDetailScreen';
import { CommitteeFormScreen } from '../screens/committees/CommitteeFormScreen';
import { CommitteeMembersScreen } from '../screens/committees/CommitteeMembersScreen';
import { MeetingsListScreen } from '../screens/meetings/MeetingsListScreen';
import { MeetingDetailScreen } from '../screens/meetings/MeetingDetailScreen';
import { MeetingFormScreen } from '../screens/meetings/MeetingFormScreen';
import { TasksListScreen } from '../screens/tasks/TasksListScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { TaskFormScreen } from '../screens/tasks/TaskFormScreen';

// Phase 3-5 screens
import { MomsListScreen } from '../screens/moms/MomsListScreen';
import { MomDetailScreen } from '../screens/moms/MomDetailScreen';
import { VotingListScreen } from '../screens/voting/VotingListScreen';
import { VotingDetailScreen } from '../screens/voting/VotingDetailScreen';
import { SurveysListScreen } from '../screens/surveys/SurveysListScreen';
import { SurveyDetailScreen } from '../screens/surveys/SurveyDetailScreen';
import { SurveyResponseScreen } from '../screens/surveys/SurveyResponseScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { MoreMenuScreen } from '../screens/more/MoreMenuScreen';
import { WorkflowScreen } from '../screens/workflow/WorkflowScreen';
import { WorkflowDetailScreen } from '../screens/workflow/WorkflowDetailScreen';
import { AttachmentsScreen } from '../screens/attachments/AttachmentsScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/more/ProfileScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const CommitteesNav = createNativeStackNavigator<CommitteesStackParamList>();
const MeetingsNav = createNativeStackNavigator<MeetingsStackParamList>();
const TasksNav = createNativeStackNavigator<TasksStackParamList>();
const MoreNav = createNativeStackNavigator<MoreStackParamList>();

function CommitteesTab() {
  const { t } = useTranslation();
  return (
    <CommitteesNav.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <CommitteesNav.Screen name="CommitteesList" component={CommitteesListScreen} options={{ headerShown: false }} />
      <CommitteesNav.Screen name="CommitteeDetail" component={CommitteeDetailScreen} options={{ title: t('committees.title') }} />
      <CommitteesNav.Screen name="CommitteeForm" component={CommitteeFormScreen} options={{ title: t('committees.new') }} />
      <CommitteesNav.Screen name="CommitteeMembers" component={CommitteeMembersScreen} options={{ title: t('committees.members') }} />
    </CommitteesNav.Navigator>
  );
}

function MeetingsTab() {
  const { t } = useTranslation();
  return (
    <MeetingsNav.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <MeetingsNav.Screen name="MeetingsList" component={MeetingsListScreen} options={{ headerShown: false }} />
      <MeetingsNav.Screen name="MeetingDetail" component={MeetingDetailScreen} options={{ title: t('meetings.title') }} />
      <MeetingsNav.Screen name="MeetingForm" component={MeetingFormScreen} options={{ title: t('meetings.new') }} />
      <MeetingsNav.Screen name="Calendar" component={CalendarScreen} options={{ title: t('calendar.title') }} />
    </MeetingsNav.Navigator>
  );
}

function TasksTab() {
  const { t } = useTranslation();
  return (
    <TasksNav.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <TasksNav.Screen name="TasksList" component={TasksListScreen} options={{ headerShown: false }} />
      <TasksNav.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: t('tasks.title') }} />
      <TasksNav.Screen name="TaskForm" component={TaskFormScreen} options={{ title: t('tasks.new') }} />
    </TasksNav.Navigator>
  );
}

function MoreTab() {
  const { t } = useTranslation();
  return (
    <MoreNav.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <MoreNav.Screen name="MoreMenu" component={MoreMenuScreen} options={{ headerShown: false }} />
      <MoreNav.Screen name="MomsList" component={MomsListScreen} options={{ title: t('moms.title') }} />
      <MoreNav.Screen name="MomDetail" component={MomDetailScreen} options={{ title: t('moms.detail') }} />
      <MoreNav.Screen name="VotingList" component={VotingListScreen} options={{ title: t('voting.title') }} />
      <MoreNav.Screen name="VotingDetail" component={VotingDetailScreen} options={{ title: t('voting.detail') }} />
      <MoreNav.Screen name="SurveysList" component={SurveysListScreen} options={{ title: t('surveys.title') }} />
      <MoreNav.Screen name="SurveyDetail" component={SurveyDetailScreen} options={{ title: t('surveys.detail') }} />
      <MoreNav.Screen name="SurveyResponse" component={SurveyResponseScreen} options={{ title: t('surveys.respond') }} />
      <MoreNav.Screen name="Reports" component={ReportsScreen} options={{ title: t('reports.title') }} />
      <MoreNav.Screen name="Workflow" component={WorkflowScreen} options={{ title: t('workflow.title') }} />
      <MoreNav.Screen name="WorkflowDetail" component={WorkflowDetailScreen} options={{ title: t('workflow.detail') }} />
      <MoreNav.Screen name="Attachments" component={AttachmentsScreen} options={{ title: t('attachments.title') }} />
      <MoreNav.Screen name="Admin" component={AdminScreen} options={{ title: t('admin.title') }} />
      <MoreNav.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') }} />
      <MoreNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('notifications.title') }} />
      <MoreNav.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile.title') }} />
    </MoreNav.Navigator>
  );
}

export function MainTabNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            DashboardTab: 'grid-outline',
            CommitteesTab: 'people-outline',
            MeetingsTab: 'calendar-outline',
            TasksTab: 'checkmark-circle-outline',
            MoreTab: 'ellipsis-horizontal',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipsis-horizontal'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: t('nav.dashboard') }} />
      <Tab.Screen name="CommitteesTab" component={CommitteesTab} options={{ tabBarLabel: t('nav.committees') }} />
      <Tab.Screen name="MeetingsTab" component={MeetingsTab} options={{ tabBarLabel: t('nav.meetings') }} />
      <Tab.Screen name="TasksTab" component={TasksTab} options={{ tabBarLabel: t('nav.tasks') }} />
      <Tab.Screen name="MoreTab" component={MoreTab} options={{ tabBarLabel: t('nav.more') }} />
    </Tab.Navigator>
  );
}
