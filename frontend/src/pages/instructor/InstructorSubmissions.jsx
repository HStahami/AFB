import React, { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, Search, X, Award, ExternalLink } from "lucide-react";
import { submissionsApi, assessmentsApi } from "../../api";
import { inputStyle } from "../../components/common/styles";

export function InstructorSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [score, setScore] = useState("");
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState("");
  const [gradeError, setGradeError] = useState("");

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await submissionsApi.getAll();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openGradingModal = (sub) => {
    setSelectedSubmission(sub);
    setScore(sub.score ? String(sub.score) : "");
    setGrade(sub.grade || "");
    setFeedback(sub.feedback || "");
    setGradeError("");
    setGradeSuccess("");
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setGrading(true);
    setGradeError("");
    setGradeSuccess("");

    try {
      await assessmentsApi.grade({
        submission_id: selectedSubmission.id || selectedSubmission._id,
        score: score ? parseFloat(score) : null,
        grade: grade || null,
        feedback
      });

      setGradeSuccess("Submission graded successfully! Student notified.");
      setTimeout(() => {
        setSelectedSubmission(null);
        fetchSubmissions();
      }, 1200);
    } catch (err) {
      setGradeError(err.message || "Failed to submit grade.");
    } finally {
      setGrading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "pending"
        ? s.status === "submitted"
        : s.status === "reviewed";
    const matchesSearch =
      (s.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.student_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.task_title || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.3rem" }} className="gradient-text">
          Student Submissions & Grading
        </h1>
        <p style={{ color: "#b0c4c6", fontSize: "0.95rem" }}>
          Review homework answers, grade deliverables, and provide student feedback.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div
        className="glass-panel"
        style={{
          padding: "1.2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "all", label: "All Submissions" },
            { id: "pending", label: "Pending Review" },
            { id: "reviewed", label: "Reviewed" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "600",
                backgroundColor: statusFilter === tab.id ? "rgba(197, 229, 232, 0.2)" : "transparent",
                color: statusFilter === tab.id ? "var(--color-primary)" : "#b0c4c6"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          <input
            type="text"
            placeholder="Search student or task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "42px" }}
          />
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-primary)" }}>Loading submissions...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
          <FileText size={40} color="var(--color-primary)" style={{ margin: "0 auto 0.8rem", opacity: 0.6 }} />
          <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>No submissions found</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            {statusFilter === "pending"
              ? "All submitted assignments have been graded!"
              : "No student submissions recorded yet."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                <th style={{ padding: "12px 14px", color: "#b0c4c6" }}>Student</th>
                <th style={{ padding: "12px 14px", color: "#b0c4c6" }}>Task Title</th>
                <th style={{ padding: "12px 14px", color: "#b0c4c6" }}>Submitted Date</th>
                <th style={{ padding: "12px 14px", color: "#b0c4c6" }}>Status</th>
                <th style={{ padding: "12px 14px", color: "#b0c4c6", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px", fontWeight: "600", color: "#fff" }}>
                    <div>{sub.student_name || "Student"}</div>
                    {sub.student_code && (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-primary)" }}>{sub.student_code}</span>
                    )}
                  </td>
                  <td style={{ padding: "14px", color: "#b0c4c6" }}>{sub.task_title || "Assignment"}</td>
                  <td style={{ padding: "14px", color: "#888" }}>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                  <td style={{ padding: "14px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        backgroundColor: sub.status === "reviewed" ? "rgba(85, 239, 196, 0.15)" : "rgba(255, 184, 108, 0.15)",
                        color: sub.status === "reviewed" ? "#55efc4" : "#ffb86c"
                      }}
                    >
                      {sub.status === "reviewed" ? "Reviewed" : "Pending Review"}
                    </span>
                  </td>
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <button
                      onClick={() => openGradingModal(sub)}
                      className="btn-primary"
                      style={{ padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      {sub.status === "reviewed" ? "View / Edit Grade" : "Grade Submission"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grading / Review Modal */}
      {selectedSubmission && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
        >
          <div className="glass-panel" style={{ maxWidth: "560px", width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }} className="gradient-text">
                  Grade Submission
                </h2>
                <p style={{ color: "#b0c4c6", fontSize: "0.85rem" }}>
                  {selectedSubmission.student_name} • {selectedSubmission.task_title}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            {gradeSuccess && (
              <div style={{ backgroundColor: "rgba(85, 239, 196, 0.15)", color: "#55efc4", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem" }}>
                {gradeSuccess}
              </div>
            )}
            {gradeError && (
              <div style={{ backgroundColor: "rgba(255, 107, 107, 0.15)", color: "#ff6b6b", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem" }}>
                {gradeError}
              </div>
            )}

            {/* Submission Content Box */}
            <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1.2rem", borderRadius: "8px", marginBottom: "1.2rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.4rem" }}>Student Response:</div>
              <p style={{ fontSize: "0.95rem", color: "#fff", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                {selectedSubmission.content}
              </p>

              {selectedSubmission.attachment_urls && selectedSubmission.attachment_urls.length > 0 && (
                <div style={{ marginTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.6rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.3rem" }}>Attachments:</div>
                  {selectedSubmission.attachment_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" }}
                    >
                      <ExternalLink size={14} /> View Deliverable #{i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Evaluation Form */}
            <form onSubmit={handleGradeSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                    Numeric Score (e.g. 95)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    placeholder="95.0"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                    Letter Grade / Status
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A+, Pass, Excellent"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                  Feedback & Recommendations
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide personalized academic feedback to guide the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={grading}
                className="btn-primary"
                style={{ padding: "14px", marginTop: "0.5rem", opacity: grading ? 0.7 : 1 }}
              >
                {grading ? "Saving Evaluation..." : "Save Evaluation & Notify Student"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
