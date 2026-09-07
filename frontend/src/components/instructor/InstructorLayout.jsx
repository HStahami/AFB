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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-bg)", color: "var(--color-white)" }}>
      {/* Top Header for Mobile & Desktop */}
      <header
        className="glass-panel"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "70px",
          zIndex: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-toggle"
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              color: "var(--color-white)",
              cursor: "pointer"
            }}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 36, width: 48, borderRadius: 4 }} />
            <span style={{ fontSize: "1.2rem", fontWeight: "700" }} className="gradient-text">
              AlArabia LMS
            </span>
          </Link>
          <span
            style={{
              fontSize: "0.75rem",
              background: "rgba(197, 229, 232, 0.15)",
              color: "var(--color-primary)",
              padding: "3px 8px",
              borderRadius: "12px",
              fontWeight: "600",
              marginLeft: "0.5rem"
            }}
          >
            Instructor Portal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <Link
            to="/instructor/notifications"
            style={{
              position: "relative",
              color: "var(--color-white)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center"
            }}
            title="Notifications"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  backgroundColor: "#ff6b6b",
                  color: "#fff",
                  fontSize: "0.7rem",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
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
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", color: "inherit" }}
          >
            <img
              src={getAvatarUrl(user?.avatar, user?.username || "Instructor")}
              alt="Avatar"
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--color-primary)" }}
            />
            <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>{user?.username || "Instructor"}</span>
          </Link>

          <button
            onClick={logout}
            style={{
              background: "rgba(255, 107, 107, 0.15)",
              color: "#ff6b6b",
              border: "1px solid rgba(255, 107, 107, 0.3)",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.85rem",
              fontWeight: "500"
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`sidebar-nav ${mobileOpen ? "open" : ""}`}
        style={{
          width: "240px",
          backgroundColor: "rgba(10, 24, 26, 0.95)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          position: "fixed",
          top: "70px",
          bottom: 0,
          left: 0,
          zIndex: 80,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0.8rem",
          overflowY: "auto"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
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
                  padding: "10px 14px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: isActive ? "var(--color-primary)" : "#b0c4c6",
                  backgroundColor: isActive ? "rgba(197, 229, 232, 0.12)" : "transparent",
                  fontWeight: isActive ? "600" : "400",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  {item.icon}
                  <span style={{ fontSize: "0.95rem" }}>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      background: "#ff6b6b",
                      color: "#fff",
                      fontSize: "0.75rem",
                      padding: "2px 7px",
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
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          marginLeft: "240px",
          marginTop: "70px",
          padding: "2rem",
          minHeight: "calc(100vh - 70px)",
          width: "calc(100% - 240px)",
          boxSizing: "border-box"
        }}
        className="instructor-main"
      >
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
          <div className="glass-panel" style={{ maxWidth: "460px", width: "100%", padding: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <Lock size={44} color="var(--color-primary)" style={{ margin: "0 auto 0.8rem" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }} className="gradient-text">
                Password Change Required
              </h2>
              <p style={{ color: "#b0c4c6", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                You are currently logged in with a temporary password. Please set a strong, personal password to activate your instructor account.
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

            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.4rem", color: "#b0c4c6" }}>
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
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.4rem", color: "#b0c4c6" }}>
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
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.4rem", color: "#b0c4c6" }}>
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
                style={{ marginTop: "0.5rem", padding: "14px", width: "100%", opacity: pwdLoading ? 0.7 : 1 }}
              >
                {pwdLoading ? "Updating Password..." : "Set Password & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inline styles for responsive layout */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle {
            display: block !important;
          }
          .sidebar-nav {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar-nav.open {
            transform: translateX(0);
          }
          .instructor-main {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
