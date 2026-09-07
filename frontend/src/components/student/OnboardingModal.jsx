import React, { useState } from 'react';
import { authApi, studentsApi } from '../../api';

export function OnboardingModal({ user, onComplete }) {
  const isFirstLogin = !!user?.first_login;
  const isProfileIncomplete = !user?.profile_completed;

  // Step 1 if first_login, Step 2 if profile_completed is false
  const [step, setStep] = useState(isFirstLogin ? 1 : 2);

  // Step 1: Password Change State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Step 2: Profile Completion State
  const [profileData, setProfileData] = useState({
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: 'Parent',
    bio: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
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
      setPasswordLoading(true);
      await authApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      // Refresh AuthContext user state to clear first_login
      if (onComplete) {
        await onComplete();
      }

      // Transition to Step 2: Profile Completion
      setStep(2);
    } catch (err) {
      console.error('Password change error during onboarding:', err);
      setPasswordError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);

    try {
      setProfileLoading(true);
      await studentsApi.updateProfile({
        phone: profileData.phone || undefined,
        date_of_birth: profileData.date_of_birth || undefined,
        gender: profileData.gender || undefined,
        address: profileData.address || undefined,
        guardian_name: profileData.guardian_name || undefined,
        guardian_phone: profileData.guardian_phone || undefined,
        guardian_relationship: profileData.guardian_relationship || undefined,
        bio: profileData.bio || undefined,
      });

      // Refresh AuthContext to mark profile_completed = true
      if (onComplete) {
        await onComplete();
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      setProfileError(err.message || 'Failed to complete profile. Please review the form fields.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 34, 36, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2.5rem',
          backgroundColor: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(197, 229, 232, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Header Indicator */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--color-primary)',
              fontSize: '1.6rem',
              marginBottom: '1rem',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {step === 1 ? '🔒' : '📋'}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            {step === 1 ? 'Mandatory Password Setup' : 'Complete Your Student Profile'}
          </h2>

          <p style={{ color: '#8892b0', fontSize: '0.88rem', marginTop: '0.5rem', marginBottom: 0 }}>
            {step === 1
              ? 'As a newly provisioned student, you must set a private, secure password before accessing the LMS portal.'
              : 'Please finalize your contact and academic profile details to complete portal enrollment.'}
          </p>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <div
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: step >= 1 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.2)',
              }}
            />
            <div
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: step === 2 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.2)',
              }}
            />
          </div>
        </div>

        {/* STEP 1: PASSWORD CHANGE */}
        {step === 1 && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {passwordError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderLeft: '4px solid #ef4444',
                  color: '#f87171',
                  fontSize: '0.85rem',
                }}
              >
                {passwordError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                Temporary / Current Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter the password provided in your email"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                New Secure Password * (Minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Create a strong password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
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
                placeholder="Re-type your new password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                border: 'none',
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                marginTop: '0.5rem',
              }}
            >
              {passwordLoading ? 'Updating Password...' : 'Save Password & Continue →'}
            </button>
          </form>
        )}

        {/* STEP 2: PROFILE COMPLETION */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {profileError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderLeft: '4px solid #ef4444',
                  color: '#f87171',
                  fontSize: '0.85rem',
                }}
              >
                {profileError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.3rem' }}>
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+966 5x xxx xxxx"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.3rem' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.9rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.3rem' }}>
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.3rem' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="City, Country"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Guardian Info */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Guardian / Emergency Contact
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Guardian Full Name"
                    value={profileData.guardian_name}
                    onChange={(e) => setProfileData({ ...profileData, guardian_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Guardian Phone"
                    value={profileData.guardian_phone}
                    onChange={(e) => setProfileData({ ...profileData, guardian_phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.3rem' }}>
                Short Bio / Learning Goals
              </label>
              <textarea
                rows="2"
                placeholder="Tell your instructor about your Arabic language learning objectives..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.9rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                border: 'none',
                cursor: profileLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                marginTop: '0.5rem',
              }}
            >
              {profileLoading ? 'Finalizing Profile...' : 'Complete Profile & Open Portal ✓'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
