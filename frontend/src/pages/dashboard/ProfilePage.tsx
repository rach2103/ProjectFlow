import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import Edit from '@mui/icons-material/Edit';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Save from '@mui/icons-material/Save';
import Lock from '@mui/icons-material/Lock';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters').max(50),
  lastName: z.string().min(2, 'Min 2 characters').max(50),
  bio: z.string().max(500, 'Max 500 characters').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#d32f2f',
  project_manager: '#1976d2',
  team_lead: '#7b1fa2',
  developer: '#2e7d32',
  client: '#e65100',
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      department: user?.department || '',
      jobTitle: user?.jobTitle || '',
      timezone: user?.timezone || 'UTC',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError(null);
      const response = await api.patch('/users/profile', data);
      updateUser(response.data.data);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        My Profile
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Avatar & Basic Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box position="relative" display="inline-block" mb={2}>
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 100, height: 100, fontSize: 36, mx: 'auto' }}
                >
                  {user?.firstName?.[0]}
                </Avatar>
                <Tooltip title="Upload photo">
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="h6" fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>

              <Chip
                label={user?.role?.replace('_', ' ')}
                sx={{
                  bgcolor: ROLE_COLORS[user?.role || 'developer'],
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  mt: 1,
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Box textAlign="left">
                {user?.jobTitle && (
                  <Typography variant="body2" mb={0.5}>
                    💼 {user.jobTitle}
                  </Typography>
                )}
                {user?.department && (
                  <Typography variant="body2" mb={0.5}>
                    🏢 {user.department}
                  </Typography>
                )}
                {user?.phone && (
                  <Typography variant="body2" mb={0.5}>
                    📞 {user.phone}
                  </Typography>
                )}
                <Typography variant="body2" mb={0.5}>
                  🌍 {user?.timezone || 'UTC'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ✅ Email {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>

              {user?.lastLogin && (
                <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                  Last login: {new Date(user.lastLogin).toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>
                  Profile Information
                </Typography>
                <Button
                  startIcon={editMode ? <Save /> : <Edit />}
                  variant={editMode ? 'contained' : 'outlined'}
                  onClick={editMode ? handleSubmit(onSubmit) : () => setEditMode(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : editMode ? (
                    'Save Changes'
                  ) : (
                    'Edit Profile'
                  )}
                </Button>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    disabled={!editMode}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    {...register('firstName')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    disabled={!editMode}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    {...register('lastName')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={user?.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    disabled={!editMode}
                    {...register('jobTitle')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    disabled={!editMode}
                    {...register('department')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    disabled={!editMode}
                    {...register('phone')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Timezone"
                    disabled={!editMode}
                    defaultValue={user?.timezone || 'UTC'}
                    {...register('timezone')}
                  >
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Bio"
                    disabled={!editMode}
                    placeholder="Tell your team about yourself..."
                    error={!!errors.bio}
                    helperText={errors.bio?.message}
                    {...register('bio')}
                  />
                </Grid>
              </Grid>

              {editMode && (
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => setEditMode(false)}
                  sx={{ mt: 2 }}
                >
                  Cancel
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card sx={{ mt: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Notification Preferences
              </Typography>
              <Grid container spacing={1}>
                {[
                  { key: 'email', label: 'Email Notifications' },
                  { key: 'taskAssigned', label: 'Task Assigned' },
                  { key: 'taskUpdated', label: 'Task Updated' },
                  { key: 'projectUpdated', label: 'Project Updated' },
                  { key: 'mentions', label: 'Mentions (@me)' },
                ].map((notif) => (
                  <Grid item xs={12} sm={6} key={notif.key}>
                    <FormControlLabel
                      control={
                        <Switch
                          defaultChecked={user?.notifications?.[notif.key as keyof typeof user.notifications] !== false}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{notif.label}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card sx={{ mt: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Password & Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your password to keep your account secure
                  </Typography>
                </Box>
                <Button
                  startIcon={<Lock />}
                  variant="outlined"
                  onClick={() => {/* open change password dialog */}}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
