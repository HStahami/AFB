import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { admissionsApi } from '../../api';
import { inputStyle } from '../../components/common/styles';

export function Admission() {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await admissionsApi.submit(formData);
      setSuccess(true);
    } catch (e) {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div className="glass-panel responsive-form-card" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Admission Form</h2>
        <p style={{ color: '#b0c4c6', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Take the first step towards mastering Arabic. Fill out the form below to apply for our courses.
        </p>
        {success ? (
          <div style={{ color: '#2ecc71', fontSize: '1.2rem', padding: '2rem' }}>
            Application submitted successfully! Our team will contact you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1.25rem', flexDirection: 'column' }}>
            <div className="form-grid-2">
              <input type="text" name="first_name" placeholder="First Name" required value={formData.first_name} onChange={handleChange} style={inputStyle} />
              <input type="text" name="last_name" placeholder="Last Name" required value={formData.last_name} onChange={handleChange} style={inputStyle} />
            </div>
            <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} style={inputStyle} />
            <input type="tel" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleChange} style={inputStyle} />
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '16px', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Submit Application <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
