import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, allowedRoles = [], redirectTo }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass-panel" style={{ padding: "2rem 3rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-primary)", fontSize: "1.2rem" }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const targetRedirect = redirectTo || (
      location.pathname.startsWith("/instructor")
        ? "/instructor/login"
        : location.pathname.startsWith("/student")
        ? "/student/login"
        : "/admin"
    );
    return <Navigate to={targetRedirect} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="glass-panel" style={{ padding: "3rem", maxWidth: "450px", textAlign: "center" }}>
          <h2 style={{ color: "#ff6b6b", marginBottom: "1rem" }}>Access Denied</h2>
          <p style={{ color: "#b0c4c6", marginBottom: "1.5rem" }}>
            Your account ({role}) does not have permission to view this section.
          </p>
          <a href="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}
