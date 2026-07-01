import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/auth.service';

// ─────────────────────────────────────────────────────────────────────────────
// Context State & Actions
// ─────────────────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  hasRole: (...roles: User['role'][]) => boolean;
  isAdmin: boolean;
  isProjectManager: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Checks if user is already authenticated on app load.
   */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      const user = await authService.getMe();
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken: token },
      });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * Logs in user with email and password.
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user, accessToken } = await authService.login(credentials);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
  }, []);

  /**
   * Registers a new user account.
   */
  const register = useCallback(async (data: RegisterData) => {
    await authService.register(data);
    // Don't auto-login — user needs to verify email first
  }, []);

  /**
   * Logs out current user and clears state.
   */
  const logout = useCallback(async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  /**
   * Updates the user object in state (e.g., after profile update).
   */
  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  /**
   * Checks if the authenticated user has any of the specified roles.
   */
  const hasRole = useCallback(
    (...roles: User['role'][]) => {
      if (!state.user) return false;
      return roles.includes(state.user.role);
    },
    [state.user]
  );

  // Check authentication status on initial mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for forced logout events (e.g., from token refresh failure)
  useEffect(() => {
    const handleForcedLogout = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    hasRole,
    isAdmin: state.user?.role === 'admin',
    isProjectManager:
      state.user?.role === 'admin' || state.user?.role === 'project_manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context.
 * Must be used within AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
