import React, { useState, useEffect } from 'react';
import { instructorsApi, authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export function InstructorProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security'

  // Profile Form State
  const [formData, setFormData] = useState({
    bio: '',
    specialization: '',
    avatar_url: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await instructorsApi.getMyProfile();
      setProfile(data);
      setFormData({
        bio: data.bio || '',
        specialization: data.specialization || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (err) {
      console.error('Error loading instructor profile:', err);
      setProfileError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccess(null);
      setProfileError(null);
      const updated = await instructorsApi.updateMyProfile(formData);
      setProfile(updated);
      setProfileSuccess('Profile updated successfully!');
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordSuccess('Password changed successfully! Keep your new credentials safe.');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          Instructor Account & Settings
        </h1>
        <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
          Manage your instructor identity, biographical summary, and account security.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            color: activeTab === 'profile' ? 'var(--color-primary)' : '#8892b0',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          👤 Profile Information
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            color: activeTab === 'security' ? 'var(--color-primary)' : '#8892b0',
            fontWeight: activeTab === 'security' ? 700 : 500,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'security' ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          🔒 Security & Password
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading profile...
        </div>
      ) : activeTab === 'profile' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Read-only Identity Card */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                margin: '0 auto 1.25rem auto',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'var(--color-primary)',
                overflow: 'hidden',
              }}
            >
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                profile?.name?.[0]?.toUpperCase() || 'I'
              )}
            </div>

            <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 0.25rem 0', fontWeight: 700 }}>
              {profile?.name || user?.email}
            </h3>

            <div style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              {profile?.specialization || 'Arabic Language Instructor'}
            </div>

            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                textTransform: 'uppercase',
              }}
            >
              {profile?.status || 'Active Instructor'}
            </span>

            <div
              style={{
                marginTop: '1.75rem',
                textAlign: 'left',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ color: '#8892b0', fontSize: '0.75rem' }}>Email Address</div>
                <div style={{ color: '#fff' }}>{profile?.email}</div>
              </div>
              {profile?.phone && (
                <div>
                  <div style={{ color: '#8892b0', fontSize: '0.75rem' }}>Phone Number</div>
                  <div style={{ color: '#fff' }}>{profile.phone}</div>
                </div>
              )}
              <div>
                <div style={{ color: '#8892b0', fontSize: '0.75rem' }}>Assigned Slot</div>
                <div style={{ color: '#fff' }}>{profile?.slot_name || 'Standard Slot'}</div>
              </div>
            </div>
          </div>

          {/* Editable Bio & Details */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 600 }}>
              Edit Instructor Details
            </h2>

            {profileSuccess && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  marginBottom: '1.5rem',
                  borderLeft: '4px solid #10b981',
                }}
              >
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  marginBottom: '1.5rem',
                  borderLeft: '4px solid #ef4444',
                }}
              >
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                  Professional Specialization / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Classical Arabic Grammar, Tajweed & Quranic Studies"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/... or profile image link"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                  Biographical Summary
                </label>
                <textarea
                  rows="4"
                  placeholder="Tell your students about your teaching experience, educational background, and areas of expertise..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary"
                  style={{
                    padding: '0.7rem 1.8rem',
                    border: 'none',
                    cursor: savingProfile ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {savingProfile ? 'Updating...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Security Tab */
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 600 }}>
            Change Password
          </h2>
          <p style={{ color: '#8892b0', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Ensure your account is protected with a strong, unique password of at least 8 characters.
          </p>

          {passwordSuccess && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                marginBottom: '1.5rem',
                borderLeft: '4px solid #10b981',
              }}
            >
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                marginBottom: '1.5rem',
                borderLeft: '4px solid #ef4444',
              }}
            >
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                Current Password *
              </label>
              <input
                type="password"
                required
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                New Password * (Min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={changingPassword}
                className="btn-primary"
                style={{
                  padding: '0.7rem 1.8rem',
                  border: 'none',
                  cursor: changingPassword ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {changingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
