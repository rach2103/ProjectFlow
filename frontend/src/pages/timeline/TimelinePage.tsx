import React, { useState, useMemo } from 'react';
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
  Grid,
  Chip,
  Tooltip,
} from '@mui/material';
import Timeline from '@mui/icons-material/Timeline';
import CalendarToday from '@mui/icons-material/CalendarToday';
import FolderOpen from '@mui/icons-material/FolderOpen';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  todo: '#ed6c02',
  in_progress: '#1976d2',
  review: '#9c27b0',
  testing: '#0288d1',
  completed: '#2e7d32',
};

const TimelinePage: React.FC = () => {
  const [projectId, setProjectId] = useState('');

  // Queries
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasksTimeline', projectId],
    queryFn: () => taskService.getAllTasks({ projectId }),
    enabled: !!projectId,
  });

  // Automatically select the first project
  React.useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, projectId]);

  // Process tasks to calculate dates and horizontal positioning
  const timelineData = useMemo(() => {
    const validTasks = tasks.filter((t: any) => (t.startDate && t.dueDate) || t.status === 'completed');
    if (validTasks.length === 0) return { tasks: [], days: [], minDateStr: '', maxDateStr: '' };

    // Find min and max date — use createdAt as fallback for completed tasks without dates
    let minDate = dayjs(validTasks[0].startDate || validTasks[0].createdAt);
    let maxDate = dayjs(validTasks[0].dueDate || validTasks[0].createdAt);

    validTasks.forEach((t: any) => {
      const start = dayjs(t.startDate || t.createdAt);
      const due = dayjs(t.dueDate || t.createdAt);
      if (start.isBefore(minDate)) minDate = start;
      if (due.isAfter(maxDate)) maxDate = due;
    });

    // Add buffers: 3 days before and after
    minDate = minDate.subtract(3, 'day');
    maxDate = maxDate.add(3, 'day');

    const totalDays = maxDate.diff(minDate, 'day') + 1;
    const daysArray: dayjs.Dayjs[] = [];
    for (let i = 0; i < totalDays; i++) {
      daysArray.push(minDate.add(i, 'day'));
    }

    const processedTasks = validTasks.map((t: any) => {
      const start = dayjs(t.startDate || t.createdAt);
      const due = dayjs(t.dueDate || t.createdAt);
      const duration = Math.max(1, due.diff(start, 'day') + 1);
      const offset = Math.max(0, start.diff(minDate, 'day'));

      const completedChecklist = t.checklist?.filter((item: any) => item.isCompleted).length || 0;
      const totalChecklist = t.checklist?.length || 0;
      const progress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : (t.status === 'completed' ? 100 : 0);

      return {
        ...t,
        offset,
        duration,
        progress,
      };
    });

    return {
      tasks: processedTasks,
      days: daysArray,
      minDateStr: minDate.format('MMM DD, YYYY'),
      maxDateStr: maxDate.format('MMM DD, YYYY'),
    };
  }, [tasks]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Timeline & Gantt Chart
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualize project schedule, milestones, and task dependencies.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            label="Select Project"
            sx={{ borderRadius: 2 }}
          >
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                [{p.key}] {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Main Timeline Card */}
      {!projectId ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No project selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a project from the drop-down list to load its schedule.
          </Typography>
        </Card>
      ) : isTasksLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={48} />
        </Box>
      ) : timelineData.tasks.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No task schedule found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ensure your project tasks have both **Start Date** and **Due Date** filled out.
          </Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            {/* Timeline Header Info */}
            <Box px={3} py={2} display="flex" justifyContent="space-between" bgcolor="action.hover" borderBottom="1px solid" borderColor="divider">
              <Typography variant="subtitle2" fontWeight={700}>
                Schedule Range: {timelineData.minDateStr} – {timelineData.maxDateStr}
              </Typography>
              <Box display="flex" gap={2}>
                <Chip label="Todo" size="small" sx={{ bgcolor: `${STATUS_COLORS.todo}15`, color: STATUS_COLORS.todo, fontWeight: 600 }} />
                <Chip label="In Progress" size="small" sx={{ bgcolor: `${STATUS_COLORS.in_progress}15`, color: STATUS_COLORS.in_progress, fontWeight: 600 }} />
                <Chip label="Review" size="small" sx={{ bgcolor: `${STATUS_COLORS.review}15`, color: STATUS_COLORS.review, fontWeight: 600 }} />
                <Chip label="Completed" size="small" sx={{ bgcolor: `${STATUS_COLORS.completed}15`, color: STATUS_COLORS.completed, fontWeight: 600 }} />
              </Box>
            </Box>

            {/* Gantt Container */}
            <Box sx={{ overflowX: 'auto', p: 3 }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Time Scale Row */}
                <Box display="flex" mb={1} borderBottom="2px solid" borderColor="divider" pb={1}>
                  {/* Left task title spacer */}
                  <Box sx={{ width: 220, minWidth: 220, pr: 2 }} />

                  {/* Day ticks */}
                  <Box display="flex" flexGrow={1} justifyContent="space-between">
                    {timelineData.days.map((day, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: `${100 / timelineData.days.length}%`,
                          textAlign: 'center',
                          borderLeft: idx > 0 ? '1px dashed' : 'none',
                          borderColor: 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: 9 }} color="text.secondary">
                          {day.format('ddd')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700 }} color="text.primary">
                          {day.format('DD')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Gantt Tasks Rows */}
                {timelineData.tasks.map((task) => {
                  const dayWidthPct = 100 / timelineData.days.length;
                  const leftOffsetPct = task.offset * dayWidthPct;
                  const durationWidthPct = task.duration * dayWidthPct;

                  return (
                    <Box key={task._id} display="flex" alignItems="center" py={1.5} borderBottom="1px solid" borderColor="divider" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      {/* Left Side: Task title details */}
                      <Box sx={{ width: 220, minWidth: 220, pr: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Assignee: {task.assignees?.[0]?.firstName || 'Unassigned'}
                        </Typography>
                      </Box>

                      {/* Right Side: Timeline bar track */}
                      <Box display="flex" flexGrow={1} sx={{ position: 'relative', height: 28, bgcolor: 'action.selected', borderRadius: 1.5 }}>
                        <Tooltip
                          title={
                            <Box sx={{ p: 0.5 }}>
                              <Typography variant="body2" fontWeight={700}>{task.title}</Typography>
                              <Typography variant="caption" display="block">Dates: {dayjs(task.startDate).format('MMM DD')} - {dayjs(task.dueDate).format('MMM DD')}</Typography>
                              <Typography variant="caption" display="block">Status: {task.status}</Typography>
                              <Typography variant="caption" display="block">Progress: {task.progress}%</Typography>
                            </Box>
                          }
                          arrow
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${leftOffsetPct}%`,
                              width: `${durationWidthPct}%`,
                              height: '100%',
                              bgcolor: STATUS_COLORS[task.status] || '#ccc',
                              borderRadius: 1.5,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              px: 1.5,
                              overflow: 'hidden',
                              boxShadow: 2,
                            }}
                          >
                            {/* Inner progress bar overlay */}
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${task.progress}%`,
                                bgcolor: 'rgba(0, 0, 0, 0.15)',
                                zIndex: 1,
                              }}
                            />
                            
                            {/* Task key / text */}
                            <Typography variant="caption" fontWeight={700} sx={{ zIndex: 2, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                              {task.progress}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TimelinePage;
