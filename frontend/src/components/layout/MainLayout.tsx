import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notification.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import MenuIcon from '@mui/icons-material/Menu';
import Dashboard from '@mui/icons-material/Dashboard';
import FolderOpen from '@mui/icons-material/FolderOpen';
import Assignment from '@mui/icons-material/Assignment';
import People from '@mui/icons-material/People';
import Timer from '@mui/icons-material/Timer';
import BarChart from '@mui/icons-material/BarChart';
import Notifications from '@mui/icons-material/Notifications';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import AttachMoney from '@mui/icons-material/AttachMoney';
import AttachFile from '@mui/icons-material/AttachFile';
import Timeline from '@mui/icons-material/Timeline';
import Chat from '@mui/icons-material/Chat';
import Close from '@mui/icons-material/Close';
import Check from '@mui/icons-material/Check';
import DeleteSweep from '@mui/icons-material/DeleteSweep';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Projects', path: '/projects', icon: <FolderOpen /> },
  { label: 'Tasks', path: '/tasks', icon: <Assignment /> },
  { label: 'Team', path: '/team', icon: <People /> },
  { label: 'Timeline', path: '/timeline', icon: <Timeline /> },
  { label: 'Time Tracking', path: '/time-tracking', icon: <Timer /> },
  { label: 'Budget', path: '/budget', icon: <AttachMoney /> },
  { label: 'Collaboration', path: '/collaboration', icon: <Chat /> },
  { label: 'Documents', path: '/documents', icon: <AttachFile /> },
  { label: 'Reports', path: '/reports', icon: <BarChart /> },
  { label: 'AI Assistant', path: '/ai-assistant', icon: <AutoAwesome /> },
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#d32f2f',
  project_manager: '#1976d2',
  team_lead: '#7b1fa2',
  developer: '#2e7d32',
  client: '#e65100',
};

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const drawerWidth = sidebarCollapsed && !isMobile ? 72 : DRAWER_WIDTH;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    refetchInterval: 60000,
  });
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: notificationService.clearAllNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 64,
          position: 'relative',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Assignment sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        {(!sidebarCollapsed || isMobile) && (
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              PMS
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Project Manager
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={() => setSidebarCollapsed((p) => !p)}
            size="small"
            aria-label={sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              p: 0.5,
              transition: 'all 0.15s',
              boxShadow: sidebarCollapsed ? 1 : 'none',
              bgcolor: sidebarCollapsed ? 'background.paper' : 'transparent',
              color: sidebarCollapsed ? 'primary.main' : 'text.primary',
              '&:hover': { transform: 'translateY(-1px)' },
              zIndex: 2,
              // When collapsed, position the toggle over the top-left icon area
              position: sidebarCollapsed ? 'absolute' : 'static',
              // center over the left icon box (padding 16 + half icon width)
              left: sidebarCollapsed ? 16 : 'auto',
              top: sidebarCollapsed ? 14 : 'auto',
            }}
          >
            {sidebarCollapsed ? (
              <ChevronRight sx={{ transition: 'transform 0.2s', fontSize: 20 }} />
            ) : (
              <ChevronLeft sx={{ transition: 'transform 0.2s', fontSize: 20 }} />
            )}
          </IconButton>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, px: 1, py: 1.5, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip
              title={sidebarCollapsed && !isMobile ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                selected={isActive(item.path)}
                className="hover-lift"
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  minHeight: 46,
                  px: sidebarCollapsed && !isMobile ? 1.5 : 2,
                  justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    backgroundColor: mode === 'dark' ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.1)',
                    color: mode === 'dark' ? '#818cf8' : '#4f46e5',
                    boxShadow: 'none',
                    '& .MuiListItemIcon-root': { color: mode === 'dark' ? '#818cf8' : '#4f46e5' },
                    '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(79, 70, 229, 0.25)' : 'rgba(79, 70, 229, 0.15)' },
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '10%',
                      height: '80%',
                      width: '4px',
                      backgroundColor: mode === 'dark' ? '#818cf8' : '#4f46e5',
                      borderRadius: '0 4px 4px 0',
                    }
                  },
                  '&:hover:not(.Mui-selected)': {
                    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    color: 'text.primary',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarCollapsed && !isMobile ? 0 : 40,
                    color: isActive(item.path) ? (mode === 'dark' ? '#818cf8' : '#4f46e5') : 'text.secondary',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {(!sidebarCollapsed || isMobile) && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(item.path) ? 600 : 400 }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* User Info at Bottom */}
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={() => handleNavClick('/profile')}
          sx={{ borderRadius: 2, gap: 1.5 }}
        >
          <Avatar
            src={user?.avatar}
            sx={{ width: 36, height: 36, flexShrink: 0 }}
          >
            {user?.firstName?.[0]}
          </Avatar>
          {(!sidebarCollapsed || isMobile) && (
            <Box flex={1} overflow="hidden">
              <Typography variant="body2" fontWeight={600} noWrap>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Chip
                label={user?.role?.replace('_', ' ')}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10,
                  bgcolor: ROLE_COLORS[user?.role || 'developer'],
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              />
            </Box>
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <DrawerContent />
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          <DrawerContent />
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }} color="text.primary">
              {NAV_ITEMS.find((n) => isActive(n.path))?.label || 'Dashboard'}
            </Typography>

            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="default">
                {mode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="default" onClick={() => setNotificationDrawerOpen(true)}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings */}
            <Tooltip title="Settings">
              <IconButton color="default" onClick={() => navigate('/settings')}>
                <Settings />
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Tooltip title="Account">
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
                <Avatar src={user?.avatar} sx={{ width: 34, height: 34 }}>
                  {user?.firstName?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 2 } }}
            >
              <Box px={2} py={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                onClick={() => { setAnchorEl(null); navigate('/profile'); }}
                sx={{ gap: 1.5 }}
              >
                <AccountCircle fontSize="small" /> My Profile
              </MenuItem>
              <MenuItem
                onClick={() => { setAnchorEl(null); navigate('/settings'); }}
                sx={{ gap: 1.5 }}
              >
                <Settings fontSize="small" /> Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ gap: 1.5, color: 'error.main' }}>
                <Logout fontSize="small" /> Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4, lg: 5 }, backgroundColor: 'background.default' }}>
          <Box sx={{ maxWidth: 1440, mx: 'auto', height: '100%' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 380 } } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Notifications
          </Typography>
          <Tooltip title="Mark all as read">
            <IconButton onClick={() => markAllAsReadMutation.mutate()} disabled={unreadCount === 0 || markAllAsReadMutation.isPending}>
              <Check fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear all">
            <IconButton onClick={() => clearAllMutation.mutate()} disabled={notifications.length === 0 || clearAllMutation.isPending}>
              <DeleteSweep fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => setNotificationDrawerOpen(false)} sx={{ ml: 1 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box p={4} textAlign="center">
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.2, mb: 1 }} />
              <Typography color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            notifications.map((notif: any) => (
              <React.Fragment key={notif._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                  onClick={() => {
                    if (!notif.isRead) markAsReadMutation.mutate(notif._id);
                    if (notif.link) {
                      navigate(notif.link);
                      setNotificationDrawerOpen(false);
                    }
                  }}
                >
                  <ListItemText
                    primary={notif.title}
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(notif.createdAt).fromNow()}
                        </Typography>
                      </React.Fragment>
                    }
                    primaryTypographyProps={{ fontWeight: notif.isRead ? 400 : 700, variant: 'subtitle2' }}
                  />
                  {!notif.isRead && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                  )}
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      </Drawer>
    </Box>
  );
};

export default MainLayout;
