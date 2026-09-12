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
    <div className="portal-root">
      {/* Top Header */}
      <header className="portal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Hamburger Menu Toggle (Mobile only) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="portal-mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 32, width: 42, borderRadius: 4 }} />
            <span style={{ fontSize: '1.15rem', fontWeight: '700' }} className="gradient-text">
              AlArabia LMS
            </span>
          </Link>

          <span
            className="portal-header-badge"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Student Code Badge (Hidden on very small screens) */}
          {user?.student_code && (
            <div
              className="portal-header-id"
              style={{
                fontSize: '0.8rem',
                color: '#b0c4c6',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
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
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/student/profile"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(197, 229, 232, 0.15)',
                border: '1px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--color-primary)',
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
              title="View Student Profile"
            >
              {user?.username?.[0]?.toUpperCase() || 'S'}
            </Link>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                padding: '0.35rem 0.6rem',
                fontWeight: 500,
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hide-mobile">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (Hidden on mobile via CSS) */}
      <aside className="portal-desktop-sidebar">
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
            AlArabia LMS Student Portal
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Slide-over overlay on mobile) */}
      {mobileOpen && (
        <div
          className="portal-mobile-drawer-backdrop"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="portal-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 26, width: 34, borderRadius: 3 }} />
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>Student Menu</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Student Info Card in Drawer */}
            <div
              style={{
                margin: '1rem 0',
                padding: '0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'S'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.username || 'Student'}
                </div>
                {user?.student_code && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    ID: {user.student_code}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Nav Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary)' : '#cbd5e1',
                      backgroundColor: isActive ? 'rgba(197, 229, 232, 0.12)' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.9rem',
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

            {/* Drawer Logout */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', marginTop: '1rem' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (Full width on mobile, offset on desktop) */}
      <main className="portal-main-content">
        {children || <Outlet />}
      </main>

      {/* Mandatory Onboarding Gate */}
      {needsOnboarding && (
        <OnboardingModal user={user} onComplete={refreshUser} />
      )}
    </div>
  );
}
