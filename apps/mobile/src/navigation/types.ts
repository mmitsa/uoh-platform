export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  CommitteesTab: undefined;
  MeetingsTab: undefined;
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
  MeetingForm: { id?: string };
  MeetingAgenda: { meetingId: string };
  MeetingInvitees: { meetingId: string };
  Calendar: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { id: string };
  TaskForm: { id?: string };
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
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
};
