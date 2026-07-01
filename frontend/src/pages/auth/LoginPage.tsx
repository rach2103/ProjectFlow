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
  Divider,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Email from '@mui/icons-material/Email';
import Lock from '@mui/icons-material/Lock';
import Assignment from '@mui/icons-material/Assignment';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';

// Zod schema for login form validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    }
  };

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
            Manage your work with unprecedented elegance.
          </Typography>
          <Typography variant="h6" fontWeight={400} sx={{ opacity: 0.8, maxWidth: 400 }}>
            Streamline projects, collaborate seamlessly, and ship faster than ever before.
          </Typography>
        </Box>
        
        {/* Subtle decorative shapes */}
        <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />
      </Box>

      {/* Right side - Login Form */}
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
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box mb={5}>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.025em', color: 'text.primary' }}>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please enter your details to sign in.
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
              Email
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your email"
              type="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              {...register('email')}
            />

            <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
              Password
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
              {...register('password')}
            />

            {/* Forgot Password */}
            <Box textAlign="right" mb={4}>
              <MuiLink
                component={Link}
                to="/forgot-password"
                variant="body2"
                fontWeight={600}
                underline="hover"
                color="primary.main"
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, boxShadow: 'none' }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>

          <Box mt={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <MuiLink
                component={Link}
                to="/register"
                fontWeight={600}
                underline="hover"
                color="primary.main"
              >
                Sign up
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
