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

// ─── Mock Data (will be replaced with API calls in later sprints) ───────────

const MONTHLY_STATS = [
  { month: 'Jul', tasks: 45, completed: 38, projects: 5 },
  { month: 'Aug', tasks: 62, completed: 54, projects: 7 },
  { month: 'Sep', tasks: 58, completed: 49, projects: 6 },
  { month: 'Oct', tasks: 71, completed: 65, projects: 8 },
  { month: 'Nov', tasks: 83, completed: 74, projects: 9 },
  { month: 'Dec', tasks: 92, completed: 85, projects: 11 },
];

const TASK_STATUS_DATA = [
  { name: 'Completed', value: 85, color: '#2e7d32' },
  { name: 'In Progress', value: 32, color: '#1976d2' },
  { name: 'Review', value: 18, color: '#9c27b0' },
  { name: 'Todo', value: 28, color: '#ed6c02' },
];

const TEAM_WORKLOAD = [
  { name: 'Alice J.', tasks: 8, capacity: 10 },
  { name: 'Bob S.', tasks: 6, capacity: 10 },
  { name: 'Carol M.', tasks: 9, capacity: 10 },
  { name: 'David L.', tasks: 4, capacity: 10 },
  { name: 'Eve P.', tasks: 7, capacity: 10 },
];

const RECENT_ACTIVITY = [
  { user: 'Alice Johnson', action: 'completed task', item: 'Design system setup', time: '5m ago', avatar: 'A' },
  { user: 'Bob Smith', action: 'commented on', item: 'API Integration PR', time: '12m ago', avatar: 'B' },
  { user: 'Carol Martinez', action: 'created project', item: 'E-commerce Platform', time: '1h ago', avatar: 'C' },
  { user: 'David Lee', action: 'moved task to', item: 'In Progress', time: '2h ago', avatar: 'D' },
  { user: 'Eve Parker', action: 'uploaded file to', item: 'Project Alpha', time: '3h ago', avatar: 'E' },
];

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
      <Typography variant="caption" color="text.secondary">
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

  return (
    <Box>
      {/* Welcome Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {greeting()}, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Here's what's happening with your projects today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Projects"
            value={24}
            subtitle="3 completed this month"
            icon={<FolderOpen />}
            color="#1976d2"
            trend={{ value: 12, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Tasks"
            value={163}
            subtitle="32 due this week"
            icon={<Assignment />}
            color="#9c27b0"
            trend={{ value: 8, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Completed Tasks"
            value={85}
            subtitle="↑ 18% from last month"
            icon={<CheckCircle />}
            color="#2e7d32"
            trend={{ value: 18, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Overdue Tasks"
            value={12}
            subtitle="Requires immediate attention"
            icon={<Warning />}
            color="#d32f2f"
            trend={{ value: 5, isPositive: false }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Team Members"
            value={18}
            subtitle="5 roles, 3 departments"
            icon={<People />}
            color="#0288d1"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Hours Tracked"
            value="1,248h"
            subtitle="This month"
            icon={<Timer />}
            color="#ed6c02"
            trend={{ value: 6, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Budget Used"
            value="68%"
            subtitle="$68,000 of $100,000"
            icon={<AttachMoney />}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Productivity"
            value="87%"
            subtitle="Above target (80%)"
            icon={<TrendingUp />}
            color="#2e7d32"
            trend={{ value: 4, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} mb={3}>
        {/* Task Completion Trend */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 340 }}>
            <CardContent sx={{ height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Task Completion Trend
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Monthly overview
                  </Typography>
                </Box>
                <Tooltip title="More options"><IconButton size="small"><MoreVert /></IconButton></Tooltip>
              </Box>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={MONTHLY_STATS} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            </CardContent>
          </Card>
        </Grid>

        {/* Task Status Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 340 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Task Status
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current sprint
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={TASK_STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {TASK_STATUS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                {TASK_STATUS_DATA.map((item) => (
                  <Chip
                    key={item.name}
                    label={`${item.name}: ${item.value}`}
                    size="small"
                    sx={{
                      bgcolor: item.color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Workload */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Team Workload
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Current task distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TEAM_WORKLOAD} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                  <RechartsTooltip />
                  <Bar dataKey="tasks" fill="#1976d2" radius={[0, 4, 4, 0]} name="Active Tasks" />
                  <Bar dataKey="capacity" fill="#e3f2fd" radius={[0, 4, 4, 0]} name="Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Latest team updates
              </Typography>
              <List dense disablePadding>
                {RECENT_ACTIVITY.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem disableGutters alignItems="flex-start" sx={{ py: 1 }}>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                          {activity.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" component="span">
                            <strong>{activity.user}</strong>{' '}
                            <span style={{ color: '#666' }}>{activity.action}</span>{' '}
                            <strong>{activity.item}</strong>
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < RECENT_ACTIVITY.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
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
            {[
              { name: 'E-Commerce Platform', progress: 72, status: 'active', color: '#1976d2' },
              { name: 'Mobile App Redesign', progress: 45, status: 'active', color: '#9c27b0' },
              { name: 'Data Analytics Dashboard', progress: 91, status: 'active', color: '#2e7d32' },
              { name: 'CRM Integration', progress: 28, status: 'active', color: '#ed6c02' },
            ].map((project) => (
              <Grid item xs={12} sm={6} key={project.name}>
                <Box mb={1}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={project.color}>
                      {project.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${project.color}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: project.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
