import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import Email from '@mui/icons-material/Email';
import Assignment from '@mui/icons-material/Assignment';
import ArrowBack from '@mui/icons-material/ArrowBack';
import MarkEmailRead from '@mui/icons-material/MarkEmailRead';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await authService.forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
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
                  : 'linear-gradient(135deg, #1976d2, #9c27b0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              {success ? (
                <MarkEmailRead sx={{ color: 'white', fontSize: 32 }} />
              ) : (
                <Assignment sx={{ color: 'white', fontSize: 32 }} />
              )}
            </Box>

            {success ? (
              <>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  If an account with that email exists, we've sent a password reset link. Please check your inbox and spam folder.
                </Typography>
                <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                  Password reset email sent! The link expires in <strong>10 minutes</strong>.
                </Alert>
              </>
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Forgot Password?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter your email address and we'll send you a link to reset your password.
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
                  label="Email Address"
                  type="email"
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

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </Box>
            </>
          )}

          <Box mt={3} textAlign="center">
            <MuiLink
              component={Link}
              to="/login"
              variant="body2"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <ArrowBack fontSize="small" />
              Back to Login
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPasswordPage;
