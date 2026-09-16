import React, { useState, useEffect } from 'react';
import { studentsApi, modulesApi, slotsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [showUpdateRequestModal, setShowUpdateRequestModal] = useState(false);
  const [updateReason, setUpdateReason] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');
  const [requestErrorMsg, setRequestErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guardian_name: '',
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
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfileAndData();
  }, []);

  const loadProfileAndData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, modulesRes, slotsRes] = await Promise.allSettled([
        studentsApi.getProfile(),
        modulesApi.getAll(),
        slotsApi.getAll(),
      ]);

      const data = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const mods = modulesRes.status === 'fulfilled' && Array.isArray(modulesRes.value) ? modulesRes.value : [];
      const slots = slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value) ? slotsRes.value : [];

      setProfile(data);
      setModulesList(mods);
      setSlotsList(slots);

      const resolvedName =
        data?.name ||
        (data?.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : '') ||
        user?.username ||
        '';

      const resolvedEmail = data?.email || user?.email || '';
      const resolvedPhone = data?.phone || '';

      const rawCourse = data?.course || data?.preferred_course || 'Modern Standard Arabic';
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
      const resolvedModule = data?.selected_module || data?.module || defaultModule;
      const resolvedDays = data?.preferred_days || 'Weekdays';
      const resolvedClassType = resolvedCourse === 'Arabic Training (MENA)'
        ? 'Team Training'
        : (resolvedDays === 'Weekdays' ? '1 on 1' : (data?.preferred_class_type || '1 on 1'));
      const resolvedSlot = data?.preferred_time_slot || data?.slot || '';

      setFormData({
        name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        guardian_name: data?.guardian_name || data?.father_name || '',
        guardian_phone: data?.guardian_phone || data?.father_phone || '',
        date_of_birth: data?.date_of_birth ? data.date_of_birth.substring(0, 10) : '',
        country: data?.country || '',
        city: data?.city || '',
        address: data?.address || '',
        education: data?.education || 'Undergraduate',
        referral_source: data?.referral_source || 'Social Media',
        course: resolvedCourse,
        selected_module: resolvedModule,
        preferred_days: resolvedDays,
        preferred_class_type: resolvedClassType,
        preferred_time_slot: resolvedSlot,
        bio: data?.bio || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Unable to load student profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'course') {
      let defaultModule = '';
      let defaultClassType = '1 on 1';
      if (value === 'Modern Standard Arabic') {
        defaultModule = 'All 4 Modules Included';
        defaultClassType = formData.preferred_days === 'Weekdays' ? '1 on 1' : (formData.preferred_class_type === 'Team Training' ? '1 on 1' : formData.preferred_class_type || '1 on 1');
      } else if (value === 'Arabic Training (MENA)') {
        defaultModule = 'Team Training';
        defaultClassType = 'Team Training';
      } else if (value === 'Arabic For Kids') {
        defaultModule = '';
        defaultClassType = formData.preferred_days === 'Weekdays' ? '1 on 1' : (formData.preferred_class_type === 'Team Training' ? '1 on 1' : formData.preferred_class_type || '1 on 1');
      }
      setFormData((prev) => ({
        ...prev,
        course: value,
        selected_module: defaultModule,
        preferred_class_type: defaultClassType,
      }));
    } else if (name === 'preferred_days') {
      setFormData((prev) => ({
        ...prev,
        preferred_days: value,
        preferred_class_type: prev.course === 'Arabic Training (MENA)'
          ? 'Team Training'
          : (value === 'Weekdays' ? '1 on 1' : (prev.preferred_class_type === 'Team Training' ? '1 on 1' : prev.preferred_class_type || '1 on 1')),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    // 1. Mandatory Fields Validation
    const requiredCheck = [
      { val: formData.guardian_name, label: 'Father / Guardian Name' },
      { val: formData.guardian_phone, label: 'Father / Guardian Phone Number' },
      { val: formData.date_of_birth, label: 'Date of Birth' },
      { val: formData.country, label: 'Country' },
      { val: formData.city, label: 'City' },
      { val: formData.address, label: 'Address' },
      { val: formData.education, label: 'Education Level' },
      { val: formData.referral_source, label: 'How did you hear about us' },
      { val: formData.course, label: 'Course' },
      { val: formData.preferred_days, label: 'Class Days' },
      { val: formData.preferred_class_type, label: 'Class Type' },
      { val: formData.preferred_time_slot, label: 'Suggested Time Slot' },
    ];

    for (const item of requiredCheck) {
      if (!item.val || !String(item.val).trim()) {
        setError(`Please fill in '${item.label}'. All fields are required.`);
        setSaving(false);
        return;
      }
      if (EMOJI_REGEX.test(String(item.val))) {
        setError(`Invalid characters in '${item.label}': Emojis and special graphic symbols are not allowed.`);
        setSaving(false);
        return;
      }
    }

    try {
      await studentsApi.updateProfile({
        phone: formData.phone?.trim() || undefined,
        guardian_name: formData.guardian_name?.trim() || undefined,
        guardian_phone: formData.guardian_phone?.trim() || undefined,
        date_of_birth: formData.date_of_birth?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        education: formData.education?.trim() || undefined,
        referral_source: formData.referral_source?.trim() || undefined,
        course: formData.course || undefined,
        preferred_course: formData.course || undefined,
        module: formData.selected_module || undefined,
        selected_module: formData.selected_module || undefined,
        preferred_module: formData.selected_module || undefined,
        preferred_days: formData.preferred_days || undefined,
        preferred_class_type: formData.preferred_class_type || undefined,
        preferred_time_slot: formData.preferred_time_slot?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,
      });
      setMessage('Profile updated successfully!');
      if (refreshUser) {
        await refreshUser();
      }
      await loadProfileAndData();
    } catch (err) {
      console.error('Failed to update profile:', err);
      const serverMsg = err.response?.data?.detail || err.message || 'Failed to update profile. Please try again.';
      setError(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateReason || !updateReason.trim()) {
      setRequestErrorMsg('Please describe what information you would like to update.');
      return;
    }
    try {
      setSendingRequest(true);
      setRequestErrorMsg('');
      await studentsApi.requestUpdate(updateReason.trim());
      setRequestSuccessMsg('Your profile update request has been sent to the administration!');
      setShowUpdateRequestModal(false);
      setUpdateReason('');
      await loadProfileAndData();
    } catch (err) {
      console.error('Failed to submit update request:', err);
      setRequestErrorMsg(err.response?.data?.detail || err.message || 'Failed to submit request.');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#8892b0' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Loading student profile...</p>
      </div>
    );
  }

  const studentCode = profile?.student_code || user?.student_code || 'PENDING';
  const fullName = formData.name || profile?.name || user?.username || 'Student';
  const email = formData.email || profile?.email || user?.email || 'N/A';
  const status = profile?.status || 'Active';
  const isCompleted = Boolean(profile?.profile_completed || user?.profile_completed || profile?.onboarding_status === 'completed');
  const hasRequestedUpdate = Boolean(profile?.update_requested);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          borderRadius: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.5rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            flexShrink: 0,
          }}
        >
          {fullName.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              {fullName}
            </h1>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ID: {studentCode}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: status.toLowerCase() === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: status.toLowerCase() === 'active' ? '#4ade80' : '#facc15',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
              }}
            >
              {status}
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            {email}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Account Role</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
            {user?.role || 'Student'}
          </span>
          {profile?.created_at && (
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Joined: {new Date(profile.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Profile Locked Banner */}
      {isCompleted && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#34d399', fontSize: '1.05rem' }}>
              Profile Details Locked & Verified
            </div>
            {hasRequestedUpdate ? (
              <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(243, 156, 18, 0.2)', color: '#f39c12', border: '1px solid rgba(243, 156, 18, 0.4)', fontWeight: 600 }}>
                Update Request Pending Review
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowUpdateRequestModal(true)}
                className="btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
              >
                Request Profile Update
              </button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            Your profile details are saved and locked to prevent unauthorized changes. If you need to make updates, click "Request Profile Update" to send a note to administration.
          </p>
          {hasRequestedUpdate && profile?.update_request_note && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#facc15', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
              <strong>Your Pending Request Note:</strong> "{profile.update_request_note}"
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {requestSuccessMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.95rem',
          }}
        >
          {requestSuccessMsg}
        </div>
      )}

      {message && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Personal & Contact Details */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9' }}>
            Personal & Contact Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* 1. Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#64748b',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Official registration name.</span>
            </div>

            {/* 2. Father/Guardian Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Father / Guardian Name *
              </label>
              <input
                type="text"
                required
                disabled={isCompleted}
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
                placeholder="Enter Father or Guardian Name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 3. Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#64748b',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Account login email identifier.</span>
            </div>

            {/* 4. Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Phone Number *
              </label>
              <input
                type="tel"
                required
                disabled={isCompleted}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +92 300 1234567"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 5. Father/Guardian Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Father / Guardian Number *
              </label>
              <input
                type="tel"
                required
                disabled={isCompleted}
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleChange}
                placeholder="e.g. +92 300 7654321"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 6. Date of Birth */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Date of Birth *
              </label>
              <input
                type="date"
                required
                disabled={isCompleted}
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 7. Country */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Country *
              </label>
              <input
                type="text"
                required
                disabled={isCompleted}
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. Pakistan, Saudi Arabia, UAE, UK"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 8. City */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                City *
              </label>
              <input
                type="text"
                required
                disabled={isCompleted}
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Lahore, Riyadh, Dubai, London"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 9. Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Address *
              </label>
              <input
                type="text"
                required
                disabled={isCompleted}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Residential address / street area"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Education & Background */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9' }}>
            Education & Background
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* 10. Education */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Education *
              </label>
              <select
                required
                disabled={isCompleted}
                name="education"
                value={formData.education}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  outline: 'none',
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                How did you hear about us? *
              </label>
              <select
                required
                disabled={isCompleted}
                name="referral_source"
                value={formData.referral_source}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  outline: 'none',
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
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9' }}>
            Course & Class Preferences
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {/* Course */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Course *
              </label>
              <select
                required
                disabled={isCompleted}
                name="course"
                value={formData.course}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Modern Standard Arabic">Modern Standard Arabic</option>
                <option value="Arabic For Kids">Arabic For Kids</option>
                <option value="Arabic Training (MENA)">Arabic Training (MENA)</option>
              </select>
            </div>

            {/* Dynamic Modules Options based on Course */}
            {formData.course === 'Modern Standard Arabic' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Modules (Options) *
                </label>
                <select
                  required
                  disabled={isCompleted}
                  name="selected_module"
                  value={formData.selected_module || 'All 4 Modules Included'}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                    outline: 'none',
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

            {formData.course === 'Arabic Training (MENA)' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Module / Training Track *
                </label>
                <select
                  name="selected_module"
                  value="Team Training"
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Days *
              </label>
              <select
                required
                disabled={isCompleted}
                name="preferred_days"
                value={formData.preferred_days}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Weekdays">Weekdays</option>
                <option value="Weekend">Weekend</option>
                {formData.course === 'Arabic Training (MENA)' && (
                  <option value="Custom Schedule">Custom Schedule (Team / Corporate)</option>
                )}
              </select>
            </div>

            {/* Class Type: for Modern Standard Arabic & Arabic For Kids */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Class Type *
              </label>
              {formData.course === 'Arabic Training (MENA)' ? (
                <select
                  value="Team Training"
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Team Training">Team Training</option>
                </select>
              ) : formData.preferred_days === 'Weekdays' ? (
                <select
                  value="1 on 1"
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="1 on 1">1 on 1</option>
                </select>
              ) : (
                <select
                  name="preferred_class_type"
                  disabled={isCompleted}
                  value={formData.preferred_class_type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                    outline: 'none',
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Preferred Time Slot (Your Suggestion) *
              </label>
              <input
                type="text"
                required
                disabled={isCompleted}
                name="preferred_time_slot"
                value={formData.preferred_time_slot}
                onChange={handleChange}
                placeholder="e.g. 06:00 PM - 07:00 PM (PKT) / After 5 PM / Flexible"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  outline: 'none',
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
                    onClick={() => setFormData((prev) => ({ ...prev, preferred_time_slot: sug }))}
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      background: formData.preferred_time_slot === sug ? 'rgba(197, 229, 232, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: formData.preferred_time_slot === sug ? 'var(--color-primary)' : '#cbd5e1',
                      border: formData.preferred_time_slot === sug ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
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

        {/* Academic Bio / Aspirations */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9' }}>
            Academic Bio & Arabic Goals
          </h2>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
              About You / Goals in Arabic Learning
            </label>
            <textarea
              name="bio"
              disabled={isCompleted}
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about your learning journey, previous Arabic experience, or specific learning aspirations..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.4)',
                color: '#f8fafc',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          {isCompleted ? (
            hasRequestedUpdate ? (
              <div style={{ fontSize: '0.9rem', color: '#f39c12', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: '8px', background: 'rgba(243, 156, 18, 0.15)', border: '1px solid rgba(243, 156, 18, 0.3)' }}>
                Update Request Sent to Administration (Pending Review)
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUpdateRequestModal(true)}
                className="btn-primary"
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                }}
              >
                Request Profile Update
              </button>
            )
          ) : (
            <>
              <button
                type="button"
                onClick={loadProfileAndData}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Request Profile Update Modal */}
      {showUpdateRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 14, 15, 0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ padding: '2rem', maxWidth: '500px', width: '100%', borderRadius: '16px', backgroundColor: '#092528', border: '1px solid rgba(197, 229, 232, 0.25)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}>
            <h3 style={{ color: 'var(--color-white)', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Request Profile Update</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Describe the specific information or details you need updated (e.g. phone number, address, preferred class slot). Administration will review your note and contact you.
            </p>

            {requestErrorMsg && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {requestErrorMsg}
              </div>
            )}

            <form onSubmit={handleRequestUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  Requested Changes / Reason *
                </label>
                <textarea
                  required
                  rows={4}
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="e.g. Please update my contact number to +92 331 1234567 and change my preferred time slot to Evening..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={sendingRequest} className="btn-primary" style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', cursor: sendingRequest ? 'not-allowed' : 'pointer' }}>
                  {sendingRequest ? 'Sending Request...' : 'Send Request'}
                </button>
                <button type="button" onClick={() => setShowUpdateRequestModal(false)} className="glass-panel" style={{ flex: 1, padding: '10px', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
