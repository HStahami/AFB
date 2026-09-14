import React, { useState, useEffect } from 'react';
import { authApi, studentsApi, modulesApi, slotsApi } from '../../api';

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
    name: '',
    guardian_name: '',
    email: '',
    phone: '',
    guardian_phone: '',
    date_of_birth: '',
    country: '',
    city: '',
    address: '',
    education: 'Undergraduate',
    referral_source: 'Social Media',
    course: 'Modern Standard Arabic',
    selected_module: 'All 4 Modules Included',
    preferred_days: 'Weekdays',
    preferred_class_type: '1 on 1',
    preferred_time_slot: '',
    bio: '',
  });

  const [modulesList, setModulesList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      const [profileRes, modulesRes, slotsRes] = await Promise.allSettled([
        studentsApi.getProfile(),
        modulesApi.getAll(),
        slotsApi.getAll(),
      ]);

      const prof = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const mods = modulesRes.status === 'fulfilled' && Array.isArray(modulesRes.value) ? modulesRes.value : [];
      const slots = slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value) ? slotsRes.value : [];

      setModulesList(mods);
      setSlotsList(slots);

      const resolvedName =
        prof?.name ||
        (prof?.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : '') ||
        user?.username ||
        '';

      const resolvedEmail = prof?.email || user?.email || '';
      const resolvedPhone = prof?.phone || '';

      const rawCourse = prof?.course || prof?.preferred_course || 'Modern Standard Arabic';
      let resolvedCourse = rawCourse;
      if (!['Modern Standard Arabic', 'Arabic For Kids', 'Arabic Training (MENA)'].includes(rawCourse)) {
        if (rawCourse.toLowerCase().includes('kid')) {
          resolvedCourse = 'Arabic For Kids';
        } else if (rawCourse.toLowerCase().includes('mena') || rawCourse.toLowerCase().includes('train')) {
          resolvedCourse = 'Arabic Training (MENA)';
        } else {
          resolvedCourse = 'Modern Standard Arabic';
        }
      }

      let defaultModule = 'All 4 Modules Included';
      if (resolvedCourse === 'Arabic Training (MENA)') {
        defaultModule = 'Team Training';
      } else if (resolvedCourse === 'Arabic For Kids') {
        defaultModule = '';
      }
      const resolvedModule = prof?.selected_module || prof?.module || defaultModule;
      const resolvedDays = prof?.preferred_days || 'Weekdays';
      const resolvedClassType = resolvedCourse === 'Arabic Training (MENA)'
        ? 'Team Training'
        : (resolvedDays === 'Weekdays' ? '1 on 1' : (prof?.preferred_class_type || '1 on 1'));
      const resolvedSlot = prof?.preferred_time_slot || prof?.slot || '';

      setProfileData({
        name: resolvedName,
        guardian_name: prof?.guardian_name || prof?.father_name || '',
        email: resolvedEmail,
        phone: resolvedPhone,
        guardian_phone: prof?.guardian_phone || prof?.father_phone || '',
        date_of_birth: prof?.date_of_birth ? prof.date_of_birth.substring(0, 10) : '',
        country: prof?.country || '',
        city: prof?.city || '',
        address: prof?.address || '',
        education: prof?.education || 'Undergraduate',
        referral_source: prof?.referral_source || 'Social Media',
        course: resolvedCourse,
        selected_module: resolvedModule,
        preferred_days: resolvedDays,
        preferred_class_type: resolvedClassType,
        preferred_time_slot: resolvedSlot,
        bio: prof?.bio || '',
      });
    } catch (err) {
      console.error('Error loading onboarding initial data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleCourseChange = (newCourse) => {
    let defaultModule = '';
    let defaultClassType = '1 on 1';
    if (newCourse === 'Modern Standard Arabic') {
      defaultModule = 'All 4 Modules Included';
      defaultClassType = profileData.preferred_days === 'Weekdays' ? '1 on 1' : (profileData.preferred_class_type === 'Team Training' ? '1 on 1' : profileData.preferred_class_type || '1 on 1');
    } else if (newCourse === 'Arabic Training (MENA)') {
      defaultModule = 'Team Training';
      defaultClassType = 'Team Training';
    } else if (newCourse === 'Arabic For Kids') {
      defaultModule = '';
      defaultClassType = profileData.preferred_days === 'Weekdays' ? '1 on 1' : (profileData.preferred_class_type === 'Team Training' ? '1 on 1' : profileData.preferred_class_type || '1 on 1');
    }
    setProfileData((prev) => ({
      ...prev,
      course: newCourse,
      selected_module: defaultModule,
      preferred_class_type: defaultClassType,
    }));
  };

  const handleDaysChange = (newDays) => {
    setProfileData((prev) => ({
      ...prev,
      preferred_days: newDays,
      preferred_class_type: prev.course === 'Arabic Training (MENA)'
        ? 'Team Training'
        : (newDays === 'Weekdays' ? '1 on 1' : (prev.preferred_class_type === 'Team Training' ? '1 on 1' : prev.preferred_class_type || '1 on 1')),
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);

    try {
      setProfileLoading(true);
      await studentsApi.updateProfile({
        phone: profileData.phone || undefined,
        guardian_name: profileData.guardian_name || undefined,
        guardian_phone: profileData.guardian_phone || undefined,
        date_of_birth: profileData.date_of_birth || undefined,
        country: profileData.country || undefined,
        city: profileData.city || undefined,
        address: profileData.address || undefined,
        education: profileData.education || undefined,
        referral_source: profileData.referral_source || undefined,
        course: profileData.course || undefined,
        preferred_course: profileData.course || undefined,
        module: profileData.selected_module || undefined,
        selected_module: profileData.selected_module || undefined,
        preferred_module: profileData.selected_module || undefined,
        preferred_days: profileData.preferred_days || undefined,
        preferred_class_type: profileData.preferred_class_type || undefined,
        preferred_time_slot: profileData.preferred_time_slot || undefined,
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
          maxWidth: step === 1 ? '540px' : '760px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.25rem',
          backgroundColor: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(197, 229, 232, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          borderRadius: '16px',
        }}
      >
        {/* Header Indicator */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
              marginBottom: '0.85rem',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {step === 1 ? '🔒' : '📋'}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            {step === 1 ? 'Mandatory Password Setup' : 'Complete Your Student Profile'}
          </h2>

          <p style={{ color: '#8892b0', fontSize: '0.88rem', marginTop: '0.4rem', marginBottom: 0 }}>
            {step === 1
              ? 'As a newly provisioned student, you must set a private, secure password before accessing the LMS portal.'
              : 'Please finalize your profile, academic background, and class preferences to complete enrollment.'}
          </p>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.1rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
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
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                borderRadius: '8px',
              }}
            >
              {passwordLoading ? 'Updating Password...' : 'Save Password & Continue →'}
            </button>
          </form>
        )}

        {/* STEP 2: PROFILE COMPLETION */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

            {/* Section 1: Personal & Contact Details */}
            <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>👤</span> Personal & Contact Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* 1. Name (from admission form, read-only) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 2. Father/Guardian Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Father / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Father or Guardian Name"
                    value={profileData.guardian_name}
                    onChange={(e) => setProfileData({ ...profileData, guardian_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 3. Email (from admission form, read-only) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 4. Phone Number (prefilled from admission) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 5. Father/Guardian Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Father / Guardian Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +92 300 7654321"
                    value={profileData.guardian_phone}
                    onChange={(e) => setProfileData({ ...profileData, guardian_phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 6. Date of Birth */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
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

                {/* 7. Country */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pakistan, Saudi Arabia, UAE, UK"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 8. City */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lahore, Riyadh, Dubai, London"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 9. Address */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Residential address / street area"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
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

            {/* Section 2: Education & Background */}
            <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🎓</span> Education & Background
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* 10. Education */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Education *
                  </label>
                  <select
                    required
                    value={profileData.education}
                    onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Primary / Secondary">Primary / Middle School</option>
                    <option value="High School">High School / Matric / O-Levels</option>
                    <option value="Intermediate">Intermediate / A-Levels / FSc</option>
                    <option value="Undergraduate">Undergraduate / Bachelor's Degree</option>
                    <option value="Graduate">Graduate / Master's Degree</option>
                    <option value="Postgraduate">Postgraduate / Doctorate / PhD</option>
                    <option value="Islamic Studies">Islamic Studies / Dars-e-Nizami</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 11. How did you hear about us? */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    How did you hear about us? *
                  </label>
                  <select
                    required
                    value={profileData.referral_source}
                    onChange={(e) => setProfileData({ ...profileData, referral_source: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Social Media">Social Media (Facebook / Instagram / TikTok)</option>
                    <option value="Google Search">Google Search</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Friends & Family">Friends & Family Recommendation</option>
                    <option value="WhatsApp">WhatsApp Community</option>
                    <option value="Advertisement">Online Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Course & Class Preferences */}
            <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📚</span> Course & Class Preferences
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Course */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Course *
                  </label>
                  <select
                    required
                    value={profileData.course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Modern Standard Arabic">Modern Standard Arabic</option>
                    <option value="Arabic For Kids">Arabic For Kids</option>
                    <option value="Arabic Training (MENA)">Arabic Training (MENA)</option>
                  </select>
                </div>

                {/* Dynamic Modules Options based on Course */}
                {profileData.course === 'Modern Standard Arabic' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                      Modules (Options) *
                    </label>
                    <select
                      required
                      value={profileData.selected_module || 'All 4 Modules Included'}
                      onChange={(e) => setProfileData({ ...profileData, selected_module: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="All 4 Modules Included">All 4 Modules Included</option>
                      <option value="Module 1: Foundation (A1)">Module 1: Foundation (A1)</option>
                      <option value="Module 2: Elementary (A2)">Module 2: Elementary (A2)</option>
                      <option value="Module 3: Intermediate (B1)">Module 3: Intermediate (B1)</option>
                      <option value="Module 4: Advanced (B2)">Module 4: Advanced (B2)</option>
                    </select>
                  </div>
                )}

                {profileData.course === 'Arabic Training (MENA)' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                      Module / Training Track *
                    </label>
                    <select
                      value="Team Training"
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'not-allowed',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Team Training">Team Training</option>
                    </select>
                  </div>
                )}

                {/* Days */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Days *
                  </label>
                  <select
                    required
                    value={profileData.preferred_days}
                    onChange={(e) => handleDaysChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Weekdays">Weekdays</option>
                    <option value="Weekend">Weekend</option>
                    {profileData.course === 'Arabic Training (MENA)' && (
                      <option value="Custom Schedule">Custom Schedule (Team / Corporate)</option>
                    )}
                  </select>
                </div>

                {/* Class Type: for Modern Standard Arabic & Arabic For Kids */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Class Type *
                  </label>
                  {profileData.course === 'Arabic Training (MENA)' ? (
                    <select
                      value="Team Training"
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'not-allowed',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Team Training">Team Training</option>
                    </select>
                  ) : profileData.preferred_days === 'Weekdays' ? (
                    <select
                      value="1 on 1"
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'not-allowed',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="1 on 1">1 on 1</option>
                    </select>
                  ) : (
                    <select
                      value={profileData.preferred_class_type}
                      onChange={(e) => setProfileData({ ...profileData, preferred_class_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="1 on 1">1 on 1</option>
                      <option value="Group">Group</option>
                    </select>
                  )}
                </div>

                {/* Preferred Time Slot (Student's suggestion) */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Preferred Time Slot (Your Suggestion) *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.preferred_time_slot}
                    onChange={(e) => setProfileData({ ...profileData, preferred_time_slot: e.target.value })}
                    placeholder="e.g. 06:00 PM - 07:00 PM (PKT) / After 5 PM / Flexible"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Quick suggestions:</span>
                    {[
                      'Morning (08:00 AM - 12:00 PM)',
                      'Afternoon (12:00 PM - 05:00 PM)',
                      'Evening (05:00 PM - 09:00 PM)',
                      'Night (09:00 PM - 12:00 AM)',
                      'Flexible / Any Time',
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setProfileData((prev) => ({ ...prev, preferred_time_slot: sug }))}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          background: profileData.preferred_time_slot === sug ? 'rgba(197, 229, 232, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          color: profileData.preferred_time_slot === sug ? 'var(--color-primary)' : '#cbd5e1',
                          border: profileData.preferred_time_slot === sug ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading || initialLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                border: 'none',
                cursor: profileLoading || initialLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
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
