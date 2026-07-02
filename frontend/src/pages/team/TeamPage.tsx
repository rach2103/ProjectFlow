import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  TextField,
  InputAdornment,
} from '@mui/material';
import People from '@mui/icons-material/People';
import Search from '@mui/icons-material/Search';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Assignment from '@mui/icons-material/Assignment';
import { userService } from '../../services/user.service';
import { taskService } from '../../services/task.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#d32f2f',
  project_manager: '#1976d2',
  team_lead: '#7b1fa2',
  developer: '#2e7d32',
  client: '#e65100',
};

const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, isAdmin } = useAuth();
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Queries
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () => userService.getAllUsers({ search: search || undefined, role: roleFilter || undefined }),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasksTeam'],
    queryFn: () => taskService.getAllTasks(),
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => userService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Calculate workloads per user
  const getUserWorkload = (userId: string) => {
    const userTasks = allTasks.filter((t: any) =>
      t.assignees?.some((a: any) => a._id === userId) && t.status !== 'completed'
    );
    const completedTasksCount = allTasks.filter((t: any) =>
      t.assignees?.some((a: any) => a._id === userId) && t.status === 'completed'
    ).length;

    const totalAssigned = userTasks.length;
    const estimatedHours = userTasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);
    const actualHours = userTasks.reduce((sum: number, t: any) => sum + (t.actualHours || 0), 0);

    let workloadLevel: 'Under Capacity' | 'Balanced' | 'Over Capacity' = 'Balanced';
    let workloadColor = '#2e7d32';

    if (totalAssigned <= 2) {
      workloadLevel = 'Under Capacity';
      workloadColor = '#0288d1';
    } else if (totalAssigned > 6) {
      workloadLevel = 'Over Capacity';
      workloadColor = '#d32f2f';
    }

    return {
      totalAssigned,
      completedCount: completedTasksCount,
      estimatedHours,
      actualHours,
      workloadLevel,
      workloadColor,
    };
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3.5}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Team Directory
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          Monitor workload distribution, manage employee roles, and track active task assignments.
        </Typography>
      </Box>

      {/* Filters Toolbar */}
      <Box display="flex" gap={2} mb={4} flexWrap="wrap" sx ={{mb : 3}}>
        <TextField
          size="small"
          placeholder="Search by name, email, or dept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role Filter</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Role Filter"
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="project_manager">Project Manager</MenuItem>
            <MenuItem value="team_lead">Team Lead</MenuItem>
            <MenuItem value="developer">Developer</MenuItem>
            <MenuItem value="client">Client</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Team Load View */}
      {isUsersLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={48} />
        </Box>
      ) : users.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No team members found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Make sure spelling is correct or check the filters.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Member Info</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Active Workload</TableCell>
                <TableCell>Completed Tasks</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Controls</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((member) => {
                const load = getUserWorkload(member._id);
                return (
                  <TableRow key={member._id} hover>
                    {/* User Profile */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar src={member.avatar} sx={{ width: 38, height: 38 }}>
                          {member.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {member.firstName} {member.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Role selector / label */}
                    <TableCell>
                      {isAdmin && member._id !== currentUser?._id ? (
                        <FormControl size="small" sx={{ m: 0, minWidth: 140 }}>
                          <Select
                            value={member.role}
                            onChange={(e) => updateRoleMutation.mutate({ id: member._id, role: e.target.value })}
                            sx={{ fontSize: 13, height: 32, borderRadius: 1.5 }}
                          >
                            <MenuItem value="admin">Administrator</MenuItem>
                            <MenuItem value="project_manager">Project Manager</MenuItem>
                            <MenuItem value="team_lead">Team Lead</MenuItem>
                            <MenuItem value="developer">Developer</MenuItem>
                            <MenuItem value="client">Client</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={member.role.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: `${ROLE_COLORS[member.role]}15`,
                            color: ROLE_COLORS[member.role],
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            borderRadius: 1.5,
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Department */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {member.department || 'N/A'}
                      </Typography>
                    </TableCell>

                    {/* Active Workload */}
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          <Assignment sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" fontWeight={700}>
                            {load.totalAssigned} active tasks
                          </Typography>
                        </Box>
                        <Chip
                          label={load.workloadLevel}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            bgcolor: `${load.workloadColor}15`,
                            color: load.workloadColor,
                            fontWeight: 700,
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </TableCell>

                    {/* Completed tasks */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {load.completedCount} completed
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        icon={member.isActive ? <CheckCircle /> : <ErrorOutlineOutlined />}
                        label={member.isActive ? 'Active' : 'Inactive'}
                        color={member.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: 1.5 }}
                      />
                    </TableCell>

                    {/* Controls (Admin only) */}
                    {isAdmin && (
                      <TableCell align="right">
                        {member._id !== currentUser?._id && (
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Account Active:
                            </Typography>
                            <Switch
                              checked={member.isActive}
                              onChange={() => toggleStatusMutation.mutate(member._id)}
                              color="primary"
                              size="small"
                            />
                          </Box>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TeamPage;
