import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import type {
  MainTabParamList,
  CommitteesStackParamList,
  MeetingsStackParamList,
  ChatStackParamList,
  TasksStackParamList,
  MoreStackParamList,
} from './types';

// Dashboard
import { DashboardScreen } from '../screens/DashboardScreen';

// Committees
import { CommitteesListScreen } from '../screens/committees/CommitteesListScreen';
import { CommitteeDetailScreen } from '../screens/committees/CommitteeDetailScreen';
import { CommitteeFormScreen } from '../screens/committees/CommitteeFormScreen';
import { CommitteeMembersScreen } from '../screens/committees/CommitteeMembersScreen';

// Meetings
import { MeetingsListScreen } from '../screens/meetings/MeetingsListScreen';
import { MeetingDetailScreen } from '../screens/meetings/MeetingDetailScreen';
import { MeetingFormScreen } from '../screens/meetings/MeetingFormScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';

// Chat
import { ConversationListScreen } from '../screens/chat/ConversationListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { NewConversationScreen } from '../screens/chat/NewConversationScreen';

// Tasks
import { TasksListScreen } from '../screens/tasks/TasksListScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { TaskFormScreen } from '../screens/tasks/TaskFormScreen';

// More — existing
import { MoreMenuScreen } from '../screens/more/MoreMenuScreen';
import { MomsListScreen } from '../screens/moms/MomsListScreen';
import { MomDetailScreen } from '../screens/moms/MomDetailScreen';
import { VotingListScreen } from '../screens/voting/VotingListScreen';
import { VotingDetailScreen } from '../screens/voting/VotingDetailScreen';
import { SurveysListScreen } from '../screens/surveys/SurveysListScreen';
import { SurveyDetailScreen } from '../screens/surveys/SurveyDetailScreen';
import { SurveyResponseScreen } from '../screens/surveys/SurveyResponseScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { WorkflowScreen } from '../screens/workflow/WorkflowScreen';
import { WorkflowDetailScreen } from '../screens/workflow/WorkflowDetailScreen';
import { AttachmentsScreen } from '../screens/attachments/AttachmentsScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/more/ProfileScreen';

// More — new screens
import { DirectivesListScreen } from '../screens/directives/DirectivesListScreen';
import { DirectiveDetailScreen } from '../screens/directives/DirectiveDetailScreen';
import { DirectiveFormScreen } from '../screens/directives/DirectiveFormScreen';
import { EvaluationsListScreen } from '../screens/evaluations/EvaluationsListScreen';
import { EvaluationDetailScreen } from '../screens/evaluations/EvaluationDetailScreen';
import { EvaluationFormScreen } from '../screens/evaluations/EvaluationFormScreen';
import { AcknowledgmentsScreen } from '../screens/acknowledgments/AcknowledgmentsScreen';
import { AcknowledgmentDetailScreen } from '../screens/acknowledgments/AcknowledgmentDetailScreen';
import { LocationsListScreen } from '../screens/locations/LocationsListScreen';
import { LocationDetailScreen } from '../screens/locations/LocationDetailScreen';
import { RoomBookingScreen } from '../screens/rooms/RoomBookingScreen';
import { RoomAvailabilityScreen } from '../screens/rooms/RoomAvailabilityScreen';
import { ApprovalsScreen } from '../screens/approvals/ApprovalsScreen';
import { ChangeRequestsListScreen } from '../screens/change-requests/ChangeRequestsListScreen';
import { ChangeRequestDetailScreen } from '../screens/change-requests/ChangeRequestDetailScreen';
import { LivePresenterScreen } from '../screens/live-survey/LivePresenterScreen';
import { LiveParticipantScreen } from '../screens/live-survey/LiveParticipantScreen';
import { PublicShareScreen } from '../screens/public/PublicShareScreen';
import { MyArchiveScreen } from '../screens/archive/MyArchiveScreen';

// Admin sub-screens
import { UsersListScreen } from '../screens/admin/UsersListScreen';
import { UserDetailScreen } from '../screens/admin/UserDetailScreen';
import { RolesScreen } from '../screens/admin/RolesScreen';
import { PermissionsScreen } from '../screens/admin/PermissionsScreen';
import { AnnouncementsScreen } from '../screens/admin/AnnouncementsScreen';
import { AdSyncScreen } from '../screens/admin/AdSyncScreen';
import { AcknowledgmentsAdminScreen } from '../screens/admin/AcknowledgmentsAdminScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const CommitteesNav = createNativeStackNavigator<CommitteesStackParamList>();
const MeetingsNav = createNativeStackNavigator<MeetingsStackParamList>();
const ChatNav = createNativeStackNavigator<ChatStackParamList>();
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

