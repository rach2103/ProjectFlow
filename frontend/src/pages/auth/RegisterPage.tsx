import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Link as MuiLink,
  CircularProgress,
  Grid,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Email from '@mui/icons-material/Email';
import Lock from '@mui/icons-material/Lock';
import Person from '@mui/icons-material/Person';
import Assignment from '@mui/icons-material/Assignment';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';

// Zod schema for registration form
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name is too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name is too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    role: z.enum(['developer', 'project_manager', 'team_lead', 'client']).default('developer'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[0-9])/, 'Must contain at least one number')
      .regex(/(?=.*[a-z])/, 'Must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
      .regex(
        /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
        'Must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.input<typeof registerSchema>;

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 25;
  return Math.min(score, 100);
};

const getStrengthColor = (strength: number): 'error' | 'warning' | 'info' | 'success' => {
  if (strength < 30) return 'error';
  if (strength < 50) return 'warning';
  if (strength < 75) return 'info';
  return 'success';
};

const getStrengthLabel = (strength: number): string => {
  if (strength < 30) return 'Weak';
  if (strength < 50) return 'Fair';
  if (strength < 75) return 'Good';
  return 'Strong';
};

const ROLES = [
  { value: 'developer', label: 'Developer' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'client', label: 'Client' },
];

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'developer' },
  });

  const password = watch('password', '');
  const passwordStrength = calculatePasswordStrength(password || '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser(data);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex' }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            flex: 1,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
            color: 'white',
            p: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, mt: 'auto', mb: 'auto' }}>
            <Typography variant="h2" fontWeight={800} letterSpacing="-0.025em" sx={{ mb: 3, maxWidth: 500, lineHeight: 1.1 }}>
              Welcome to the team.
            </Typography>
            <Typography variant="h6" fontWeight={400} sx={{ opacity: 0.8, maxWidth: 400 }}>
              Your workspace is almost ready. Let's get things set up.
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            flex: { xs: 1, md: '0 0 500px', lg: '0 0 600px' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper',
            p: { xs: 4, sm: 6, md: 8 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.025em', color: 'text.primary' }}>
              Welcome Aboard!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Please check your email to verify your account.
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={2}>
              Redirecting to login...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left side - Branding/Visual */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          flex: 1,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
          color: 'white',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, mt: 'auto', mb: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Assignment sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} letterSpacing="-0.025em">
              Project Management System
            </Typography>
          </Box>
          <Typography variant="h2" fontWeight={800} letterSpacing="-0.025em" sx={{ mb: 3, maxWidth: 500, lineHeight: 1.1 }}>
            Join the best teams in the world.
          </Typography>
          <Typography variant="h6" fontWeight={400} sx={{ opacity: 0.8, maxWidth: 400 }}>
            Create an account to start managing your projects with unprecedented elegance.
          </Typography>
        </Box>
        
        {/* Subtle decorative shapes */}
        <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />
      </Box>

      {/* Right side - Register Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 500px', lg: '0 0 600px' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.paper',
          p: { xs: 4, sm: 6, md: 8 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.025em', color: 'text.primary' }}>
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please enter your details to sign up.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  First Name
                </Typography>
                <TextField
                  fullWidth
                  placeholder="John"
                  autoFocus
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('firstName')}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  Last Name
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Doe"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('lastName')}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  placeholder="john@example.com"
                  type="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('email')}
                />
              </Grid>

              {/* Role */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  Role
                </Typography>
                <TextField
                  fullWidth
                  select
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  defaultValue="developer"
                  {...register('role')}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Password */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  Password
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((p) => !p)}
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...register('password')}
                />
                {/* Password Strength Indicator */}
                {password && (
                  <Box mt={1.5}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      color={getStrengthColor(passwordStrength)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography
                      variant="caption"
                      color={`${getStrengthColor(passwordStrength)}.main`}
                      fontWeight={600}
                    >
                      Strength: {getStrengthLabel(passwordStrength)}
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  Confirm Password
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Confirm your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...register('confirmPassword')}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 4, py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, boxShadow: 'none' }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </Box>

          <Box mt={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <MuiLink
                component={Link}
                to="/login"
                fontWeight={600}
                underline="hover"
                color="primary.main"
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
