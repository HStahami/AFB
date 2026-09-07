import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { contactApi } from '../../api';
import { inputStyle } from '../../components/common/styles';

export function Contact() {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', message: '' });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await contactApi.submit(formData);
      setSuccess(true);
    } catch (e) {
      alert("Failed to send message. Please try again.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.75rem' }} className="gradient-text">Contact Us</h2>
        <p style={{ color: '#e0e0e0', fontSize: '1.15rem' }}>We'd love to hear from you. Reach out with any questions.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'center' }}>
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Mail size={32} color="var(--color-primary)" />
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>Email</h4>
              <p style={{ color: '#b0c4c6' }}>alarabiafi@gmail.com</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Phone size={32} color="var(--color-primary)" />
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>Phone</h4>
              <p style={{ color: '#b0c4c6' }}>+92 331 8967534 </p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <MapPin size={32} color="var(--color-primary)" />
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>Location</h4>
              <p style={{ color: '#b0c4c6' }}>AlArabia Fi Buyutikum, Pakistan</p>
            </div>
          </div>
        </div>

        <div className="glass-panel responsive-form-card" style={{ flex: '2', minWidth: '280px' }}>
          {success ? (
            <div style={{ color: '#2ecc71', fontSize: '1.2rem', textAlign: 'center', padding: '2rem' }}>
              Your message has been sent successfully! We will get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-grid-2">
                <input type="text" name="first_name" placeholder="First Name" required value={formData.first_name} onChange={handleChange} style={inputStyle} />
                <input type="text" name="last_name" placeholder="Last Name" required value={formData.last_name} onChange={handleChange} style={inputStyle} />
              </div>
              <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} style={inputStyle} />
              <textarea name="message" placeholder="Your Message" rows="5" required value={formData.message} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical' }}></textarea>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                Send Message <Send size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
