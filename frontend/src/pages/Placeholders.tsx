import React from 'react';
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import Construction from '@mui/icons-material/Construction';

interface PlaceholderPageProps {
  title: string;
  description: string;
  sprint: string;
  icon?: React.ReactNode;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  sprint,
  icon,
}) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
  >
    <Card sx={{ maxWidth: 480, textAlign: 'center', borderRadius: 3 }}>
      <CardContent sx={{ p: 5 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          {icon || <Construction sx={{ color: 'white', fontSize: 36 }} />}
        </Box>
        <Chip
          label={sprint}
          color="primary"
          size="small"
          sx={{ mb: 2, fontWeight: 600 }}
        />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {description}
        </Typography>
        <Button variant="outlined" size="large" disabled>
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  </Box>
);

// ─── Individual Module Placeholder Pages ───────────────────────────────────

export const ProjectsPage: React.FC = () => (
  <PlaceholderPage
    title="Project Management"
    description="Create, manage, and track all your projects with milestones, budgets, and team assignments."
    sprint="Sprint 3–5"
  />
);

export const TasksPage: React.FC = () => (
  <PlaceholderPage
    title="Task Management"
    description="Manage tasks with Kanban boards, drag-and-drop, subtasks, checklists, and more."
    sprint="Sprint 6–9"
  />
);

export const TeamPage: React.FC = () => (
  <PlaceholderPage
    title="Team Management"
    description="Manage team members, roles, workloads, and resource allocation."
    sprint="Sprint 10–11"
  />
);

export const TimeTrackingPage: React.FC = () => (
  <PlaceholderPage
    title="Time Tracking"
    description="Track time with start/stop timers, manual entries, and detailed reports."
    sprint="Sprint 12–13"
  />
);

export const CollaborationPage: React.FC = () => (
  <PlaceholderPage
    title="Collaboration"
    description="Real-time collaboration with comments, mentions, activity feeds, and notifications."
    sprint="Sprint 14–16"
  />
);

export const TimelinePage: React.FC = () => (
  <PlaceholderPage
    title="Gantt Chart & Timeline"
    description="Interactive Gantt charts with drag-and-drop, dependencies, and progress tracking."
    sprint="Sprint 19–21"
  />
);

export const BudgetPage: React.FC = () => (
  <PlaceholderPage
    title="Budget Management"
    description="Track project budgets, expenses, and generate financial reports."
    sprint="Sprint 22–23"
  />
);

export const ReportsPage: React.FC = () => (
  <PlaceholderPage
    title="Reports & Analytics"
    description="Detailed reports with charts, export to PDF/Excel, and custom dashboards."
    sprint="Sprint 24–26"
  />
);

export const UnauthorizedPage: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
    textAlign="center"
  >
    <Box>
      <Typography variant="h1" fontWeight={900} color="error" gutterBottom>
        403
      </Typography>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Access Denied
      </Typography>
      <Typography variant="body1" color="text.secondary">
        You don't have permission to access this page.
      </Typography>
    </Box>
  </Box>
);

export const NotFoundPage: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
    textAlign="center"
  >
    <Box>
      <Typography variant="h1" fontWeight={900} color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary">
        The page you're looking for doesn't exist.
      </Typography>
    </Box>
  </Box>
);
