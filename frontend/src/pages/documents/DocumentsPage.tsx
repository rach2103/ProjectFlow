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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AttachFile from '@mui/icons-material/AttachFile';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import FolderOpen from '@mui/icons-material/FolderOpen';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import Search from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { documentService, DocumentItem } from '../../services/document.service';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const getUploaderName = (document: DocumentItem) => {
  if (typeof document.uploadedBy === 'string') return 'Team member';
  return `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`;
};

const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['documentTasks', projectId],
    queryFn: () => taskService.getAllTasks({ projectId: projectId || undefined }),
    enabled: !!projectId,
  });

  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery({
    queryKey: ['documents', projectId, taskId, search],
    queryFn: () =>
      documentService.getDocuments({
        projectId: projectId || undefined,
        taskId: taskId || undefined,
        search: search || undefined,
      }),
  });

  React.useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, projectId]);

  const uploadMutation = useMutation({
    mutationFn: ({ file, selectedTaskId }: { file: File; selectedTaskId: string }) =>
      taskService.uploadAttachment(selectedTaskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });

  const selectedTaskId = useMemo(() => taskId || tasks[0]?._id || '', [taskId, tasks]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTaskId) return;
    uploadMutation.mutate({ file, selectedTaskId });
    event.target.value = '';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage files attached to project tasks and keep deliverables easy to find.
          </Typography>
        </Box>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUpload />}
          disabled={!selectedTaskId || uploadMutation.isPending}
          sx={{ borderRadius: 2 ,mb: 2 }}
        >
          Upload File
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search files..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={5}>
              <FormControl fullWidth size="small" disabled={!projectId || isTasksLoading}>
                <InputLabel>Upload/List Task</InputLabel>
                <Select
                  value={taskId}
                  label="Upload/List Task"
                  onChange={(event) => setTaskId(event.target.value)}
                >
                  <MenuItem value="">All project tasks</MenuItem>
                  {tasks.map((task) => (
                    <MenuItem key={task._id} value={task._id}>
                      {task.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isDocumentsLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a file to a task to start building the document library.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => {
                const uploaderName = getUploaderName(document);
                const uploaderAvatar =
                  typeof document.uploadedBy === 'string' ? undefined : document.uploadedBy.avatar;

                return (
                  <TableRow key={`${document.task?._id ?? document._id}-${document._id}`} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <InsertDriveFile color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {document.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatBytes(document.size)} | {document.type || 'File'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`[${document.project.key}] ${document.project.name}`}
                        size="small"
                        icon={<AttachFile />}
                        sx={{ borderRadius: 1.5, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{document.task.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar src={uploaderAvatar} sx={{ width: 28, height: 28 }}>
                          {uploaderName[0]}
                        </Avatar>
                        <Typography variant="body2">{uploaderName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {document.uploadedAt ? dayjs(document.uploadedAt).format('MMM D, YYYY') : 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Download">
                        <IconButton href={document.url} target="_blank" rel="noreferrer" size="small">
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
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

export default DocumentsPage;
