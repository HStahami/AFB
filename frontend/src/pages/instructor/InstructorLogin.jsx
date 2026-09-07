import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { inputStyle } from "../../components/common/styles";

export function InstructorLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(username, password);
      if (userData.role === "instructor" || userData.role === "admin") {
        navigate("/instructor");
      } else {
        logout();
        setError("Access Denied: Student accounts are not authorized for the Instructor Portal.");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem"
      }}
    >
      <div className="glass-panel" style={{ padding: "3rem 2.5rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            backgroundColor: "rgba(197, 229, 232, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem"
          }}
        >
          <BookOpen size={30} color="var(--color-primary)" />
        </div>

        <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.5rem" }} className="gradient-text">
          Instructor Portal
        </h2>
        <p style={{ color: "#b0c4c6", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Sign in to manage your classes, tasks, and student evaluations.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(255, 107, 107, 0.15)",
              border: "1px solid rgba(255, 107, 107, 0.3)",
              color: "#ff6b6b",
              padding: "0.8rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.4rem", color: "#b0c4c6" }}>
              Username or Email
            </label>
            <input
              type="text"
              placeholder="e.g. instructor@alarabia.edu"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.4rem", color: "#b0c4c6" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ padding: "14px", fontSize: "1rem", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing In..." : "Log In to Portal"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
          <Link to="/" style={{ color: "#b0c4c6", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
