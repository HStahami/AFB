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
    course: '',
    preferred_days: 'Weekdays',
    preferred_class_type: '1 on 1',
    preferred_time_slot: 'Morning (08:00 AM - 12:00 PM)',
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
      const defaultCourse = mods.length > 0 ? (mods[0].title || mods[0].name) : 'Arabic for Beginners';
      const resolvedCourse = data?.course || data?.preferred_course || defaultCourse;
      const resolvedDays = data?.preferred_days || 'Weekdays';
      const resolvedClassType = resolvedDays === 'Weekdays' ? '1 on 1' : (data?.preferred_class_type || '1 on 1');
      const defaultSlot = slots.length > 0 ? (slots[0].title || slots[0].name || slots[0].time_window) : 'Morning (08:00 AM - 12:00 PM)';
      const resolvedSlot = data?.preferred_time_slot || defaultSlot;

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
    if (name === 'preferred_days') {
      setFormData((prev) => ({
        ...prev,
        preferred_days: value,
        preferred_class_type: value === 'Weekdays' ? '1 on 1' : prev.preferred_class_type || '1 on 1',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await studentsApi.updateProfile({
        phone: formData.phone || undefined,
        guardian_name: formData.guardian_name || undefined,
        guardian_phone: formData.guardian_phone || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        country: formData.country || undefined,
        city: formData.city || undefined,
        address: formData.address || undefined,
        education: formData.education || undefined,
        referral_source: formData.referral_source || undefined,
        course: formData.course || undefined,
        preferred_course: formData.course || undefined,
        preferred_days: formData.preferred_days || undefined,
        preferred_class_type: formData.preferred_class_type || undefined,
        preferred_time_slot: formData.preferred_time_slot || undefined,
        bio: formData.bio || undefined,
      });
      setMessage('Profile updated successfully!');
      if (refreshUser) {
        await refreshUser();
      }
      await loadProfileAndData();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#8892b0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Loading student profile...</p>
      </div>
    );
  }

  const studentCode = profile?.student_code || user?.student_code || 'PENDING';
  const fullName = formData.name || profile?.name || user?.username || 'Student';
  const email = formData.email || profile?.email || user?.email || 'N/A';
  const status = profile?.status || 'Active';

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

      {/* Alerts */}
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
          <span>✓</span> {message}
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Personal & Contact Details */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👤</span> Personal & Contact Details
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎓</span> Education & Background
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* 10. Education */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Education *
              </label>
              <select
                required
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

        {/* Section 3: Class & Course Preferences */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📚</span> Course & Class Preferences
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {/* 12. Course */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Course *
              </label>
              <select
                required
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
                {modulesList.length > 0 ? (
                  modulesList.map((mod) => (
                    <option key={mod._id || mod.id} value={mod.title || mod.name}>
                      {mod.title || mod.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Arabic for Beginners">Arabic for Beginners</option>
                    <option value="Intermediate Arabic">Intermediate Arabic</option>
                    <option value="Advanced Classical & Quranic Arabic">Advanced Classical & Quranic Arabic</option>
                    <option value="Conversational Arabic">Conversational Arabic</option>
                    <option value="Arabic Grammar & Morphology">Arabic Grammar & Morphology</option>
                  </>
                )}
              </select>
            </div>

            {/* 13. Days */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Days *
              </label>
              <select
                required
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
              </select>
            </div>

            {/* Conditional Class Type based on Days */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Class Type *
              </label>
              {formData.preferred_days === 'Weekdays' ? (
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

            {/* 14. Preferred Time Slot */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                Preferred Time Slot *
              </label>
              <select
                required
                name="preferred_time_slot"
                value={formData.preferred_time_slot}
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
                {slotsList.length > 0 ? (
                  slotsList.map((slot) => {
                    const slotLabel = slot.title || slot.name || slot.time_window || `${slot.start_time || ''} - ${slot.end_time || ''}`;
                    return (
                      <option key={slot._id || slot.id} value={slotLabel}>
                        {slotLabel}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="Morning (08:00 AM - 12:00 PM)">Morning (08:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (12:00 PM - 05:00 PM)">Afternoon (12:00 PM - 05:00 PM)</option>
                    <option value="Evening (05:00 PM - 09:00 PM)">Evening (05:00 PM - 09:00 PM)</option>
                    <option value="Night (09:00 PM - 12:00 AM)">Night (09:00 PM - 12:00 AM)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Academic Bio / Aspirations */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> Academic Bio & Arabic Goals
          </h2>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
              About You / Goals in Arabic Learning
            </label>
            <textarea
              name="bio"
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
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
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
