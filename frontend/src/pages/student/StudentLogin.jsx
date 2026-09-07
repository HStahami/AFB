import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function StudentLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userData = await login(identifier.trim(), password);

      // Verify role authorization
      if (userData.role !== 'student') {
        logout();
        setError(
          `Access Denied: This account has '${userData.role}' privileges. Please log in through the ${
            userData.role === 'instructor' ? 'Instructor Portal (/instructor/login)' : 'Admin Dashboard (/admin)'
          }.`
        );
        return;
      }

      navigate('/student');
    } catch (err) {
      console.error('Student login error:', err);
      setError(err.message || 'Invalid Student Code / Email or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          textAlign: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(197, 229, 232, 0.2)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
          <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 48, width: 64, borderRadius: 6 }} />
        </Link>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
          Student Portal Login
        </h1>

        <p style={{ color: '#8892b0', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
          Access your courses, tasks, attendance, and academic feedback.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderLeft: '4px solid #ef4444',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Student Code or Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AFB-2026-0001 or email@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal →'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', fontSize: '0.8rem', color: '#8892b0' }}>
          <span>Need help? </span>
          <Link to="/contact" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Contact Administration
          </Link>
          <div style={{ marginTop: '0.5rem' }}>
            <Link to="/" style={{ color: '#8892b0', textDecoration: 'none' }}>
              ← Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
