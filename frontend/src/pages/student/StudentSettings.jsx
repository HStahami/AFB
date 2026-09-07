import React, { useState } from 'react';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export function StudentSettings() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.current_password) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (formData.new_password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      setSuccessMessage('Password changed successfully! Keep your credentials safe.');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      console.error('Password change error:', err);
      setErrorMessage(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Settings Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
          Account Settings
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Manage your account security and password credentials.
        </p>
      </div>

      {/* Account Info Summary Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#f1f5f9' }}>
          Account Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Account Username</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>{user?.username || 'N/A'}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Email Address</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>{user?.email || 'N/A'}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Student ID Code</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#34d399',
              }}
            >
              {user?.student_code || 'Pending'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Account Type</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a78bfa', textTransform: 'capitalize' }}>
              {user?.role || 'Student'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            🔒
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Change Password
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Ensure your account is using a strong, unique password.
            </p>
          </div>
        </div>

        {successMessage && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>✓</span> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
              Current Password
            </label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              required
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
              New Password (minimum 8 characters)
            </label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
