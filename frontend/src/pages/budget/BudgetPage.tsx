import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import TrendingDown from '@mui/icons-material/TrendingDown';
import { projectService } from '../../services/project.service';
import { expenseService } from '../../services/expense.service';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const CATEGORY_COLORS: Record<string, string> = {
  software: '#1976d2',
  hardware: '#9c27b0',
  travel: '#ed6c02',
  consulting: '#0288d1',
  other: '#607d8b',
};

const BudgetPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Expense form state
  const [expenseProjectId, setExpenseProjectId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState('software');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  // Queries
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['projectExpenses', selectedProjectId],
    queryFn: () => expenseService.getExpensesByProject(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  // Automatically select the first project
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  // Mutations
  const addExpenseMutation = useMutation({
    mutationFn: expenseService.addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectExpenses', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsAddExpenseOpen(false);
      setExpenseAmount(0);
      setExpenseDesc('');
      setExpenseDate('');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectExpenses', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleOpenAddExpense = () => {
    setExpenseProjectId(selectedProjectId);
    setIsAddExpenseOpen(true);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseProjectId || expenseAmount <= 0 || !expenseDesc) return;
    addExpenseMutation.mutate({
      projectId: expenseProjectId,
      amount: expenseAmount,
      category: expenseCategory,
      description: expenseDesc,
      date: expenseDate || undefined,
    });
  };

  // Helper calculation
  const selectedProject = projects.find((p) => p._id === selectedProjectId);
  const budgetProgress = selectedProject?.budget ? Math.round(((selectedProject.spent || 0) / selectedProject.budget) * 100) : 0;
  const isBudgetWarning = budgetProgress >= 90;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Budget & Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Oversee workspace finances, log project expenses, and receive budget overrun alerts.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 ,mb: 2 }}>
          <InputLabel>Active Project</InputLabel>
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            label="Active Project"
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

      {/* Main Budget Progress and Stats */}
      {isProjectsLoading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : !selectedProjectId ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No projects available
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                  Project Spent vs Budget Progress
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1.5}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      ${selectedProject?.spent || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of ${selectedProject?.budget || 0} budget allocated
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color={isBudgetWarning ? 'error' : 'success.main'}>
                    {budgetProgress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, budgetProgress)}
                  color={isBudgetWarning ? 'error' : 'success'}
                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                />

                {isBudgetWarning ? (
                  <Box display="flex" alignItems="center" gap={1} color="error.main">
                    <Warning fontSize="small" />
                    <Typography variant="caption" fontWeight={700}>
                      Warning: Project has spent over 90% of its budget allocation!
                    </Typography>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={1} color="success.main">
                    <CheckCircle fontSize="small" />
                    <Typography variant="caption" fontWeight={700}>
                      Budget status healthy. Keep tracking logs below.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ width: 56, height: 56, bgcolor: 'action.selected', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <AttachMoney color="primary" />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">Remaining Balance</Typography>
                <Typography variant="h5" fontWeight={700} color={isBudgetWarning ? 'error.main' : 'success.main'}>
                  ${Math.max(0, (selectedProject?.budget || 0) - (selectedProject?.spent || 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Expense list Table */}
      {selectedProjectId && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={700}>
                Expenses Ledger
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddExpense} size="small">
                Add Transaction
              </Button>
            </Box>

            {isExpensesLoading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <CircularProgress size={32} />
              </Box>
            ) : expenses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2}>
                No expenses logged for this project yet. Log your first expenditure above.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Recorded By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense: any) => (
                      <TableRow key={expense._id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {expense.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={expense.category}
                            size="small"
                            sx={{
                              bgcolor: `${CATEGORY_COLORS[expense.category]}15`,
                              color: CATEGORY_COLORS[expense.category],
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              borderRadius: 1,
                            }}
                          />
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
                        <TableCell align="right">
                          <IconButton onClick={() => deleteExpenseMutation.mutate(expense._id)}>
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
      )}

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleAddExpenseSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Log Project Expense</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
              <FormControl fullWidth required>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={expenseProjectId}
                  onChange={(e) => setExpenseProjectId(e.target.value)}
                  label="Select Project"
                >
                  {projects.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                required
                type="number"
                label="Amount ($)"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
              />

              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
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

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Transaction Date"
                  value={expenseDate ? dayjs(expenseDate) : null}
                  onChange={(newValue) => setExpenseDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
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
    </Box>
  );
};

export default BudgetPage;
