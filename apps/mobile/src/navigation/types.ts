export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  CommitteesTab: undefined;
  MeetingsTab: undefined;
  ChatTab: undefined;
  TasksTab: undefined;
  MoreTab: undefined;
};

export type CommitteesStackParamList = {
  CommitteesList: undefined;
  CommitteeDetail: { id: string };
  CommitteeForm: { id?: string };
  CommitteeMembers: { id: string };
};

export type MeetingsStackParamList = {
  MeetingsList: undefined;
  MeetingDetail: { id: string };
  MeetingForm: { id?: string; committeeId?: string };
  MeetingAgenda: { meetingId: string };
  MeetingInvitees: { meetingId: string };
  Calendar: undefined;
};

export type ChatStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; title?: string };
  NewConversation: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { id: string };
  TaskForm: { id?: string; committeeId?: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  MomsList: undefined;
  MomDetail: { id: string };
  MomForm: { meetingId: string };
  VotingList: undefined;
  VotingDetail: { id: string };
  VotingForm: { meetingId?: string };
  SurveysList: undefined;
  SurveyDetail: { id: string };
  SurveyResponse: { id: string };
  SurveyForm: { id?: string };
  Reports: undefined;
  Workflow: undefined;
  WorkflowDetail: { id: string };
  Attachments: undefined;
  Admin: undefined;
  AdminUsers: undefined;
  AdminUserDetail: { id: string };
  AdminRoles: undefined;
  AdminPermissions: { roleId: string };
  AdminAnnouncements: undefined;
  AdminAdSync: undefined;
  AdminAcknowledgments: undefined;
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
  Directives: undefined;
  DirectiveDetail: { id: string };
  DirectiveForm: { id?: string };
  Evaluations: undefined;
  EvaluationDetail: { id: string };
  EvaluationForm: { committeeId: string; templateId?: string };
  Acknowledgments: undefined;
  AcknowledgmentDetail: { id: string };
  Locations: undefined;
  LocationDetail: { id: string };
  RoomBooking: undefined;
  RoomAvailability: { roomId: string };
  Approvals: undefined;
  ChangeRequests: undefined;
  ChangeRequestDetail: { id: string };
  LivePresenter: { sessionId: string; surveyId: string };
  LiveParticipant: { joinCode: string };
  PublicShare: { token: string };
  MyArchive: undefined;
};
