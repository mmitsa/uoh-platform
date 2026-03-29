import { Route, Routes, BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './app/auth';
import { PermissionProvider } from './app/permissions';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CommitteesPage } from './pages/CommitteesPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { MomsPage } from './pages/MomsPage';
import { TasksPage } from './pages/TasksPage';
import { VotingPage } from './pages/VotingPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { SurveysPage } from './pages/SurveysPage';
import { AdminPage } from './pages/AdminPage';
import { PublicSurveyPage } from './pages/PublicSurveyPage';
import { AttachmentsPage } from './pages/AttachmentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LivePresenterPage } from './pages/LivePresenterPage';
import { LiveParticipantPage } from './pages/LiveParticipantPage';
import { LiveMeetingPage } from './pages/LiveMeetingPage';
import { MyArchivePage } from './pages/MyArchivePage';
import { DirectivesPage } from './pages/DirectivesPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { RolesPage } from './pages/admin/RolesPage';
import { PermissionsPage } from './pages/admin/PermissionsPage';
import { UserPermissionReviewPage } from './pages/admin/UserPermissionReviewPage';
import { ProfilePage } from './pages/ProfilePage';
import { CalendarPage } from './pages/CalendarPage';
import { AdSyncPage } from './pages/admin/AdSyncPage';
import { AnnouncementsPage } from './pages/admin/AnnouncementsPage';
import { PublicSharePage } from './pages/PublicSharePage';
import { LocationsPage } from './pages/LocationsPage';
import { RoomBookingPage } from './pages/RoomBookingPage';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { AcknowledgementsPage } from './pages/AcknowledgementsPage';
import { AcknowledgementsAdminPage } from './pages/admin/AcknowledgementsAdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
        <AuthProvider>
          <PermissionProvider>
            <ToastProvider>
              <AppLayout>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/public/surveys/:id" element={<PublicSurveyPage />} />
                  <Route path="/public/live/:joinCode" element={<LiveParticipantPage />} />
                  <Route path="/public/share/:token" element={<PublicSharePage />} />

                  {/* Authenticated - all roles */}
                  <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/committees" element={<ProtectedRoute><CommitteesPage /></ProtectedRoute>} />
                  <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                  <Route path="/locations" element={<ProtectedRoute><LocationsPage /></ProtectedRoute>} />
                  <Route path="/room-booking" element={<ProtectedRoute><RoomBookingPage /></ProtectedRoute>} />
                  <Route path="/meetings/:id/live" element={<ProtectedRoute><LiveMeetingPage /></ProtectedRoute>} />
                  <Route path="/moms" element={<ProtectedRoute><MomsPage /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
                  <Route path="/votes" element={<ProtectedRoute><VotingPage /></ProtectedRoute>} />

                  {/* All authenticated — action buttons guarded per-role in components */}
                  <Route path="/surveys" element={<ProtectedRoute><SurveysPage /></ProtectedRoute>} />
                  <Route path="/directives" element={<ProtectedRoute><DirectivesPage /></ProtectedRoute>} />
                  <Route path="/evaluations" element={<ProtectedRoute><EvaluationsPage /></ProtectedRoute>} />
                  <Route path="/competitions" element={<ProtectedRoute><CompetitionsPage /></ProtectedRoute>} />
                  <Route path="/surveys/:surveyId/live/:sessionId" element={<ProtectedRoute requiredRole="CommitteeSecretary"><LivePresenterPage /></ProtectedRoute>} />
                  <Route path="/attachments" element={<ProtectedRoute><AttachmentsPage /></ProtectedRoute>} />

                  {/* Reports - all authenticated */}
                  <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

                  {/* Profile - all authenticated */}
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                  {/* Acknowledgments - all authenticated */}
                  <Route path="/acknowledgments" element={<ProtectedRoute><AcknowledgementsPage /></ProtectedRoute>} />

                  {/* Archive - all authenticated (Chat is now a global sliding panel) */}
                  <Route path="/my-archive" element={<ProtectedRoute><MyArchivePage /></ProtectedRoute>} />

                  {/* Admin only */}
                  <Route path="/workflow" element={<ProtectedRoute requiredPermission="workflow.view"><WorkflowPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredPermission="admin.view"><AdminPage /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute requiredPermission="admin.users.view"><UsersPage /></ProtectedRoute>} />
                  <Route path="/admin/users/:id/permissions" element={<ProtectedRoute requiredPermission="admin.permissions.view"><UserPermissionReviewPage /></ProtectedRoute>} />
                  <Route path="/admin/roles" element={<ProtectedRoute requiredPermission="admin.roles.view"><RolesPage /></ProtectedRoute>} />
                  <Route path="/admin/permissions" element={<ProtectedRoute requiredPermission="admin.permissions.view"><PermissionsPage /></ProtectedRoute>} />
                  <Route path="/admin/announcements" element={<ProtectedRoute requiredPermission="admin.announcements.view"><AnnouncementsPage /></ProtectedRoute>} />
                  <Route path="/admin/acknowledgments" element={<ProtectedRoute requiredRole="SystemAdmin"><AcknowledgementsAdminPage /></ProtectedRoute>} />
                  <Route path="/admin/ad-sync" element={<ProtectedRoute requiredPermission="admin.adsync.configure"><AdSyncPage /></ProtectedRoute>} />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppLayout>
            </ToastProvider>
          </PermissionProvider>
        </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
