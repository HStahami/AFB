import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  FileText,
  Calendar,
  FolderDown,
  BarChart3,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';
import { OnboardingModal } from './OnboardingModal';

export function StudentLayout({ children }) {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mandatory Onboarding Check from Server-Authoritative State
  const needsOnboarding = !!(user?.first_login || !user?.profile_completed);

  useEffect(() => {
    loadUnreadNotifications();
  }, [location.pathname]);

  const loadUnreadNotifications = async () => {
    try {
      const notifs = await notificationsApi.getAll();
      const unread = (notifs || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to load notification counter:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/student', icon: <LayoutDashboard size={19} /> },
    { label: 'My Courses', path: '/student/courses', icon: <BookOpen size={19} /> },
    { label: 'Course Tasks', path: '/student/tasks', icon: <CheckSquare size={19} /> },
    { label: 'Submissions', path: '/student/submissions', icon: <FileText size={19} /> },
    { label: 'Attendance', path: '/student/attendance', icon: <Calendar size={19} /> },
    { label: 'Resources', path: '/student/resources', icon: <FolderDown size={19} /> },
    { label: 'Reports', path: '/student/reports', icon: <BarChart3 size={19} /> },
    { label: 'Notifications', path: '/student/notifications', icon: <Bell size={19} />, badge: unreadCount },
    { label: 'Profile', path: '/student/profile', icon: <User size={19} /> },
    { label: 'Settings', path: '/student/settings', icon: <Settings size={19} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-white)' }}>
      {/* Top Header */}
      <header
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-toggle"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-white)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 36, width: 48, borderRadius: 4 }} />
            <span style={{ fontSize: '1.2rem', fontWeight: '700' }} className="gradient-text">
              AlArabia LMS
            </span>
          </Link>

          <span
            style={{
              fontSize: '0.75rem',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '3px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            Student Portal
          </span>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Student Code Badge */}
          {user?.student_code && (
            <div
              style={{
                fontSize: '0.8rem',
                color: '#b0c4c6',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ color: '#8892b0' }}>ID:</span>
              <strong style={{ color: 'var(--color-primary)' }}>{user.student_code}</strong>
            </div>
          )}

          {/* Notification Bell */}
          <Link
            to="/student/notifications"
            style={{
              position: 'relative',
              color: '#b0c4c6',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              padding: '6px',
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Quick Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(197, 229, 232, 0.15)',
                border: '1px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--color-primary)',
                fontSize: '0.9rem',
              }}
            >
              {user?.username?.[0]?.toUpperCase() || 'S'}
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8892b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                padding: '0.4rem 0.6rem',
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hide-mobile">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className="glass-panel hide-mobile"
        style={{
          width: '240px',
          position: 'fixed',
          top: '70px',
          bottom: 0,
          left: 0,
          borderRadius: 0,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderTop: 'none',
          borderBottom: 'none',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem 0.8rem',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : '#b0c4c6',
                  backgroundColor: isActive ? 'rgba(197, 229, 232, 0.12)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textAlign: 'center' }}>
            AlArabia LMS Student v1.0
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 150,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '260px',
              height: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              padding: '1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Student Menu</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#fff' }}>
                <X size={20} />
              </button>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: location.pathname === item.path ? 'var(--color-primary)' : '#b0c4c6',
                  backgroundColor: location.pathname === item.path ? 'rgba(197, 229, 232, 0.12)' : 'transparent',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          marginTop: '70px',
          padding: '2rem',
          minHeight: 'calc(100vh - 70px)',
          width: 'calc(100% - 240px)',
          boxSizing: 'border-box',
        }}
        className="student-main"
      >
        {children || <Outlet />}
      </main>

      {/* Mandatory Onboarding Gate */}
      {needsOnboarding && (
        <OnboardingModal user={user} onComplete={refreshUser} />
      )}
    </div>
  );
}
