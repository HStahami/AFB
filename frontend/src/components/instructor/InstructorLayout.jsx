import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  FileText,
  ClipboardCheck,
  BookOpen,
  BarChart2,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Lock,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi, authApi } from "../../api";
import { getAvatarUrl } from "../../api/client";
import { inputStyle } from "../common/styles";

export function InstructorLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // First Login Password Change Modal State
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(user?.first_login || false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (user?.first_login) {
      setShowFirstLoginModal(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await notificationsApi.getAll();
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        // silent fallback
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setPwdSuccess("Password updated successfully! Welcome to your Instructor Portal.");
      if (user) {
        user.first_login = false;
        localStorage.setItem("user", JSON.stringify(user));
      }
      setTimeout(() => {
        setShowFirstLoginModal(false);
      }, 1500);
    } catch (err) {
      setPwdError(err.message || "Failed to change password. Please check current password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/instructor", icon: <LayoutDashboard size={20} /> },
    { label: "My Students", path: "/instructor/students", icon: <Users size={20} /> },
    { label: "My Classes", path: "/instructor/classes", icon: <Calendar size={20} /> },
    { label: "Tasks", path: "/instructor/tasks", icon: <CheckSquare size={20} /> },
    { label: "Submissions", path: "/instructor/submissions", icon: <FileText size={20} /> },
    { label: "Attendance", path: "/instructor/attendance", icon: <ClipboardCheck size={20} /> },
    { label: "Resources", path: "/instructor/resources", icon: <BookOpen size={20} /> },
    { label: "Reports", path: "/instructor/reports", icon: <BarChart2 size={20} /> },
    {
      label: "Notifications",
      path: "/instructor/notifications",
      icon: <Bell size={20} />,
      badge: unreadCount > 0 ? unreadCount : null
    },
    { label: "Profile", path: "/instructor/profile", icon: <User size={20} /> }
  ];

  return (
    <div className="portal-root">
      {/* Top Header for Mobile & Desktop */}
      <header className="portal-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Hamburger Menu Toggle (Mobile only) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="portal-mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 32, width: 42, borderRadius: 4 }} />
            <span style={{ fontSize: "1.15rem", fontWeight: "700" }} className="gradient-text">
              AlArabia LMS
            </span>
          </Link>
          <span
            className="portal-header-badge"
            style={{
              fontSize: "0.75rem",
              background: "rgba(197, 229, 232, 0.15)",
              color: "var(--color-primary)",
              padding: "3px 8px",
              borderRadius: "12px",
              fontWeight: "600",
            }}
          >
            Instructor Portal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            to="/instructor/notifications"
            style={{
              position: "relative",
              color: "#b0c4c6",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              padding: "6px"
            }}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "1px",
                  right: "1px",
                  backgroundColor: "#ff6b6b",
                  color: "#fff",
                  fontSize: "0.65rem",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold"
                }}
              >
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/instructor/profile"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}
            title="Instructor Profile"
          >
            <img
              src={getAvatarUrl(user?.avatar, user?.username || "Instructor")}
              alt="Avatar"
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--color-primary)", objectFit: "cover" }}
            />
            <span className="hide-mobile" style={{ fontSize: "0.88rem", fontWeight: "500" }}>{user?.username || "Instructor"}</span>
          </Link>

          <button
            onClick={logout}
            style={{
              background: "rgba(255, 107, 107, 0.12)",
              color: "#ff6b6b",
              border: "1px solid rgba(255, 107, 107, 0.3)",
              borderRadius: "6px",
              padding: "0.35rem 0.6rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
              fontWeight: "500"
            }}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (Hidden on mobile via CSS) */}
      <aside className="portal-desktop-sidebar">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: isActive ? "var(--color-primary)" : "#b0c4c6",
                  backgroundColor: isActive ? "rgba(197, 229, 232, 0.12)" : "transparent",
                  fontWeight: isActive ? "600" : "400",
                  fontSize: "0.9rem",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      background: "#ff6b6b",
                      color: "#fff",
                      fontSize: "0.7rem",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "bold"
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1rem", marginTop: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#8892b0", textAlign: "center" }}>
            AlArabia LMS Instructor Portal
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 26, width: 34, borderRadius: 3 }} />
                <span style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "1rem" }}>Instructor Menu</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Instructor Info Card in Drawer */}
            <div
              style={{
                margin: "1rem 0",
                padding: "0.85rem",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <img
                src={getAvatarUrl(user?.avatar, user?.username || "Instructor")}
                alt="Avatar"
                style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--color-primary)", objectFit: "cover" }}
              />
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {user?.username || "Instructor"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 600 }}>
                  Role: Faculty Instructor
                </div>
              </div>
            </div>

            {/* Drawer Nav Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: isActive ? "var(--color-primary)" : "#cbd5e1",
                      backgroundColor: isActive ? "rgba(197, 229, 232, 0.12)" : "transparent",
                      fontWeight: isActive ? "600" : "400",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          background: "#ff6b6b",
                          color: "#fff",
                          fontSize: "0.7rem",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontWeight: "bold"
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
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1rem", marginTop: "1rem" }}>
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 107, 107, 0.3)",
                  backgroundColor: "rgba(255, 107, 107, 0.12)",
                  color: "#ff6b6b",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
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

      {/* Mandatory First-Login Password Change Modal */}
      {showFirstLoginModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
        >
          <div className="glass-panel" style={{ maxWidth: "460px", width: "100%", padding: "2rem 1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <Lock size={40} color="var(--color-primary)" style={{ margin: "0 auto 0.8rem" }} />
              <h2 style={{ fontSize: "1.35rem", fontWeight: "700" }} className="gradient-text">
                Password Change Required
              </h2>
              <p style={{ color: "#b0c4c6", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                You are currently logged in with a temporary password. Please set a strong password to activate your instructor account.
              </p>
            </div>

            {pwdError && (
              <div
                style={{
                  backgroundColor: "rgba(255, 107, 107, 0.15)",
                  border: "1px solid rgba(255, 107, 107, 0.3)",
                  color: "#ff6b6b",
                  padding: "0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <AlertCircle size={18} /> {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div
                style={{
                  backgroundColor: "rgba(78, 205, 196, 0.15)",
                  border: "1px solid rgba(78, 205, 196, 0.3)",
                  color: "var(--color-primary)",
                  padding: "0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem"
                }}
              >
                {pwdSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.35rem", color: "#b0c4c6" }}>
                  Current Temporary Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.35rem", color: "#b0c4c6" }}>
                  New Secure Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.35rem", color: "#b0c4c6" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="btn-primary"
                style={{ marginTop: "0.5rem", padding: "12px", width: "100%", opacity: pwdLoading ? 0.7 : 1 }}
              >
                {pwdLoading ? "Updating Password..." : "Set Password & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
