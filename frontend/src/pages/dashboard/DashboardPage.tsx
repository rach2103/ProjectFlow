import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import FolderOpen from '@mui/icons-material/FolderOpen';
import Assignment from '@mui/icons-material/Assignment';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import TrendingUp from '@mui/icons-material/TrendingUp';
import People from '@mui/icons-material/People';
import Timer from '@mui/icons-material/Timer';
import AttachMoney from '@mui/icons-material/AttachMoney';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import MoreVert from '@mui/icons-material/MoreVert';
import Menu from '@mui/icons-material/Menu';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';

const STATUS_COLORS: Record<string, string> = {
  planning: '#9e9e9e',
  active: '#1976d2',
  on_hold: '#ed6c02',
  completed: '#2e7d32',
  archived: '#7b1fa2',
  cancelled: '#d32f2f',
};

// We'll derive dashboard data from real API data (projects & tasks)

// ─── Stat Card Component ─────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        {trend && (
          <Chip
            icon={trend.isPositive ? <ArrowUpward sx={{ fontSize: '14px !important' }} /> : <ArrowDownward sx={{ fontSize: '14px !important' }} />}
            label={`${trend.value}%`}
            size="small"
            sx={{
              bgcolor: trend.isPositive ? '#e8f5e920' : '#ffebee',
              color: trend.isPositive ? 'success.main' : 'error.main',
              fontWeight: 700,
              fontSize: 12,
              height: 24,
            }}
          />
        )}
      </Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {value}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{
    display: "block",
    wordBreak: "break-word",}} >
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
);

