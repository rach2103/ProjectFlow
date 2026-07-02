import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { userService } from '../../services/user.service';
import { timeService } from '../../services/time.service';
import type { TaskStatus } from '../../types';

const COLORS = ['#1976d2', '#9c27b0', '#ed6c02', '#2e7d32', '#0288d1', '#7b1fa2', '#e65100'];

const ReportsPage: React.FC = () => {
  // Queries
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['allTasksReports'],
    queryFn: () => taskService.getAllTasks(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['allTimeLogsReports'],
    queryFn: () => timeService.getTimeLogs(),
  });

  const isLoading = isProjectsLoading || isTasksLoading;

  // Process data for charts
  const reportData = useMemo(() => {
    if (isLoading) return null;

    // 1. Task Status Breakdown
    const statusCounts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, testing: 0, completed: 0 };
    tasks.forEach((t: any) => {
      const status = t.status as TaskStatus;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });
    const taskStatusChart = [
      { name: 'Todo', value: statusCounts.todo, color: '#ed6c02' },
      { name: 'In Progress', value: statusCounts.in_progress, color: '#1976d2' },
      { name: 'Review', value: statusCounts.review, color: '#9c27b0' },
      { name: 'Testing', value: statusCounts.testing, color: '#0288d1' },
      { name: 'Completed', value: statusCounts.completed, color: '#2e7d32' },
    ].filter((item) => item.value > 0);

    // 2. Budget vs Spent by Project
    const budgetChart = projects.map((p) => ({
      name: p.name,
      budget: p.budget || 0,
      spent: p.spent || 0,
    }));

    // 3. User Hours Logged
    const hoursByUserMap: Record<string, { name: string; hours: number }> = {};
    users.forEach((u) => {
      hoursByUserMap[u._id] = { name: `${u.firstName} ${u.lastName[0]}.`, hours: 0 };
    });
    timeLogs.forEach((l: any) => {
      const uId = typeof l.user === 'string' ? l.user : l.user?._id;
      if (uId && hoursByUserMap[uId]) {
        hoursByUserMap[uId].hours += (l.duration / 60);
      }
    });
    const hoursByUserChart = Object.values(hoursByUserMap)
      .map((item) => ({ ...item, hours: Number(item.hours.toFixed(1)) }))
      .filter((item) => item.hours > 0);

    // 4. Task Completion Rate & Velocity
    // Tasks completed in last 6 months
    const monthlyCompletion: Record<string, { month: string; created: number; completed: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed latest 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = `${months[d.getMonth()]}`;
      monthlyCompletion[mLabel] = { month: mLabel, created: 0, completed: 0 };
    }

    tasks.forEach((t: any) => {
      const createdMonth = months[new Date(t.createdAt).getMonth()];
      if (monthlyCompletion[createdMonth]) {
        monthlyCompletion[createdMonth].created++;
      }

      if (t.status === 'completed' && t.completedAt) {
        const completedMonth = months[new Date(t.completedAt).getMonth()];
        if (monthlyCompletion[completedMonth]) {
          monthlyCompletion[completedMonth].completed++;
        }
      }
    });

    const completionVelocityChart = Object.values(monthlyCompletion);

    return {
      taskStatusChart,
      budgetChart,
      hoursByUserChart,
      completionVelocityChart,
    };
  }, [isLoading, projects, tasks, users, timeLogs]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3.5}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Workspace Reports & Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track sprint completions, evaluate project budgets, and monitor developer workloads.
        </Typography>
      </Box>

      {/* Grid of charts */}
      <Grid container spacing={3.5}>
        {/* Chart 1: Task Completion Velocity */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, height: 360 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                Task Velocity (Created vs Completed)
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={reportData?.completionVelocityChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="created" stroke="#1976d2" fill="url(#createdGrad)" name="Tasks Created" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" stroke="#2e7d32" fill="url(#completedGrad)" name="Tasks Completed" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: Task Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: 360 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                Overall Task Statuses
              </Typography>
              {reportData?.taskStatusChart.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                  <Typography variant="caption" color="text.secondary">No tasks available</Typography>
                </Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={reportData?.taskStatusChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {reportData?.taskStatusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                    {reportData?.taskStatusChart.map((item) => (
                      <Chip
                        key={item.name}
                        label={`${item.name}: ${item.value}`}
                        size="small"
                        sx={{
                          bgcolor: item.color,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 10,
                          height: 22,
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 3: Budget Spent Stacked bar */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, height: 340 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                Budget Utilization by Project
              </Typography>
              <ResponsiveContainer width="100%" height={260}>
                <RechartsBarChart data={reportData?.budgetChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="budget" fill="#e3f2fd" radius={[4, 4, 0, 0]} name="Allocated Budget ($)" />
                  <Bar dataKey="spent" fill="#e53935" radius={[4, 4, 0, 0]} name="Spent Balance ($)" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 4: Time Logged by User */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, height: 340 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                Hours Tracked per User
              </Typography>
              {reportData?.hoursByUserChart.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                  <Typography variant="caption" color="text.secondary">No hours logged yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <RechartsBarChart data={reportData?.hoursByUserChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#43a047" radius={[4, 4, 0, 0]} name="Actual Logged Hours (hrs)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
