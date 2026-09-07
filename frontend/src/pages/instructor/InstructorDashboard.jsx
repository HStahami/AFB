import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  FileText,
  CheckSquare,
  ClipboardCheck,
  Bell,
  ArrowRight,
  Plus,
  AlertCircle
} from "lucide-react";
import { instructorsApi, submissionsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function InstructorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_students: 0,
    active_classes: 0,
    pending_submissions: 0,
    tasks_assigned: 0,
    attendance_today: 0,
    unread_notifications: 0
  });
  const [classes, setClasses] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsData, classesData, subsData] = await Promise.all([
          instructorsApi.getDashboardStats().catch(() => ({})),
          instructorsApi.getMyClasses().catch(() => []),
          submissionsApi.getAll({ status: "submitted" }).catch(() => [])
        ]);

        setStats({
          total_students: statsData.total_students || 0,
          active_classes: statsData.active_classes || 0,
          pending_submissions: statsData.pending_submissions || subsData.length || 0,
          tasks_assigned: statsData.tasks_assigned || 0,
          attendance_today: statsData.attendance_today || 0,
          unread_notifications: statsData.unread_notifications || 0
        });
        setClasses(classesData);
        setPendingSubmissions(subsData.slice(0, 5));
      } catch (err) {
        setError(err.message || "Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { title: "My Students", value: stats.total_students, icon: <Users size={22} color="var(--color-primary)" />, link: "/instructor/students" },
    { title: "Active Classes", value: stats.active_classes, icon: <Calendar size={22} color="#4ecdc4" />, link: "/instructor/classes" },
    { title: "Pending Grading", value: stats.pending_submissions, icon: <FileText size={22} color="#ffb86c" />, link: "/instructor/submissions" },
    { title: "Tasks Assigned", value: stats.tasks_assigned, icon: <CheckSquare size={22} color="#a29bfe" />, link: "/instructor/tasks" },
    { title: "Attendance Today", value: stats.attendance_today, icon: <ClipboardCheck size={22} color="#55efc4" />, link: "/instructor/attendance" },
    { title: "Unread Alerts", value: stats.unread_notifications, icon: <Bell size={22} color="#ff7675" />, link: "/instructor/notifications" }
  ];

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-primary)", fontSize: "1.2rem" }}>Loading Instructor Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.4rem" }} className="gradient-text">
            Welcome, {user?.username || "Instructor"}!
          </h1>
          <p style={{ color: "#b0c4c6", fontSize: "0.95rem" }}>
            Here is your daily operational summary for AlArabia Fi Buyutikum.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link to="/instructor/tasks" className="btn-primary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={18} /> New Task
          </Link>
          <Link
            to="/instructor/attendance"
            style={{
              padding: "10px 18px",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <ClipboardCheck size={18} /> Mark Attendance
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(255, 107, 107, 0.15)",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            color: "#ff6b6b",
            padding: "1rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}
        >
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.2rem"
        }}
      >
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className="glass-panel"
            style={{
              padding: "1.5rem",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              transition: "transform 0.2s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", color: "#b0c4c6" }}>{card.title}</span>
              {card.icon}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#fff" }}>{card.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              View details <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout: Classes & Pending Submissions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.5rem"
        }}
      >
        {/* Classes Schedule */}
        <div className="glass-panel" style={{ padding: "1.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>My Active Classes</h3>
            <Link to="/instructor/classes" style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: "0.85rem" }}>
              View all
            </Link>
          </div>

          {classes.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.9rem" }}>No classes or slots assigned yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {classes.slice(0, 4).map((c, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    padding: "1rem",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{c.days}</div>
                    <div style={{ fontSize: "0.85rem", color: "#b0c4c6" }}>{c.time}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        background: "rgba(197, 229, 232, 0.15)",
                        color: "var(--color-primary)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600"
                      }}
                    >
                      {c.students_count} {c.students_count === 1 ? "student" : "students"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Submissions */}
        <div className="glass-panel" style={{ padding: "1.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Submissions Awaiting Review</h3>
            <Link to="/instructor/submissions" style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: "0.85rem" }}>
              View all
            </Link>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#888" }}>
              <ClipboardCheck size={36} color="var(--color-primary)" style={{ margin: "0 auto 0.5rem", opacity: 0.6 }} />
              <p style={{ fontSize: "0.9rem" }}>No pending submissions to grade right now.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    padding: "1rem",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{sub.student_name || "Student"}</div>
                    <div style={{ fontSize: "0.8rem", color: "#b0c4c6" }}>{sub.task_title || "Assignment"}</div>
                  </div>
                  <Link
                    to="/instructor/submissions"
                    className="btn-primary"
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      textDecoration: "none"
                    }}
                  >
                    Grade Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
