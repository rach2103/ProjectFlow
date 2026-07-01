import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Link as MuiLink,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Assignment from '@mui/icons-material/Assignment';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please use the link from your email.');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err?.response?.data?.message ||
            'Verification link is invalid or has expired. Please request a new one.'
        );
      });
  }, [token]);

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
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Assignment sx={{ color: 'white', fontSize: 32 }} />
          </Box>

          {status === 'loading' && (
            <>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" fontWeight={600}>
                Verifying your email...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we confirm your email address.
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Email Verified!
              </Typography>
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
              >
                Continue to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Cancel sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  Go to Login
                </Button>
                <MuiLink
                  component={Link}
                  to="/register"
                  variant="body2"
                  underline="hover"
                  textAlign="center"
                >
                  Create a new account
                </MuiLink>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmailPage;
