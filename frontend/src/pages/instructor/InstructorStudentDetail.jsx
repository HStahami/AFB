import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  FileText,
  ClipboardCheck,
  Award,
  AlertCircle
} from "lucide-react";
import { studentsApi, reportsApi, submissionsApi, attendanceApi } from "../../api";
import { getAvatarUrl } from "../../api/client";

export function InstructorStudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [report, setReport] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, reportData, subsData, attData] = await Promise.all([
          studentsApi.getStudentProfile(id),
          reportsApi.getStudentReport(id).catch(() => null),
          submissionsApi.getAll({ student_id: id }).catch(() => []),
          attendanceApi.getAll({ student_id: id }).catch(() => [])
        ]);

        setStudent(profileData);
        setReport(reportData);
        setSubmissions(subsData);
        setAttendanceRecords(attData);
      } catch (err) {
        setError(err.message || "Failed to load student details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudentData();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-primary)" }}>
        Loading student record...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="glass-panel" style={{ padding: "2.5rem", textAlign: "center" }}>
        <AlertCircle size={40} color="#ff6b6b" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.3rem", color: "#ff6b6b" }}>Unable to View Student</h2>
        <p style={{ color: "#b0c4c6", margin: "0.8rem 0 1.5rem" }}>
          {error || "This student was not found or is not assigned to your classes."}
        </p>
        <Link to="/instructor/students" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
          Return to My Students
        </Link>
      </div>
    );
  }

  const studentName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || "Student";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Back Button & Header */}
      <div>
        <Link
          to="/instructor/students"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--color-primary)",
            textDecoration: "none",
            fontSize: "0.9rem",
            marginBottom: "1rem"
          }}
        >
          <ArrowLeft size={16} /> Back to My Students
        </Link>

        <div
          className="glass-panel"
          style={{
            padding: "1.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <img
              src={getAvatarUrl(student.profile_image, studentName)}
              alt={studentName}
              style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid var(--color-primary)" }}
            />
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: "700", marginBottom: "0.2rem" }}>{studentName}</h1>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
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
                  {student.student_code}
                </span>
                <span style={{ color: "#888", fontSize: "0.85rem" }}>•</span>
                <span style={{ color: "#b0c4c6", fontSize: "0.85rem" }}>{student.slot || "Flexible Schedule"}</span>
              </div>
            </div>
          </div>

          {report && (
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                backgroundColor: "rgba(255,255,255,0.03)",
                padding: "0.8rem 1.4rem",
                borderRadius: "8px"
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Attendance</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#55efc4" }}>
                  {report.attendance?.attendance_rate}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Tasks Done</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#4ecdc4" }}>
                  {report.tasks?.completion_rate}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Progress Index</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-primary)" }}>
                  {report.overall_progress_score}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
        {[
          { id: "overview", label: "Overview & Profile" },
          { id: "submissions", label: `Submissions (${submissions.length})` },
          { id: "attendance", label: `Attendance History (${attendanceRecords.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              color: activeTab === t.id ? "var(--color-primary)" : "#b0c4c6",
              borderBottom: activeTab === t.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              fontWeight: activeTab === t.id ? "600" : "400",
              fontSize: "0.95rem"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.8rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={18} color="var(--color-primary)" /> Contact & Demographics
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.9rem", color: "#b0c4c6" }}>
              <div><strong style={{ color: "#fff" }}>Email:</strong> {student.email}</div>
              <div><strong style={{ color: "#fff" }}>Phone:</strong> {student.phone || "Not provided"}</div>
              <div><strong style={{ color: "#fff" }}>Date of Birth:</strong> {student.date_of_birth || "Not provided"}</div>
              <div><strong style={{ color: "#fff" }}>Country:</strong> {student.country || "Not specified"}</div>
              <div><strong style={{ color: "#fff" }}>City:</strong> {student.city || "Not specified"}</div>
              <div><strong style={{ color: "#fff" }}>Address:</strong> {student.address || "Not provided"}</div>
              <div><strong style={{ color: "#fff" }}>Education:</strong> {student.education || "Not specified"}</div>
              <div><strong style={{ color: "#fff" }}>Referred By:</strong> {student.referral_source || "Not specified"}</div>
              <div><strong style={{ color: "#fff" }}>Bio:</strong> {student.bio || "No biography provided."}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.8rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} color="var(--color-primary)" /> Guardian & Course Preferences
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.9rem", color: "#b0c4c6" }}>
              <div><strong style={{ color: "#fff" }}>Father / Guardian Name:</strong> {student.guardian_name || "Not provided"}</div>
              <div><strong style={{ color: "#fff" }}>Father / Guardian Phone:</strong> {student.guardian_phone || "Not provided"}</div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.6rem", marginTop: "0.2rem" }}>
                <strong style={{ color: "#fff" }}>Enrolled / Selected Course:</strong> {student.course || student.preferred_course || "Standard Arabic"}
              </div>
              <div><strong style={{ color: "#fff" }}>Preferred Days:</strong> {student.preferred_days || "Weekdays"}</div>
              <div><strong style={{ color: "#fff" }}>Class Type:</strong> {student.preferred_class_type || "1 on 1"}</div>
              <div><strong style={{ color: "#fff" }}>Preferred Time Slot:</strong> {student.preferred_time_slot || student.slot || "Not specified"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Submissions */}
      {activeTab === "submissions" && (
        <div className="glass-panel" style={{ padding: "1.8rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.2rem" }}>
            Task Submissions & Assessments
          </h3>
          {submissions.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.9rem" }}>No task submissions recorded yet for this student.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    padding: "1.2rem",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600", fontSize: "1rem", color: "#fff" }}>
                      {sub.task_title || "Assignment"}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        backgroundColor: sub.status === "reviewed" ? "rgba(85, 239, 196, 0.15)" : "rgba(255, 184, 108, 0.15)",
                        color: sub.status === "reviewed" ? "#55efc4" : "#ffb86c"
                      }}
                    >
                      {sub.status === "reviewed" ? "Graded" : "Submitted"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#b0c4c6" }}>{sub.content}</p>

                  {sub.feedback && (
                    <div style={{ marginTop: "0.4rem", padding: "0.6rem", backgroundColor: "rgba(197, 229, 232, 0.08)", borderRadius: "6px", fontSize: "0.85rem" }}>
                      <strong style={{ color: "var(--color-primary)" }}>Instructor Feedback:</strong> {sub.feedback}
                    </div>
                  )}

                  <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.2rem" }}>
                    Submitted on: {new Date(sub.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === "attendance" && (
        <div className="glass-panel" style={{ padding: "1.8rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.2rem" }}>
            Attendance History
          </h3>
          {attendanceRecords.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.9rem" }}>No attendance recorded yet for this student.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", color: "#b0c4c6" }}>Date</th>
                    <th style={{ padding: "10px 14px", color: "#b0c4c6" }}>Status</th>
                    <th style={{ padding: "10px 14px", color: "#b0c4c6" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "500" }}>{att.date}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            textTransform: "capitalize",
                            fontWeight: "600",
                            color:
                              att.status === "present"
                                ? "#55efc4"
                                : att.status === "late"
                                ? "#ffeaa7"
                                : att.status === "excused"
                                ? "#74b9ff"
                                : "#ff7675"
                          }}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#b0c4c6" }}>{att.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
