import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddComment from '@mui/icons-material/AddComment';
import Chat from '@mui/icons-material/Chat';
import FolderOpen from '@mui/icons-material/FolderOpen';
import Notifications from '@mui/icons-material/Notifications';
import Send from '@mui/icons-material/Send';
import dayjs from 'dayjs';
import { collaborationService } from '../../services/collaboration.service';
import { notificationService } from '../../services/notification.service';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { Comment, Task } from '../../types';

const CollaborationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [comment, setComment] = useState('');

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['collaborationTasks', projectId],
    queryFn: () => taskService.getAllTasks({ projectId: projectId || undefined }),
    enabled: !!projectId,
  });

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => collaborationService.getCommentsByTask(taskId),
    enabled: !!taskId,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  React.useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, projectId]);

  React.useEffect(() => {
    if (tasks.length > 0 && !tasks.some((task) => task._id === taskId)) {
      setTaskId(tasks[0]._id);
    } else if (tasks.length === 0) {
      setTaskId('');
    }
  }, [tasks]);

  const addCommentMutation = useMutation({
    mutationFn: () => collaborationService.addComment(taskId, comment.trim()),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const selectedTask = useMemo(
    () => tasks.find((task) => task._id === taskId),
    [tasks, taskId]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskId || !comment.trim()) return;
    addCommentMutation.mutate();
  };

  const renderTaskLabel = (task: Task) => {
    const projectName =
      typeof task.project === 'string' ? '' : ` - ${task.project.name}`;
    return `${task.title}${projectName}`;
  };

  const renderCommentAuthor = (item: Comment) => {
    const firstName = item.author?.firstName || 'Team';
    const lastName = item.author?.lastName || 'Member';
    return `${firstName} ${lastName}`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Collaboration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Coordinate task discussions, mentions, and recent workspace alerts.
          </Typography>
        </Box>
        <Chip
          icon={<Chat />}
          label={`${comments.length} comments`}
          color="primary"
          variant="outlined"
          sx={{ borderRadius: 1.5, fontWeight: 700 }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth size="small" disabled={isProjectsLoading}>
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={projectId}
                      label="Project"
                      onChange={(event) => {
                        setProjectId(event.target.value);
                        setTaskId('');
                      }}
                    >
                      {projects.map((project) => (
                        <MenuItem key={project._id} value={project._id}>
                          [{project.key}] {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={7}>
                  <FormControl fullWidth size="small" disabled={!projectId || isTasksLoading}>
                    <InputLabel>Task Thread</InputLabel>
                    <Select
                      value={taskId}
                      label="Task Thread"
                      onChange={(event) => setTaskId(event.target.value)}
                    >
                      {tasks.map((task) => (
                        <MenuItem key={task._id} value={task._id}>
                          {renderTaskLabel(task)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {isTasksLoading || isCommentsLoading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : !projectId ? (
                <Box textAlign="center" py={8}>
                  <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700}>
                    No project selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create or select a project to start task discussions.
                  </Typography>
                </Box>
              ) : !taskId ? (
                <Box textAlign="center" py={8}>
                  <AddComment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700}>
                    No tasks available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add tasks to this project before opening a discussion thread.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedTask?.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status: {selectedTask?.status?.replace('_', ' ')} | Priority: {selectedTask?.priority}
                    </Typography>
                  </Box>

                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      maxHeight: 420,
                      overflowY: 'auto',
                      mb: 3,
                    }}
                  >
                    {comments.length === 0 ? (
                      <Box textAlign="center" py={7}>
                        <Typography variant="body2" color="text.secondary">
                          No comments yet. Start the discussion below.
                        </Typography>
                      </Box>
                    ) : (
                      <List disablePadding>
                        {comments.map((item, index) => (
                          <React.Fragment key={item._id}>
                            <ListItem alignItems="flex-start" sx={{ px: 2.5, py: 2 }}>
                              <ListItemAvatar>
                                <Avatar src={item.author?.avatar}>
                                  {item.author?.firstName?.[0] || 'T'}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                    <Typography variant="body2" fontWeight={700}>
                                      {renderCommentAuthor(item)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {dayjs(item.createdAt).format('MMM D, YYYY h:mm A')}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                  >
                                    {item.content}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < comments.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>

                  <Box component="form" onSubmit={handleSubmit} display="flex" gap={1.5}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={5}
                      placeholder="Write a task update or mention context for the team..."
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      endIcon={<Send />}
                      disabled={!comment.trim() || addCommentMutation.isPending}
                      sx={{ alignSelf: 'stretch', px: 3 }}
                    >
                      Send
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Notifications color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Recent Alerts
                </Typography>
              </Box>
              {notifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent notifications.
                </Typography>
              ) : (
                <List disablePadding>
                  {notifications.slice(0, 8).map((item, index) => (
                    <React.Fragment key={item._id}>
                      <ListItem alignItems="flex-start" disableGutters>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={700}>
                                {item.title}
                              </Typography>
                              {!item.isRead && (
                                <Chip label="New" size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {item.message}
                              </Typography>
                              <Typography display="block" variant="caption" color="text.disabled" mt={0.5}>
                                {dayjs(item.createdAt).format('MMM D, h:mm A')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < Math.min(notifications.length, 8) - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollaborationPage;
