import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
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
  IconButton,
  Chip,
} from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import Today from '@mui/icons-material/Today';
import DateRange from '@mui/icons-material/DateRange';
import { timeService } from '../../services/time.service';
import { taskService } from '../../services/task.service';
import { useAuth } from '../../contexts/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TableRowCell = (props: React.ComponentProps<typeof TableCell>) => (
  <TableCell sx={{ fontWeight: 600 }} {...props} />
);

const TimeTrackingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Active timer states
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timerDesc, setTimerDesc] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Manual logging form states
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualHours, setManualHours] = useState(0);
  const [manualDesc, setManualDesc] = useState('');
  const [manualDate, setManualDate] = useState('');

  // Queries
  const { data: myTasks = [] } = useQuery({
    queryKey: ['myTasksTimeTracking'],
    queryFn: () => taskService.getAllTasks({ assigneeId: currentUser?._id }),
  });

  const { data: activeTimer, refetch: refetchActiveTimer } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: () => timeService.getActiveTimer(),
  });

  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['myTimeLogs'],
    queryFn: () => timeService.getTimeLogs({ userId: currentUser?._id }),
  });

  // Track active running timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTimer) {
      setIsTimerRunning(true);
      setSelectedTaskId(typeof activeTimer.task === 'string' ? activeTimer.task : activeTimer.task?._id || '');
      setTimerDesc(activeTimer.description || '');

      const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
      setTimerSeconds(elapsed);

      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIsTimerRunning(false);
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Mutations
  const startTimerMutation = useMutation({
    mutationFn: () => timeService.startTimer(selectedTaskId, timerDesc),
    onSuccess: () => {
      refetchActiveTimer();
      queryClient.invalidateQueries({ queryKey: ['myTimeLogs'] });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => timeService.stopTimer(),
    onSuccess: () => {
      setTimerDesc('');
      refetchActiveTimer();
      queryClient.invalidateQueries({ queryKey: ['myTimeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const logManualMutation = useMutation({
    mutationFn: timeService.logTimeManually,
    onSuccess: () => {
      setManualTaskId('');
      setManualHours(0);
      setManualDesc('');
      setManualDate('');
      queryClient.invalidateQueries({ queryKey: ['myTimeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: timeService.deleteTimeLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTimeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleStartTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    startTimerMutation.mutate();
  };

  const handleLogManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTaskId || manualHours <= 0) return;
    logManualMutation.mutate({
      taskId: manualTaskId,
      hours: manualHours,
      description: manualDesc,
      date: manualDate || new Date().toISOString(),
    });
  };

  // Helper stats calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayHours = logs
      .filter((l: any) => new Date(l.date).toDateString() === todayStr)
      .reduce((sum: number, l: any) => sum + (l.duration / 60), 0);

    const totalHours = logs.reduce((sum: number, l: any) => sum + (l.duration / 60), 0);

    return {
      todayHours: Number(todayHours.toFixed(1)),
      totalHours: Number(totalHours.toFixed(1)),
    };
  }, [logs]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3.5}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Time Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Log spent hours, run live timers, and analyze your productivity stats.
        </Typography>
      </Box>

      {/* Stats Widgets */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ bgcolor: 'info.light', borderRadius: 2, display: 'flex', color: 'info.contrastText' }}>
                <Today />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Today's Hours</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.todayHours}h</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ bgcolor: 'success.light', borderRadius: 2, display: 'flex', color: 'success.contrastText' }}>
                <DateRange />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Logged Hours</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.totalHours}h</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Grid: Live Timer Panel & Manual Time Log Panel */}
      <Grid container spacing={3.5} mb={4}>
        {/* Live Timer */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                Live Timer
              </Typography>
              <form onSubmit={handleStartTimer}>
                <FormControl fullWidth required size="small" sx={{ mb: 2 }} disabled={isTimerRunning}>
                  <InputLabel>Select Active Task</InputLabel>
                  <Select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    label="Select Active Task"
                  >
                    {myTasks
                      .filter((t: any) => t.status !== 'completed')
                      .map((t: any) => (
                        <MenuItem key={t._id} value={t._id}>
                          {t.title}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="What are you working on?"
                  value={timerDesc}
                  onChange={(e) => setTimerDesc(e.target.value)}
                  disabled={isTimerRunning}
                  sx={{ mb: 3 }}
                />

                {/* Big Timer display */}
                <Box display="flex" alignItems="center" justifyContent="space-between" p={3} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 3 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                    {formatTimer(timerSeconds)}
                  </Typography>
                  {isTimerRunning ? (
                    <Button variant="contained" color="error" startIcon={<Stop />} onClick={() => stopTimerMutation.mutate()}>
                      Stop Tracking
                    </Button>
                  ) : (
                    <Button type="submit" variant="contained" color="success" startIcon={<PlayArrow />} disabled={!selectedTaskId}>
                      Start Timer
                    </Button>
                  )}
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Manual Hours Log */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                Log Time Manually
              </Typography>
              <form onSubmit={handleLogManual}>
                <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                  <InputLabel>Select Task</InputLabel>
                  <Select
                    value={manualTaskId}
                    onChange={(e) => setManualTaskId(e.target.value)}
                    label="Select Task"
                  >
                    {myTasks.map((t: any) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Grid container spacing={2} mb={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      size="small"
                      label="Hours Spent"
                      value={manualHours}
                      onChange={(e) => setManualHours(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Log Date"
                        value={manualDate ? dayjs(manualDate) : null}
                        onChange={(newValue) => setManualDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slotProps={{ textField: { fullWidth: true, required: true, size: 'small' } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="outlined"
                  fullWidth
                  disabled={!manualTaskId || manualHours <= 0 || logManualMutation.isPending}
                  startIcon={<Add />}
                >
                  Save Log Entry
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Logs History Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2.5}>
            Log History
          </Typography>
          {isLogsLoading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress size={32} />
            </Box>
          ) : logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No time entries logged yet. Track your first hour above!
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableRowCell>Project</TableRowCell>
                    <TableRowCell>Task</TableRowCell>
                    <TableRowCell>Duration</TableRowCell>
                    <TableRowCell>Description</TableRowCell>
                    <TableRowCell>Date</TableRowCell>
                    <TableRowCell align="right">Actions</TableRowCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {log.project?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.task?.title}
                      </TableCell>
                      <TableCell>
                        <Chip label={`${(log.duration / 60).toFixed(1)} hrs`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {log.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        {new Date(log.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => deleteLogMutation.mutate(log._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeTrackingPage;
