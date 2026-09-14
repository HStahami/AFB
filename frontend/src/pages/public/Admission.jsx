import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { admissionsApi } from '../../api';
import { inputStyle } from '../../components/common/styles';

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

export function Admission() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    course: 'Modern Standard Arabic',
    bot_field: '' // Invisible honeypot trap for bots
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorMessage('');

    // Instant client-side check for emojis
    if (EMOJI_REGEX.test(value)) {
      setErrorMessage("Emojis are not allowed in this form. Please use standard letters and numbers only.");
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict validation
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (EMOJI_REGEX.test(formData.first_name) || EMOJI_REGEX.test(formData.last_name) || EMOJI_REGEX.test(formData.phone)) {
      setErrorMessage("Invalid input: Emojis and special graphic symbols are strictly prohibited.");
      return;
    }

    if (formData.first_name.trim().length < 2 || formData.last_name.trim().length < 2) {
      setErrorMessage("First Name and Last Name must be at least 2 characters long.");
      return;
    }

    setLoading(true);
    try {
      await admissionsApi.submit({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        course: formData.course,
        bot_field: formData.bot_field // Honeypot
      });
      setSubmittedEmail(formData.email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.detail || err.message || "Failed to submit application. Please try again.";
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-panel responsive-form-card" style={{ textAlign: 'center', maxWidth: '640px', width: '100%', padding: '2.5rem 2rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '700', marginBottom: '0.6rem' }} className="gradient-text">Student Admission</h2>
        <p style={{ color: '#b0c4c6', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.5' }}>
          Begin your journey with AlArabia Fi Buyutikum. Submit your details below to receive instant fee payment instructions.
        </p>

        {errorMessage && (
          <div className="glass-panel" style={{ background: 'rgba(231, 76, 60, 0.15)', borderColor: '#e74c3c', color: '#ff6b6b', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left', fontSize: '0.9rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ padding: '1rem 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.15)', border: '2px solid #2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', color: '#2ecc71' }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ color: 'var(--color-white)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Application Submitted!</h3>
            
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left', margin: '1.5rem 0', background: 'rgba(56, 189, 248, 0.08)', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', color: '#38bdf8', fontWeight: '600' }}>
                <Mail size={18} /> Fee Payment Instructions Emailed
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', margin: 0, lineHeight: '1.5' }}>
                We have dispatched the complete bank details, IBAN, Raast ID, and payment verification instructions to <strong style={{ color: 'var(--color-white)' }}>{submittedEmail}</strong>.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.75rem', marginBottom: 0 }}>
                Please transfer your fee and share the receipt via WhatsApp or reply to the email. Once approved by Admin, your portal login ID and password will be generated automatically.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Link to="/" className="btn-primary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
                Back to Home
              </Link>
              <Link to="/student/login" className="glass-panel" style={{ padding: '10px 24px', textDecoration: 'none', color: '#e0e0e0' }}>
                Student Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1.25rem', flexDirection: 'column', textAlign: 'left' }}>
            {/* Invisible Honeypot field for bot/scraper defense */}
            <div style={{ display: 'none', visibility: 'hidden', position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <label htmlFor="bot_field">Do not fill this field</label>
              <input
                type="text"
                id="bot_field"
                name="bot_field"
                tabIndex="-1"
                autoComplete="off"
                value={formData.bot_field}
                onChange={handleChange}
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="e.g. Abdullah"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  style={inputStyle}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="e.g. Khan"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  style={inputStyle}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. student@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>WhatsApp / Phone Number *</label>
              <input
                type="tel"
                name="phone"
                placeholder="e.g. +92 300 1234567"
                required
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="tel"
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Interested Course *</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                style={{ ...inputStyle, background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer' }}
              >
                <option value="Modern Standard Arabic">Modern Standard Arabic</option>
                <option value="Arabic For Kids">Arabic For Kids</option>
                <option value="Arabic Training (MENA)">Arabic Training (MENA)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '14px',
                fontSize: '1.05rem',
                marginTop: '0.5rem',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? "Processing..." : <>Submit Application & Receive Fee Details <Send size={18} /></>}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
