import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  IconButton,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import FilterList from '@mui/icons-material/FilterList';
import FolderOpen from '@mui/icons-material/FolderOpen';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Flag from '@mui/icons-material/Flag';
import ArrowForward from '@mui/icons-material/ArrowForward';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectStatus, ProjectPriority } from '../../types';

const PRIORITY_COLORS: Record<ProjectPriority, 'info' | 'warning' | 'error' | 'success'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#9e9e9e',
  active: '#1976d2',
  on_hold: '#ed6c02',
  completed: '#2e7d32',
  archived: '#7b1fa2',
  cancelled: '#d32f2f',
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Project Form State
  const [formName, setFormName] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<ProjectPriority>('medium');
  const [formBudget, setFormBudget] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPM, setFormPM] = useState('');

  // Queries
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: () => projectService.getAllProjects({ search, status: statusFilter }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleCloseCreate();
    },
  });

  const handleOpenCreate = () => {
    setFormPM(currentUser?._id || '');
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setFormName('');
    setFormKey('');
    setFormDesc('');
    setFormPriority('medium');
    setFormBudget('');
    setFormStartDate('');
    setFormEndDate('');
    setFormDueDate('');
    setIsCreateOpen(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formName,
      key: formKey,
      description: formDesc,
      priority: formPriority,
      budget: Number(formBudget),
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
      dueDate: formDueDate || undefined,
      projectManagerId: formPM,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={2}
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{mb: 2}}>
              Projects
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
              Manage your workspace projects, milestones, and budgets.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              minWidth: 160,
              height: 48,
              boxShadow: 2,
              mb : 3,
            }}
          >
            New Project
          </Button>
        </Box>

        {/* Filter Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <TextField
            size="medium"
            placeholder="Search by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl
            size="medium"
            sx={{
              minWidth: 180,
            }}
          >
            <InputLabel id="status-filter-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" /> Status
            </InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Project Grid */}
        {isProjectsLoading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={48} />
          </Box>
        ) : projects.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed', borderWidth: 1 }}>
            <Box mb={2}>
              <FolderOpen sx={{ fontSize: 48, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Start tracking team workloads by creating a new project.
            </Typography>
            <Button variant="outlined" onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Create Project
            </Button>
          </Card>
        ) : (
          <Grid container spacing={4} sx={{ mt: 1 }} alignItems="stretch">
            {projects.map((project) => (
              <Grid item xs={12} sm={6} lg={4} key={project._id}>
                <Card
                  className="hover-lift"
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Top Badges */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip
                        label={project.key}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                      <Box display="flex" gap={1}>
                        <Chip
                          label={project.priority}
                          color={PRIORITY_COLORS[project.priority]}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize', borderRadius: 1.5 }}
                        />
                        <Chip
                          label={project.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: `${STATUS_COLORS[project.status]}15`,
                            color: STATUS_COLORS[project.status],
                            borderColor: STATUS_COLORS[project.status],
                            borderWidth: 1,
                            borderStyle: 'solid',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            borderRadius: 1.5,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Title & Description */}
                    <Typography variant="h5" fontWeight={800} gutterBottom noWrap>
                      {project.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="truncate-2"
                      sx={{
                        mb: 3,
                        minHeight: 44,
                      }}
                    >
                      {project.description || 'No description provided.'}
                    </Typography>

                    {/* Progress bar */}
                    <Box mb={4} flex={1}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                          Progress
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color="primary">
                          {project.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
                      {/* Dates */}
                      <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                        <CalendarToday sx={{ fontSize: 16 }} />
                        <Typography variant="caption" fontWeight={600}>
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No due date'}
                        </Typography>
                      </Box>

                      {/* Members */}
                      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: 11 } }}>
                        {project.members?.map((m: any) => (
                          <Tooltip key={m.user?._id || m.user} title={`${m.user?.firstName || 'User'} (${m.role})`}>
                            <Avatar src={m.user?.avatar}>
                              {m.user?.firstName?.[0]}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Project Dialog */}
        <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'visible' } }}>
          <form onSubmit={handleCreateSubmit}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1 }}>Create New Project</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Basic Data Section */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} textTransform="uppercase" letterSpacing="0.05em" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
                      Basic Data
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          label="Project Name"
                          required
                          placeholder="e.g. Website Redesign"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Key"
                          required
                          placeholder="PMS"
                          value={formKey}
                          onChange={(e) => setFormKey(e.target.value)}
                          inputProps={{ maxLength: 5 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                          placeholder="Briefly describe the project goals..."
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Planning & Financials Section */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} textTransform="uppercase" letterSpacing="0.05em" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
                      Planning & Financials
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel id="create-priority-label">Priority</InputLabel>
                          <Select
                            labelId="create-priority-label"
                            value={formPriority}
                            onChange={(e) => setFormPriority(e.target.value as ProjectPriority)}
                            label="Priority"
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                            <MenuItem value="critical">Critical</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Budget ($)"
                          placeholder="0.00"
                          value={formBudget}
                          onChange={(e) => setFormBudget(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Schedule Section */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} textTransform="uppercase" letterSpacing="0.05em" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
                      Schedule
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="Start Date"
                          value={formStartDate ? dayjs(formStartDate) : null}
                          onChange={(newValue) =>
                            setFormStartDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                          }
                          slotProps={{
                            textField: { fullWidth: true },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="End Date"
                          value={formEndDate ? dayjs(formEndDate) : null}
                          onChange={(newValue) =>
                            setFormEndDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                          }
                          slotProps={{
                            textField: { fullWidth: true },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="Due Date"
                          value={formDueDate ? dayjs(formDueDate) : null}
                          onChange={(newValue) =>
                            setFormDueDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                          }
                          slotProps={{
                            textField: { fullWidth: true },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Team Section */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} textTransform="uppercase" letterSpacing="0.05em" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
                      Team
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel id="create-pm-label">Project Manager</InputLabel>
                          <Select
                            labelId="create-pm-label"
                            value={formPM}
                            onChange={(e) => setFormPM(e.target.value)}
                            label="Project Manager"
                          >
                            {users.map((u) => (
                              <MenuItem key={u._id} value={u._id}>
                                {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={handleCloseCreate} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ProjectsPage;
