import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Checklist from '@mui/icons-material/Checklist';
import Person from '@mui/icons-material/Person';
import Search from '@mui/icons-material/Search';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { userService } from '../../services/user.service';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import type { Task, TaskPriority, TaskStatus } from '../../types';

const COLUMNS: Array<{ key: TaskStatus; label: string; color: string }> = [
  { key: 'todo', label: 'Todo', color: '#ed6c02' },
  { key: 'in_progress', label: 'In Progress', color: '#1976d2' },
  { key: 'review', label: 'Review', color: '#9c27b0' },
  { key: 'testing', label: 'Testing', color: '#0288d1' },
  { key: 'completed', label: 'Completed', color: '#2e7d32' },
];

const PRIORITY_COLORS: Record<TaskPriority, 'info' | 'warning' | 'error'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId, priority, assigneeId, search],
    queryFn: () =>
      taskService.getAllTasks({
        projectId: projectId || undefined,
        priority: priority || undefined,
        assigneeId: assigneeId || undefined,
        search: search || undefined,
      }),
  });

  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
      setDescription('');
      setNewPriority('medium');
      setNewAssigneeId('');
      setDueDate('');
      setIsCreateOpen(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce<Record<TaskStatus, Task[]>>(
      (acc, column) => {
        acc[column.key] = tasks.filter((task) => task.status === column.key);
        return acc;
      },
      {
        todo: [],
        in_progress: [],
        review: [],
        testing: [],
        completed: [],
      }
    );
  }, [tasks]);

  const handleOpenCreate = () => {
    setNewProjectId(projectId || projects[0]?._id || '');
    setIsCreateOpen(true);
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !newProjectId) return;

    createTaskMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: newProjectId,
      priority: newPriority,
      assigneeIds: newAssigneeId ? [newAssigneeId] : [],
      dueDate: dueDate || undefined,
    });
  };

  const getProjectLabel = (task: Task) => {
    if (typeof task.project === 'string') return '';
    return `[${task.project.key}]`;
  };

  const getAssigneeLabel = (task: Task) => {
    const assignee = task.assignees?.[0];
    if (!assignee || typeof assignee === 'string') return 'Unassigned';
    return `${assignee.firstName} ${assignee.lastName}`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Task Board
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            Organize work by status, priority, project, and assignee.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          disabled={projects.length === 0}
          sx={{ borderRadius: 2 ,mb : 2}}
        >
          New Task
        </Button>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ width: { xs: '100%', sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Project</InputLabel>
          <Select value={projectId} label="Project" onChange={(event) => setProjectId(event.target.value)}>
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                [{project.key}] {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priority} label="Priority" onChange={(event) => setPriority(event.target.value)}>
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Assignee</InputLabel>
          <Select value={assigneeId} label="Assignee" onChange={(event) => setAssigneeId(event.target.value)}>
            <MenuItem value="">All Assignees</MenuItem>
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Grid container spacing={2} wrap="nowrap" sx={{ minWidth: 1100 }}>
            {COLUMNS.map((column) => (
              <Grid item key={column.key} sx={{ width: 220, minWidth: 220 }}>
                <Card sx={{ borderRadius: 3, height: '100%', bgcolor: 'action.hover' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {column.label}
                      </Typography>
                      <Chip
                        label={tasksByStatus[column.key].length}
                        size="small"
                        sx={{ bgcolor: `${column.color}20`, color: column.color, fontWeight: 700 }}
                      />
                    </Box>

                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {tasksByStatus[column.key].map((task) => (
                        <Card key={task._id} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {getProjectLabel(task)}
                              </Typography>
                              <Chip
                                label={task.priority}
                                color={PRIORITY_COLORS[task.priority]}
                                size="small"
                                sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
                              />
                            </Box>
                            <Typography variant="body2" fontWeight={700} mb={1}>
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                mb={1}
                                sx={{
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {task.description}
                              </Typography>
                            )}
                            <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {getAssigneeLabel(task)}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Checklist sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {task.checklist?.filter((item) => item.isCompleted).length || 0}/{task.checklist?.length || 0}
                                </Typography>
                              </Box>
                            </Box>
                            <FormControl fullWidth size="small">
                              <Select
                                value={task.status}
                                onChange={(event) =>
                                  updateTaskMutation.mutate({ id: task._id, status: event.target.value as TaskStatus })
                                }
                              >
                                {COLUMNS.map((status) => (
                                  <MenuItem key={status.key} value={status.key}>
                                    {status.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </CardContent>
                        </Card>
                      ))}
                      {tasksByStatus[column.key].length === 0 && (
                        <Box textAlign="center" py={3}>
                          <Typography variant="caption" color="text.secondary">
                            No tasks
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle>Create Task</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Project</InputLabel>
              <Select value={newProjectId} label="Project" onChange={(event) => setNewProjectId(event.target.value)}>
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    [{project.key}] {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newPriority}
                label="Priority"
                onChange={(event) => setNewPriority(event.target.value as TaskPriority)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select value={newAssigneeId} label="Assignee" onChange={(event) => setNewAssigneeId(event.target.value)}>
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date"
                value={dueDate ? dayjs(dueDate) : null}
                onChange={(newValue) => setDueDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default TasksPage;