// ─── Dashboard Page ───────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  // Queries: projects and tasks
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'dashboard'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', 'dashboard'],
    queryFn: () => taskService.getAllTasks(),
  });

  const loading = isProjectsLoading || isTasksLoading;

  // Derived metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const now = new Date();
  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;

  // team members count (unique ids across project managers and members)
  const memberIds = new Set<string>();
  projects.forEach((p) => {
    if (p.projectManager) memberIds.add(typeof p.projectManager === 'string' ? p.projectManager : (p.projectManager as any)._id);
    (p.members || []).forEach((m) => {
      const id = typeof m.user === 'string' ? m.user : (m.user as any)?._id;
      if (id) memberIds.add(id);
    });
  });
  const teamMembers = memberIds.size;

  // budget usage across projects
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
  const budgetUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const totalTrackedHours = tasks.reduce((s, t) => s + (t.actualHours || 0), 0);

  // Productivity: % of tasks completed out of total
  const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task Completion Trend: group tasks by month using createdAt
  const monthlyMap: Record<string, { month: string; tasks: number; completed: number }> = {};
  tasks.forEach((t) => {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyMap[key]) monthlyMap[key] = { month: label, tasks: 0, completed: 0 };
    monthlyMap[key].tasks += 1;
    if (t.status === 'completed') monthlyMap[key].completed += 1;
  });
  const taskTrendData = Object.keys(monthlyMap).sort().map((k) => monthlyMap[k]);

  // Task Status Breakdown for Pie
  const statusCounts: Record<string, number> = {};
  tasks.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const PIE_COLORS: Record<string, string> = {
    completed: '#2e7d32', in_progress: '#1976d2', review: '#ed6c02', todo: '#9e9e9e', testing: '#9c27b0',
  };
  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name: status.replace('_', ' '),
    value,
    color: PIE_COLORS[status] || '#1976d2',
  }));

  // Team Workload: tasks per assignee
  const assigneeMap: Record<string, { name: string; tasks: number; completed: number }> = {};
  tasks.forEach((t) => {
    t.assignees.forEach((a) => {
      const user = typeof a === 'string' ? null : (a as any);
      if (!user) return;
      const id = user._id;
      const name = `${user.firstName} ${user.lastName}`;
      if (!assigneeMap[id]) assigneeMap[id] = { name, tasks: 0, completed: 0 };
      assigneeMap[id].tasks += 1;
      if (t.status === 'completed') assigneeMap[id].completed += 1;
    });
  });
  const workloadData = Object.values(assigneeMap).sort((a, b) => b.tasks - a.tasks).slice(0, 8);
  const maxWorkload = workloadData.reduce((m, d) => Math.max(m, d.tasks), 10);

  const openSidebar = (action: 'toggle' | 'open' = 'toggle') => {
    window.dispatchEvent(new CustomEvent('app:sidebar', { detail: { action } }));
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
          <IconButton size="small" onClick={() => openSidebar('toggle')} sx={{ p: 0.5 }}>
            <Menu />
          </IconButton>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {greeting()}, {user?.firstName}! 👋
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{mb: 0.5}}>
          Here's what's happening with your projects today.
        </Typography>
      </Box>

      {/* Stats Grid */}
        <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Projects"
            value={loading ? '—' : totalProjects}
            subtitle={`${loading ? '' : `${completedProjects} completed`}`} 
            icon={<FolderOpen />}
            color="#1976d2"
            trend={{ value: 12, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Tasks"
            value={loading ? '—' : totalTasks}
            subtitle={loading ? '' : `${overdueTasks} overdue`}
            icon={<Assignment />}
            color="#9c27b0"
            trend={{ value: 8, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Completed Tasks"
            value={loading ? '—' : completedTasks}
            subtitle={loading ? '' : `of ${totalTasks} total`}
            icon={<CheckCircle />}
            color="#2e7d32"
            trend={{ value: 18, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Overdue Tasks"
            value={loading ? '—' : overdueTasks}
            subtitle="Requires immediate attention"
            icon={<Warning />}
            color="#d32f2f"
            trend={{ value: 5, isPositive: false }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Team Members"
            value={loading ? '—' : teamMembers}
            subtitle="Across all projects"
            icon={<People />}
            color="#0288d1"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Hours Tracked"
            value={loading ? '—' : `${totalTrackedHours}h`}
            subtitle="Sum of actual hours"
            icon={<Timer />}
            color="#ed6c02"
            trend={{ value: 6, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Budget Used"
            value={loading ? '—' : `${budgetUsage}%`}
            subtitle={loading ? '' : `$${totalSpent.toLocaleString()} of $${totalBudget.toLocaleString()}`}
            icon={<AttachMoney />}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Productivity"
            value={loading ? '—' : `${productivity}%`}
            subtitle={loading ? '' : `${completedTasks} of ${totalTasks} tasks done`}
            icon={<TrendingUp />}
            color="#2e7d32"
            trend={{ value: productivity, isPositive: productivity >= 50 }}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
        <Grid container spacing={2.5} mb={3} mt={2}>
        {/* Task Completion Trend */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ mt: 2 }}>
                    Task Completion Trend
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" sx={{mb: 1}}>
                    Monthly overview
                  </Typography>
                </Box>
                <Tooltip title="More options"><IconButton size="small"><MoreVert /></IconButton></Tooltip>
              </Box>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="tasks" stroke="#1976d2" fill="url(#tasksGrad)" strokeWidth={2} name="Total Tasks" />
                  <Area type="monotone" dataKey="completed" stroke="#2e7d32" fill="url(#completedGrad)" strokeWidth={2} name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Status Breakdown */}
        <Grid item xs={12} mt={4}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mt: 2 }}>
                Task Status
              </Typography>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                Current sprint
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center" mt={1}>
                {pieData.map((d) => (
                  <Chip key={d.name} label={`${d.name} (${d.value})`} size="small"
                    sx={{ fontWeight: 600, fontSize: 11, bgcolor: `${d.color}20`, color: d.color }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Workload */}
        <Grid item xs={12} mt={4}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mt: 2 }}>
                Team Workload
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                Current task distribution
              </Typography>
              <Box sx={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, maxWorkload]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#1976d2" radius={[0, 4, 4, 0]} name="Total Tasks" />
                  <Bar dataKey="completed" fill="#2e7d32" radius={[0, 4, 4, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2} textTransform="uppercase" letterSpacing="0.05em">
                Latest team updates
              </Typography>
              <List dense disablePadding>
                {!loading && tasks.slice(0, 8).map((t, index) => {
                  const reporter = typeof t.reporter === 'string' ? undefined : (t.reporter as any);
                  const userName = reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown';
                  return (
                    <React.Fragment key={t._id}>
                      <ListItem disableGutters alignItems="flex-start" sx={{ py: 1 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {userName.split(' ').map(n => n[0]).slice(0,2).join('')}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" component="span">
                              <strong>{userName}</strong>{' '}
                              <span style={{ color: '#666' }}>{t.status === 'completed' ? 'completed' : 'updated'}</span>{' '}
                              <strong>{t.title}</strong>
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : t.createdAt}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < Math.min(7, tasks.length - 1) && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Progress */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Project Progress Overview
          </Typography>
          <Grid container spacing={2} mt={0.5}>
            {projects.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">No projects available for your account.</Typography>
              </Grid>
            ) : (
              projects.map((project) => (
                <Grid item xs={12} sm={6} key={project.name}>
                  <Box mb={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight={600}>
                        {project.name}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color={STATUS_COLORS[project.status] || '#1976d2'}>
                        {project.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${(STATUS_COLORS[project.status] || '#1976d2')}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: STATUS_COLORS[project.status] || '#1976d2',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              ))
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
