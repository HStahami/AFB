import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Globe2 } from 'lucide-react';

export function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '2.5rem 1.5rem 4rem', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1.5rem' }} className="gradient-text">About Us</h2>
      <p style={{ fontSize: '1.15rem', color: '#e0e0e0', marginBottom: '1.5rem', lineHeight: '1.8' }}>
        AlArabia Fi Buyutikum (Arabic in Your Homes) was founded with a singular vision: to make the majestic Arabic language accessible to everyone, everywhere. We believe that learning Arabic shouldn't be confined to traditional classrooms or limited by geographical boundaries.
      </p>
      <p style={{ fontSize: '1.15rem', color: '#e0e0e0', marginBottom: '3rem', lineHeight: '1.8' }}>
        Leveraging cutting-edge technology and a layered, comprehensive curriculum, we bring expert native instructors directly to your screen. Our platform is designed to be highly engaging, intuitive, and effective, ensuring that your journey to mastering Arabic is as beautiful as the language itself.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <BookOpen size={32} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-white)' }}>Our Mission</h3>
          <p style={{ color: '#b0c4c6' }}>To empower global learners with the linguistic tools and cultural context needed to truly understand and appreciate Arabic.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <Globe2 size={32} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-white)' }}>Our Vision</h3>
          <p style={{ color: '#b0c4c6' }}>To become the world's leading digital institute for Arabic studies, pioneering the future of online language education.</p>
        </div>
      </div>
    </motion.div>
  );
}
