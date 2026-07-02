import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { timeService } from '../../services/time.service';
import { expenseService } from '../../services/expense.service';
import { collaborationService } from '../../services/collaboration.service';
import CalendarFilters from './CalendarFilters';
import SummaryCards from './SummaryCards';
import ActivityCalendar from './ActivityCalendar';
import ActivityDrawer from './ActivityDrawer';
import { useCalendarData } from './useCalendarData';
import { CalendarFiltersState } from './types';
import { User } from '../../types';

const INITIAL_FILTERS: CalendarFiltersState = {
  memberId: '',
  taskStatus: '',
  priority: '',
  activityType: '',
  dateFrom: '',
  dateTo: '',
};

const TimelinePage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFiltersState>(INITIAL_FILTERS);

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === projectId) || null,
    [projects, projectId]
  );

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: () => taskService.getAllTasks({ projectId }),
    enabled: !!projectId,
  });

  const { data: timeLogs = [], isLoading: isTimeLoading } = useQuery({
    queryKey: ['projectTimeLogs', projectId],
    queryFn: () => timeService.getTimeLogs({ projectId }),
    enabled: !!projectId,
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['projectExpenses', projectId],
    queryFn: () => expenseService.getExpensesByProject(projectId),
    enabled: !!projectId,
  });

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ['projectComments', projectId, tasks.map((task) => task._id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(tasks.map((task) => collaborationService.getCommentsByTask(task._id)));
      return results.flat();
    },
    enabled: !!projectId && tasks.length > 0,
  });

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, projectId]);

  useEffect(() => {
    setSelectedDate('');
    setIsDrawerOpen(false);
    setFilters(INITIAL_FILTERS);
  }, [projectId]);

  const members = useMemo(() => {
    const userMap = new Map<string, User>();

    selectedProject?.members.forEach((member) => {
      const user = member.user as User;
      if (user?._id) {
        userMap.set(user._id, user);
      }
    });

    tasks.forEach((task) => {
      task.assignees.forEach((assignee) => {
        const user = assignee as User;
        if (user?._id) {
          userMap.set(user._id, user);
        }
      });
    });

    return Array.from(userMap.values());
  }, [selectedProject, tasks]);

  const isLoading = isProjectsLoading || isTasksLoading || isTimeLoading || isExpensesLoading || isCommentsLoading;

  const { dayMap, summary } = useCalendarData(
    tasks,
    timeLogs,
    expenses,
    selectedProject,
    filters,
    currentMonth,
    comments
  );

  const currentDayData = selectedDate ? dayMap.get(selectedDate) : undefined;
  const hasActivity = Array.from(dayMap.values()).some((day) => day.activityCount > 0);

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDrawerOpen(true);
  };

  const handlePreviousMonth = () => setCurrentMonth((month) => month.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth((month) => month.add(1, 'month'));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Project Activity Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Track task progress, team actions, budget updates, and milestone activity in a modern calendar dashboard.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 220 ,mb: 2 }} >
          <InputLabel>Select Project</InputLabel>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            label="Select Project"
            sx={{ borderRadius: 2 }}
          >
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                [{project.key}] {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!projectId ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Choose a project to view activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The activity calendar will load your project tasks, time logs, expenses, and milestones.
          </Typography>
        </Card>
      ) : isLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          <SummaryCards summary={summary} />

          <CalendarFilters filters={filters} onChange={setFilters} members={members} />

          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <ActivityCalendar
                dayMap={dayMap}
                currentMonth={currentMonth}
                onDateClick={handleDateClick}
                onPrevMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
              />

              {!hasActivity && (
                <Box sx={{ mt: 4, textAlign: 'center', p: 4, borderRadius: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    No activity found for this project.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add tasks, track time, upload files, or complete milestones to populate your calendar.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <ActivityDrawer
        open={isDrawerOpen}
        date={selectedDate}
        dayData={currentDayData}
        onClose={() => setIsDrawerOpen(false)}
      />
      </Box>
    </LocalizationProvider>
  );
};

export default TimelinePage;
