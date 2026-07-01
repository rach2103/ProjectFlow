import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AttachMoney from '@mui/icons-material/AttachMoney';
import People from '@mui/icons-material/People';
import Assignment from '@mui/icons-material/Assignment';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Circle from '@mui/icons-material/Circle';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { expenseService } from '../../services/expense.service';
import { userService } from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectStatus, ProjectPriority } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#9e9e9e',
  active: '#1976d2',
  on_hold: '#ed6c02',
  completed: '#2e7d32',
  archived: '#7b1fa2',
  cancelled: '#d32f2f',
};

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);

  // Add Member form state
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('developer');

  // Add Expense form state
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState('software');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  // Add Milestone form state
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');

  // Queries
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id!),
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['projectTasks', id],
    queryFn: () => taskService.getAllTasks({ projectId: id! }),
    enabled: !!id,
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['projectExpenses', id],
    queryFn: () => expenseService.getExpensesByProject(id!),
    enabled: !!id,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectService.addProjectMember(id!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsAddMemberOpen(false);
      setMemberUserId('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectService.removeProjectMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: expenseService.addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectExpenses', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsAddExpenseOpen(false);
      setExpenseAmount(0);
      setExpenseDesc('');
      setExpenseDate('');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectExpenses', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: Partial<any>) => projectService.updateProject(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  if (isProjectLoading || !project) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  const projectManagerId = typeof project.projectManager === 'string' ? project.projectManager : project.projectManager?._id;
  const isPM = projectManagerId === currentUser?._id ||
               project.members?.some((m: any) => m.user?._id === currentUser?._id && m.role === 'project_manager') ||
               currentUser?.role === 'admin';

  const budgetProgress = project.budget ? Math.round(((project.spent || 0) / project.budget) * 100) : 0;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate({ userId: memberUserId, role: memberRole });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenseMutation.mutate({
      projectId: id!,
      amount: expenseAmount,
      category: expenseCategory,
      description: expenseDesc,
      date: expenseDate || undefined,
    });
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const newMilestone = {
      title: milestoneTitle,
      description: milestoneDesc,
      dueDate: milestoneDate,
      isCompleted: false,
    };
    const updatedMilestones = [...(project.milestones || []), newMilestone];
    updateProjectMutation.mutate({ milestones: updatedMilestones });
    setIsAddMilestoneOpen(false);
    setMilestoneTitle('');
    setMilestoneDate('');
    setMilestoneDesc('');
  };

  const handleToggleMilestone = (index: number) => {
    const updatedMilestones = [...(project.milestones || [])];
    const item = { ...updatedMilestones[index] };
    item.isCompleted = !item.isCompleted;
    item.completedAt = item.isCompleted ? new Date().toISOString() : undefined;
    updatedMilestones[index] = item;
    updateProjectMutation.mutate({ milestones: updatedMilestones });
  };

  const handleDeleteMilestone = (index: number) => {
    const updatedMilestones = [...(project.milestones || [])];
    updatedMilestones.splice(index, 1);
    updateProjectMutation.mutate({ milestones: updatedMilestones });
  };

  return (
    <Box>
      {/* Back navigation */}
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/projects')} sx={{ mb: 2, textTransform: 'none' }}>
        Back to Projects
      </Button>

      {/* Hero Banner Details */}
      <Card sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                <Chip label={project.key} color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
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
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {project.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {project.description || 'No description provided.'}
              </Typography>

              <Box display="flex" flexWrap="wrap" gap={3} mt={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Project Manager
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Avatar src={(project.projectManager as any)?.avatar} sx={{ width: 24, height: 24 }}>
                      {(project.projectManager as any)?.firstName?.[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                      {(project.projectManager as any)?.firstName} {(project.projectManager as any)?.lastName}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Date Range
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5} color="text.primary">
                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} -{' '}
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'TBD'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Metrics column */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  p: 3,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Tasks Progress
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="primary">
                      {project.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={project.progress} sx={{ height: 6, borderRadius: 3 }} />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Budget Used (${project.spent} / ${project.budget || 0})
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color={budgetProgress > 90 ? 'error' : 'primary'}>
                      {budgetProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, budgetProgress)}
                    color={budgetProgress > 90 ? 'error' : 'success'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, val) => setTabValue(val)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab label="Overview & Milestones" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label={`Tasks (${tasks.length})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Project Members" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Finance & Expenses" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {/* TAB 1: OVERVIEW & MILESTONES */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Milestones
                  </Typography>
                  {isPM && (
                    <Button startIcon={<Add />} onClick={() => setIsAddMilestoneOpen(true)} size="small">
                      Add Milestone
                    </Button>
                  )}
                </Box>
                {(!project.milestones || project.milestones.length === 0) ? (
                  <Typography variant="body2" color="text.secondary" py={2}>
                    No milestones defined for this project.
                  </Typography>
                ) : (
                  <List>
                    {project.milestones.map((milestone: any, index: number) => (
                      <React.Fragment key={milestone._id || index}>
                        <ListItem disableGutters>
                          <ListItemIcon>
                            <Checkbox
                              checked={milestone.isCompleted}
                              disabled={!isPM}
                              onChange={() => handleToggleMilestone(index)}
                              color="success"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ textDecoration: milestone.isCompleted ? 'line-through' : 'none' }}
                              >
                                {milestone.title}
                              </Typography>
                            }
                            secondary={`Due: ${new Date(milestone.dueDate).toLocaleDateString()}`}
                          />
                          {isPM && (
                            <ListItemSecondaryAction>
                              <IconButton edge="end" onClick={() => handleDeleteMilestone(index)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                        {index < project.milestones.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TAB 2: TASKS */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Typography variant="h6" fontWeight={700}>
                Project Tasks
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/tasks')} size="small">
                Go to Task Board
              </Button>
            </Box>
            
            {isTasksLoading ? (
              <CircularProgress size={32} />
            ) : tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks created for this project yet. Head over to Task Board to add a task.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell>Task ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assignee</TableCell>
                      <TableCell>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasks.map((task: any) => (
                      <TableRow key={task._id} hover onClick={() => navigate(`/tasks`)} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Chip label={`${project.key}-${task.order + 1}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {task.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={task.status.replace('_', ' ')} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Chip label={task.priority} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar src={task.assignees?.[0]?.avatar} sx={{ width: 22, height: 22, fontSize: 10 }}>
                              {task.assignees?.[0]?.firstName?.[0]}
                            </Avatar>
                            <Typography variant="body2">
                              {task.assignees?.[0]?.firstName || 'Unassigned'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* TAB 3: MEMBERS */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={700}>
                Project Members
              </Typography>
              {isPM && (
                <Button variant="contained" startIcon={<Add />} onClick={() => setIsAddMemberOpen(true)} size="small">
                  Add Member
                </Button>
              )}
            </Box>

            <List>
              {project.members?.map((member: any, index: number) => (
                <React.Fragment key={member.user?._id || index}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar src={member.user?.avatar}>
                        {member.user?.firstName?.[0]}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {member.user?.firstName} {member.user?.lastName}
                        </Typography>
                      }
                      secondary={member.user?.email}
                    />
                    <Box display="flex" alignItems="center" gap={2}>
                      <Chip label={member.role.replace('_', ' ')} color="primary" size="small" variant="outlined" />
                      {isPM && member.user?._id !== projectManagerId && (
                        <IconButton onClick={() => removeMemberMutation.mutate(member.user?._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                  {index < project.members.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* TAB 4: FINANCE & EXPENSES */}
      <TabPanel value={tabValue} index={3}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Project Budget Logs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Track project hardware, software, travel, and consulting expenses.
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<Add />} onClick={() => setIsAddExpenseOpen(true)} size="small">
                Log Expense
              </Button>
            </Box>

            {isExpensesLoading ? (
              <CircularProgress size={32} />
            ) : expenses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2}>
                No expenses logged for this project yet.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Recorded By</TableCell>
                      <TableCell>Date</TableCell>
                      {isPM && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense: any) => (
                      <TableRow key={expense._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {expense.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={expense.category} size="small" sx={{ textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="error.main">
                            ${expense.amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {expense.recordedBy?.firstName} {expense.recordedBy?.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(expense.date).toLocaleDateString()}
                        </TableCell>
                        {isPM && (
                          <TableCell align="right">
                            <IconButton onClick={() => deleteExpenseMutation.mutate(expense._id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleAddMember}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Member to Project</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <FormControl fullWidth required>
                <InputLabel id="add-member-user-label">Select Team Member</InputLabel>
                <Select
                  labelId="add-member-user-label"
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  label="Select Team Member"
                >
                  {allUsers
                    .filter((u) => !project.members?.some((m: any) => m.user?._id === u._id))
                    .map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="add-member-role-label">Project Role</InputLabel>
                <Select
                  labelId="add-member-role-label"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  label="Project Role"
                >
                  <MenuItem value="project_manager">Project Manager</MenuItem>
                  <MenuItem value="team_lead">Team Lead</MenuItem>
                  <MenuItem value="developer">Developer</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setIsAddMemberOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }} disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleAddExpense}>
          <DialogTitle sx={{ fontWeight: 700 }}>Log Project Expense</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
              <TextField
                fullWidth
                required
                type="number"
                label="Amount ($)"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
              />
              <FormControl fullWidth required>
                <InputLabel id="expense-cat-label">Category</InputLabel>
                <Select
                  labelId="expense-cat-label"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="software">Software license</MenuItem>
                  <MenuItem value="hardware">Hardware purchase</MenuItem>
                  <MenuItem value="travel">Travel & lodging</MenuItem>
                  <MenuItem value="consulting">Professional Consulting</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                required
                label="Description"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
              <TextField
                fullWidth
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setIsAddExpenseOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }} disabled={addExpenseMutation.isPending}>
              {addExpenseMutation.isPending ? 'Logging...' : 'Log Expense'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={isAddMilestoneOpen} onClose={() => setIsAddMilestoneOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleAddMilestone}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Project Milestone</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
              <TextField
                fullWidth
                required
                label="Milestone Title"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
              />
              <TextField
                fullWidth
                type="date"
                required
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
              />
              <TextField
                fullWidth
                label="Description"
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setIsAddMilestoneOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }} disabled={updateProjectMutation.isPending}>
              {updateProjectMutation.isPending ? 'Adding...' : 'Add Milestone'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailsPage;