function ChatTab() {
  const { t } = useTranslation();
  return (
    <ChatNav.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <ChatNav.Screen name="ConversationList" component={ConversationListScreen} options={{ headerShown: false }} />
      <ChatNav.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params?.title ?? t('chat.title') })} />
      <ChatNav.Screen name="NewConversation" component={NewConversationScreen} options={{ title: t('chat.newConversation') }} />
    </ChatNav.Navigator>
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

      {/* Existing screens */}
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
      <MoreNav.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') }} />
      <MoreNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('notifications.title') }} />
      <MoreNav.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile.title') }} />

      {/* Directives */}
      <MoreNav.Screen name="Directives" component={DirectivesListScreen} options={{ title: t('directives.title') }} />
      <MoreNav.Screen name="DirectiveDetail" component={DirectiveDetailScreen} options={{ title: t('directives.detail') }} />
      <MoreNav.Screen name="DirectiveForm" component={DirectiveFormScreen} options={{ title: t('directives.new') }} />

      {/* Evaluations */}
      <MoreNav.Screen name="Evaluations" component={EvaluationsListScreen} options={{ title: t('evaluations.title') }} />
      <MoreNav.Screen name="EvaluationDetail" component={EvaluationDetailScreen} options={{ title: t('evaluations.detail') }} />
      <MoreNav.Screen name="EvaluationForm" component={EvaluationFormScreen} options={{ title: t('evaluations.new') }} />

      {/* Acknowledgments */}
      <MoreNav.Screen name="Acknowledgments" component={AcknowledgmentsScreen} options={{ title: t('acknowledgments.title') }} />
      <MoreNav.Screen name="AcknowledgmentDetail" component={AcknowledgmentDetailScreen} options={{ title: t('acknowledgments.title') }} />

      {/* Locations */}
      <MoreNav.Screen name="Locations" component={LocationsListScreen} options={{ title: t('locations.title') }} />
      <MoreNav.Screen name="LocationDetail" component={LocationDetailScreen} options={{ title: t('locations.detail') }} />

      {/* Room Booking */}
      <MoreNav.Screen name="RoomBooking" component={RoomBookingScreen} options={{ title: t('rooms.title') }} />
      <MoreNav.Screen name="RoomAvailability" component={RoomAvailabilityScreen} options={{ title: t('rooms.availability') }} />

      {/* Approvals */}
      <MoreNav.Screen name="Approvals" component={ApprovalsScreen} options={{ title: t('approvals.title') }} />

      {/* Change Requests */}
      <MoreNav.Screen name="ChangeRequests" component={ChangeRequestsListScreen} options={{ title: t('changeRequests.title') }} />
      <MoreNav.Screen name="ChangeRequestDetail" component={ChangeRequestDetailScreen} options={{ title: t('changeRequests.detail') }} />

      {/* Live Survey */}
      <MoreNav.Screen name="LivePresenter" component={LivePresenterScreen} options={{ title: t('liveSurvey.presenter') }} />
      <MoreNav.Screen name="LiveParticipant" component={LiveParticipantScreen} options={{ title: t('liveSurvey.participant') }} />

      {/* Public Share */}
      <MoreNav.Screen name="PublicShare" component={PublicShareScreen} options={{ headerShown: false }} />

      {/* Archive */}
      <MoreNav.Screen name="MyArchive" component={MyArchiveScreen} options={{ title: t('archive.title') }} />

      {/* Admin sub-screens */}
      <MoreNav.Screen name="Admin" component={AdminScreen} options={{ title: t('admin.title') }} />
      <MoreNav.Screen name="AdminUsers" component={UsersListScreen} options={{ title: t('admin.users') }} />
      <MoreNav.Screen name="AdminUserDetail" component={UserDetailScreen} options={{ title: t('admin.userDetail') }} />
      <MoreNav.Screen name="AdminRoles" component={RolesScreen} options={{ title: t('admin.roles') }} />
      <MoreNav.Screen name="AdminPermissions" component={PermissionsScreen} options={{ title: t('admin.permissions') }} />
      <MoreNav.Screen name="AdminAnnouncements" component={AnnouncementsScreen} options={{ title: t('admin.announcements') }} />
      <MoreNav.Screen name="AdminAdSync" component={AdSyncScreen} options={{ title: t('admin.adSync') }} />
      <MoreNav.Screen name="AdminAcknowledgments" component={AcknowledgmentsAdminScreen} options={{ title: t('admin.acknowledgmentsAdmin') }} />
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
            ChatTab: 'chatbubbles-outline',
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
      <Tab.Screen name="ChatTab" component={ChatTab} options={{ tabBarLabel: t('nav.chat') }} />
      <Tab.Screen name="TasksTab" component={TasksTab} options={{ tabBarLabel: t('nav.tasks') }} />
      <Tab.Screen name="MoreTab" component={MoreTab} options={{ tabBarLabel: t('nav.more') }} />
    </Tab.Navigator>
  );
}
