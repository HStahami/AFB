import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Search, Filter, ArrowRight, Mail, Phone, Calendar } from "lucide-react";
import { instructorsApi } from "../../api";
import { getAvatarUrl } from "../../api/client";
import { inputStyle } from "../../components/common/styles";

export function InstructorStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const data = await instructorsApi.getMyStudents();
        setStudents(data);
      } catch (err) {
        setError(err.message || "Failed to load assigned students.");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const distinctSlots = Array.from(new Set(students.map((s) => s.slot).filter(Boolean)));

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesSlot = slotFilter === "all" || s.slot === slotFilter;
    return matchesSearch && matchesSlot;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.3rem" }} className="gradient-text">
            My Students
          </h1>
          <p style={{ color: "#b0c4c6", fontSize: "0.95rem" }}>
            Viewing all students assigned to your classes and slots.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div
        className="glass-panel"
        style={{
          padding: "1.2rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          <input
            type="text"
            placeholder="Search by student name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "42px" }}
          />
        </div>

        <div style={{ minWidth: "200px" }}>
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="all">All Class Slots</option>
            {distinctSlots.map((slot, i) => (
              <option key={i} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Display */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-primary)" }}>
          Loading assigned student roster...
        </div>
      ) : error ? (
        <div style={{ padding: "1.5rem", color: "#ff6b6b" }}>{error}</div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
          <Users size={40} color="var(--color-primary)" style={{ margin: "0 auto 0.8rem", opacity: 0.6 }} />
          <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>No students found</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            {search || slotFilter !== "all" ? "Try adjusting your search or filter." : "You currently have no assigned students."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.2rem"
          }}
        >
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="glass-panel"
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <img
                  src={getAvatarUrl(student.profile_image, student.name)}
                  alt={student.name}
                  style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid var(--color-primary)" }}
                />
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "2px" }}>{student.name}</h3>
                  <span
                    style={{
                      background: "rgba(197, 229, 232, 0.15)",
                      color: "var(--color-primary)",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: "600"
                    }}
                  >
                    {student.student_code}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#b0c4c6", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={15} color="#888" /> {student.email}
                </div>
                {student.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Phone size={15} color="#888" /> {student.phone}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={15} color="#888" /> {student.slot}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  padding: "0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem"
                }}
              >
                <div>
                  <span style={{ color: "#888", display: "block", fontSize: "0.75rem" }}>Attendance</span>
                  <span style={{ fontWeight: "600", color: student.attendance_rate >= 80 ? "#55efc4" : "#ffb86c" }}>
                    {student.attendance_rate}%
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#888", display: "block", fontSize: "0.75rem" }}>Submissions</span>
                  <span style={{ fontWeight: "600", color: "#fff" }}>{student.total_submissions}</span>
                </div>
              </div>

              <Link
                to={`/instructor/students/${student.id}`}
                className="btn-primary"
                style={{
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
                View Academic History <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
