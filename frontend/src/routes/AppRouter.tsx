import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Layout
import MainLayout from '../components/layout/MainLayout';

// Auth pages (eager-loaded — small & critical)
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import { NotFoundPage, UnauthorizedPage } from '../pages/Placeholders';

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/dashboard/ProfilePage'));
const ProjectsPage = lazy(() => import('../pages/projects/ProjectsPage'));
const ProjectDetailsPage = lazy(() => import('../pages/projects/ProjectDetailsPage'));
const TasksPage = lazy(() => import('../pages/tasks/TasksPage'));
const TeamPage = lazy(() => import('../pages/team/TeamPage'));
const TimeTrackingPage = lazy(() => import('../pages/time-tracking/TimeTrackingPage'));
const CollaborationPage = lazy(() => import('../pages/collaboration/CollaborationPage'));
const DocumentsPage = lazy(() => import('../pages/documents/DocumentsPage'));
const TimelinePage = lazy(() => import('../pages/timeline/TimelinePage'));
const BudgetPage = lazy(() => import('../pages/budget/BudgetPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public routes — redirect to dashboard if authenticated */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Protected routes — require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TasksPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/time-tracking" element={<TimeTrackingPage />} />
            <Route path="/collaboration" element={<CollaborationPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
              <Route path="/settings" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* Error pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
