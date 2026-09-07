import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, ClipboardCheck, CheckSquare, Clock } from "lucide-react";
import { instructorsApi } from "../../api";

export function InstructorClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const data = await instructorsApi.getMyClasses();
        setClasses(data);
      } catch (err) {
        setError(err.message || "Failed to load classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.3rem" }} className="gradient-text">
          My Classes & Schedules
        </h1>
        <p style={{ color: "#b0c4c6", fontSize: "0.95rem" }}>
          Active slots and course groups assigned to you.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-primary)" }}>
          Loading your classes...
        </div>
      ) : error ? (
        <div style={{ padding: "1.5rem", color: "#ff6b6b" }}>{error}</div>
      ) : classes.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
          <Calendar size={40} color="var(--color-primary)" style={{ margin: "0 auto 0.8rem", opacity: 0.6 }} />
          <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>No classes assigned yet</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            When the administration assigns students to your schedule, your classes will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem"
          }}
        >
          {classes.map((c, i) => (
            <div
              key={i}
              className="glass-panel"
              style={{
                padding: "1.8rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.3rem" }}>{c.days}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#b0c4c6", fontSize: "0.9rem" }}>
                    <Clock size={16} color="var(--color-primary)" /> {c.time}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: "rgba(197, 229, 232, 0.15)",
                    color: "var(--color-primary)",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}
                >
                  Active Class
                </span>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  padding: "0.9rem",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                <Users size={18} color="var(--color-primary)" />
                <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                  {c.students_count} {c.students_count === 1 ? "enrolled student" : "enrolled students"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", marginTop: "auto" }}>
                <Link
                  to={`/instructor/attendance?slot_id=${c.slot_id}`}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    textDecoration: "none",
                    textAlign: "center",
                    padding: "10px",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <ClipboardCheck size={16} /> Mark Attendance
                </Link>

                <Link
                  to="/instructor/tasks"
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <CheckSquare size={16} /> Task
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
