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
  LinearProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Lock from '@mui/icons-material/Lock';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[0-9])/, 'Must contain at least one number')
      .regex(/(?=.*[a-z])/, 'Must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
      .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const calcStrength = (p: string) => {
  let s = 0;
  if (p.length >= 8) s += 20;
  if (p.length >= 12) s += 10;
  if (/[a-z]/.test(p)) s += 15;
  if (/[A-Z]/.test(p)) s += 15;
  if (/[0-9]/.test(p)) s += 15;
  if (/[^a-zA-Z0-9]/.test(p)) s += 25;
  return Math.min(s, 100);
};

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const strength = calcStrength(password || '');

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Invalid reset link');
      return;
    }
    try {
      setError(null);
      await authService.resetPassword(token, data);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1565c0 0%, #9c27b0 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: success
                  ? 'linear-gradient(135deg, #2e7d32, #43a047)'
                  : 'linear-gradient(135deg, #d32f2f, #e53935)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              {success ? (
                <CheckCircle sx={{ color: 'white', fontSize: 32 }} />
              ) : (
                <Lock sx={{ color: 'white', fontSize: 32 }} />
              )}
            </Box>

            {success ? (
              <>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Password Reset!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your password has been reset successfully. Redirecting to login...
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Reset Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter your new password below.
                </Typography>
              </>
            )}
          </Box>

          {!success && (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
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
                        <IconButton onClick={() => setShowPassword((p) => !p)} size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                  {...register('password')}
                />
                {password && (
                  <Box mb={2}>
                    <LinearProgress
                      variant="determinate"
                      value={strength}
                      color={strength < 50 ? 'error' : strength < 75 ? 'warning' : 'success'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirm ? 'text' : 'password'}
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
                        <IconButton onClick={() => setShowConfirm((p) => !p)} size="small">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  {...register('confirmPassword')}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  color="error"
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </Box>
            </>
          )}

          <Box mt={3} textAlign="center">
            <MuiLink component={Link} to="/login" variant="body2" underline="hover">
              Back to Login
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;
