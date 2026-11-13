import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  CheckCircle2,
  Search,
  Sparkles,
  Layers,
  Briefcase,
  BookOpen,
  Building2,
  ShieldCheck,
  Award,
  X,
  Check
} from 'lucide-react';
import { modulesApi, instructorsApi, contactApi } from '../../api';
import { getAvatarUrl } from '../../api/client';

export function Home() {
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [modulesError, setModulesError] = useState(null);

  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [instructorsError, setInstructorsError] = useState(null);

  // Smart Search & Ecosystem State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [activePillar, setActivePillar] = useState('lms');

  // Enterprise ERP Demo Modal State
  const [erpModalOpen, setErpModalOpen] = useState(false);
  const [erpForm, setErpForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    requirements: ''
  });
  const [erpSubmitting, setErpSubmitting] = useState(false);
  const [erpSubmitted, setErpSubmitted] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      setModulesError(null);
      try {
        const data = await modulesApi.getAll();
        setModules(data);
      } catch (err) {
        console.error(err);
        setModulesError("Unable to load modules. Please try again later.");
      } finally {
        setLoadingModules(false);
      }
    };

    const fetchInstructors = async () => {
      setLoadingInstructors(true);
      setInstructorsError(null);
      try {
        const data = await instructorsApi.getAll();
        setInstructors(data);
      } catch (err) {
        console.error(err);
        setInstructorsError("Unable to load instructors right now.");
      } finally {
        setLoadingInstructors(false);
      }
    };

    void fetchModules();
    void fetchInstructors();
  }, []);

  const searchCategories = [
    { id: 'all', label: 'All Ecosystem' },
    { id: 'languages', label: 'Language Tracks' },
    { id: 'trainers', label: '1-on-1 Trainers' },
    { id: 'software', label: 'Software & Tools' },
    { id: 'erp', label: 'Enterprise ERP' },
  ];

  const getSearchPlaceholder = (cat) => {
    switch (cat) {
      case 'languages': return 'Search Arabic levels, syntax courses, Quranic tracks...';
      case 'trainers': return 'Find certified instructors, language coaches, specialists...';
      case 'software': return 'Explore Touch-Typing Lab, Smart Notebook, digital certificates...';
      case 'erp': return 'Inquire about student records, automated fees, institutional LMS...';
      default: return 'Search courses, certified trainers, software tools, or ERP solutions...';
    }
  };

  const handleErpSubmit = async (e) => {
    e.preventDefault();
    if (!erpForm.name || !erpForm.email) {
      alert('Please provide your name and email address.');
      return;
    }
    setErpSubmitting(true);
    try {
      await contactApi.submit({
        first_name: erpForm.name.split(' ')[0] || erpForm.name,
        last_name: erpForm.name.split(' ').slice(1).join(' ') || (erpForm.organization ? `(${erpForm.organization})` : 'Client'),
        email: erpForm.email,
        phone: erpForm.phone || '+44 0000 000000',
        subject: `Enterprise ERP & Software Demo Request — ${erpForm.organization || 'Corporate Client'}`,
        message: `Organization: ${erpForm.organization || 'N/A'}\nContact Phone: ${erpForm.phone || 'N/A'}\nRequirements & Inquiry:\n${erpForm.requirements || 'Requested an enterprise ERP & software walkthrough.'}`
      });
      setErpSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to send demo request. Please try again or reach out directly via contact page.');
    } finally {
      setErpSubmitting(false);
    }
  };

  const ecosystemPillars = [
    {
      id: 'lms',
      icon: BookOpen,
      title: 'Language & Technical LMS',
      tagline: 'Interactive Learning Loops & Automated Progression',
      desc: 'Next-generation learning management built with bite-sized adaptive lessons, progressive touch-typing lab, and real-time skill assessments.',
      highlights: [
        'Structured A1 to B2 progressive curriculum',
        '200-level Touch-Typing Lab with real-time WPM tracking',
        'Smart interactive digital whiteboard & auto-saved notes',
        'Instant cryptographically verified digital certificates'
      ],
      ctaText: 'Explore Learning Modules',
      ctaLink: '#courses'
    },
    {
      id: 'trainers',
      icon: Users,
      title: 'Trainer & Consultant Network',
      tagline: 'Preply-Style 1-on-1 Mentorship & Corporate Advisory',
      desc: 'Direct access to certified linguistic scholars and professional software instructors for personalized 1-on-1 private tuition and corporate workshops.',
      highlights: [
        'Dedicated 1-on-1 private instructor attention',
        'Flexible weekday and weekend scheduling slots',
        'Tailored conversation practice & executive coaching',
        'Verified academic bios and proven student outcomes'
      ],
      ctaText: 'Meet Certified Faculty',
      ctaLink: '#instructors'
    },
    {
      id: 'erp',
      icon: Layers,
      title: 'Proprietary Enterprise ERP',
      tagline: 'Modular Institutional Management & Automation',
      desc: 'Comprehensive operational software backbone powering schools, academies, and training centers with automated admissions, fee reconciliation, and attendance.',
      highlights: [
        'Automated applicant pipeline & sequential student codes',
        'Real-time fee verification & receipt auditing',
        'Role-Based RBAC portals (Admin, Instructor, Student)',
        'Attendance tracking, reporting, and gradebook engine'
      ],
      ctaText: 'Request ERP Demo',
      action: () => setErpModalOpen(true)
    },
    {
      id: 'b2b',
      icon: Briefcase,
      title: 'Corporate Workforce Upskilling',
      tagline: 'B2B Multi-Seat Licensing & Team Transformation',
      desc: 'Enterprise solutions enabling organizations to upskill entire teams with custom technical tracks, corporate seat management, and executive performance analytics.',
      highlights: [
        'Multi-seat volume licensing for organizations',
        'Executive workforce analytics & skill matrices',
        'Tailored industry-specific vocabulary & tool tracks',
        'Dedicated corporate account manager & priority support'
      ],
      ctaText: 'Inquire for Enterprise',
      action: () => setErpModalOpen(true)
    }
  ];

  const reviews = [
    { id: 1, student: 'Yusuf K.', text: 'The methodology is incredible. I learned more in 3 months than I did in 2 years.', rating: 5 },
    { id: 2, student: 'Sarah M.', text: 'A truly futuristic platform. The instructors are top-notch and the UI is beautiful.', rating: 5 },
    { id: 3, student: 'Omar R.', text: 'Convenient and highly effective. Highly recommended for anyone serious about Arabic.', rating: 4 },
  ];

  const [startIndex, setStartIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsToShow(1);
      else if (window.innerWidth < 1024) setItemsToShow(2);
      else setItemsToShow(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction) => {
    if (direction === 'left') {
      setStartIndex(Math.max(0, startIndex - 1));
    } else {
      setStartIndex(Math.min(Math.max(0, instructors.length - itemsToShow), startIndex + 1));
    }
  };

  const visibleInstructors = instructors.slice(startIndex, startIndex + itemsToShow);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: 'easeOut' } 
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* ======================================================== */}
      {/* 1. ENTERPRISE HERO SECTION                               */}
      {/* ======================================================== */}
      <section style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3.5rem 1.5rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient Radial Glows (Burgundy & Gold) */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 20, 0],
            y: [0, -15, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '5%', left: '8%', width: '380px', height: '380px', background: 'var(--color-glow)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 }}
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -25, 0],
            y: [0, 25, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '5%', right: '8%', width: '450px', height: '450px', background: 'rgba(105, 14, 31, 0.45)', borderRadius: '50%', filter: 'blur(140px)', zIndex: 0 }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '980px', width: '100%', margin: '0 auto' }}>
          {/* Top Authority Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '8px 20px', borderRadius: '30px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.28)', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '1.6rem' }}
          >
            <Sparkles size={16} color="var(--color-primary)" />
            <span>Emam Ecosystem • UK Accredited Learning & Enterprise Software</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ fontSize: 'clamp(2.3rem, 4.6vw + 0.8rem, 4.2rem)', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.4rem', color: 'var(--color-white)', letterSpacing: '-0.5px' }}
          >
            Master Global Languages, Software & Workforce Skills.
            <br />
            <span className="gradient-text glow-text">All in One Unified Platform</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            style={{ fontSize: 'clamp(1.05rem, 1.8vw + 0.4rem, 1.25rem)', color: '#f0ceb3', maxWidth: '820px', margin: '0 auto 2.2rem auto', lineHeight: '1.65' }}
          >
            Accredited language mastery, technical software certification tracks, 1-on-1 certified trainer bookings, and in-house modular ERP/LMS solutions built for ambitious learners and enterprise organizations.
          </motion.p>

          {/* Smart Unified Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="glass-panel"
            style={{ maxWidth: '780px', margin: '0 auto 2.4rem auto', padding: '0.85rem 1rem', borderRadius: '22px', border: '1px solid rgba(241, 163, 42, 0.28)', boxShadow: '0 12px 36px rgba(0,0,0,0.45)', textAlign: 'left' }}
          >
            {/* Search Category Tabs */}
            <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              {searchCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSearchCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    background: searchCategory === cat.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                    color: searchCategory === cat.id ? '#2c050d' : '#f0ceb3',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input & Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder(searchCategory)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.98rem',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  padding: '4px 0'
                }}
              />
              <Link
                to={searchCategory === 'erp' ? '#enterprise-erp' : '/admission'}
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.92rem',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                Search <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Dual Action CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}
          >
            <Link
              to="/admission"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '16px 36px', fontSize: '1.05rem', textDecoration: 'none' }}
            >
              Explore Courses & Programs <ArrowRight size={18} />
            </Link>

            <button
              onClick={() => {
                setErpSubmitted(false);
                setErpModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '16px 32px',
                fontSize: '1.05rem',
                borderRadius: '30px',
                background: 'rgba(105, 14, 31, 0.45)',
                border: '1px solid rgba(241, 163, 42, 0.35)',
                color: 'var(--color-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'var(--font-sans)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(241, 163, 42, 0.15)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(105, 14, 31, 0.45)';
                e.currentTarget.style.borderColor = 'rgba(241, 163, 42, 0.35)';
              }}
            >
              <Building2 size={18} /> Request ERP Demo
            </button>
          </motion.div>

          {/* Metrics Trust Bar (4 Key Proof Points) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', width: '100%' }}
          >
            <div className="glass-panel" style={{ padding: '1.25rem 1rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>200+</div>
              <div style={{ fontSize: '0.88rem', color: '#f0ceb3', fontWeight: '500' }}>Progressive Interactive Levels</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>1-on-1</div>
              <div style={{ fontSize: '0.88rem', color: '#f0ceb3', fontWeight: '500' }}>Certified Private Mentors</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>100%</div>
              <div style={{ fontSize: '0.88rem', color: '#f0ceb3', fontWeight: '500' }}>Verifiable Digital Certificates</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>Enterprise</div>
              <div style={{ fontSize: '0.88rem', color: '#f0ceb3', fontWeight: '500' }}>In-House Modular ERP & LMS</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. EMAM ECOSYSTEM 360 (Salesforce-Inspired Interactive)  */}
      {/* ======================================================== */}
      <section id="ecosystem" style={{ padding: '5.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.25)', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <Layers size={14} color="var(--color-primary)" />
            <span>Unified Platform Ecosystem</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            The Emam 360° Ecosystem
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '720px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Connecting learners, professional trainers, enterprise clients, and institutional management within a unified, high-trust technological architecture.
          </p>
        </motion.div>

        {/* 4 Pillars Interactive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {ecosystemPillars.map((pillar) => {
            const IconComponent = pillar.icon;
            const isSelected = activePillar === pillar.id;
            return (
              <motion.div
                key={pillar.id}
                whileHover={{ y: -6 }}
                onClick={() => setActivePillar(pillar.id)}
                className="glass-panel"
                style={{
                  padding: '2rem 1.5rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(241, 163, 42, 0.18)',
                  background: isSelected ? 'rgba(105, 14, 31, 0.45)' : 'rgba(105, 14, 31, 0.18)',
                  boxShadow: isSelected ? '0 12px 30px rgba(241, 163, 42, 0.2)' : 'none',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: isSelected ? 'var(--color-primary)' : 'rgba(241, 163, 42, 0.12)', border: '1px solid rgba(241, 163, 42, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#2c050d' : 'var(--color-primary)', marginBottom: '1.25rem', transition: 'all 0.3s ease' }}>
                    <IconComponent size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '0.4rem' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.85rem' }}>
                    {pillar.tagline}
                  </p>
                  <p style={{ color: '#e0d0c8', fontSize: '0.9rem', lineHeight: '1.55', marginBottom: '1.2rem' }}>
                    {pillar.desc}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(241, 163, 42, 0.15)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isSelected ? 'var(--color-primary)' : '#f0ceb3', fontSize: '0.85rem', fontWeight: '600' }}>
                  <span>{isSelected ? 'Currently Viewing' : 'Click to Inspect'}</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Pillar Detailed Showcase Box */}
        {(() => {
          const selected = ecosystemPillars.find((p) => p.id === activePillar) || ecosystemPillars[0];
          const SelectedIcon = selected.icon;
          return (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="glass-panel"
              style={{
                padding: '2.5rem',
                borderRadius: '24px',
                border: '1px solid rgba(241, 163, 42, 0.3)',
                background: 'linear-gradient(135deg, rgba(105, 14, 31, 0.55), rgba(44, 5, 13, 0.85))'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: '1', minWidth: '280px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    <SelectedIcon size={18} />
                    <span>Deep Architecture Spotlight</span>
                  </div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-white)', marginBottom: '0.5rem' }}>
                    {selected.title}
                  </h3>
                  <p style={{ color: '#f0ceb3', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    {selected.desc}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {selected.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#fdfdfd', fontSize: '0.92rem' }}>
                        <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {selected.ctaLink ? (
                    <a
                      href={selected.ctaLink}
                      className="btn-primary"
                      style={{ padding: '14px 28px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                    >
                      {selected.ctaText} <ArrowRight size={16} />
                    </a>
                  ) : (
                    <button
                      onClick={selected.action}
                      className="btn-primary"
                      style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                    >
                      {selected.ctaText} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </section>

      {/* ======================================================== */}
      {/* ERP DEMO REQUEST MODAL                                   */}
      {/* ======================================================== */}
      <AnimatePresence>
        {erpModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '560px',
                borderRadius: '24px',
                border: '1px solid rgba(241, 163, 42, 0.35)',
                background: 'linear-gradient(135deg, rgba(105, 14, 31, 0.96), rgba(44, 5, 13, 0.98))',
                padding: '2.5rem',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setErpModalOpen(false)}
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              {erpSubmitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <Check size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: '700', marginBottom: '0.75rem' }}>Demo Request Received</h3>
                  <p style={{ color: '#f0ceb3', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Thank you! Our enterprise solutions team has received your request and will reach out with a custom walkthrough and ERP proposal shortly.
                  </p>
                  <button
                    onClick={() => setErpModalOpen(false)}
                    className="btn-primary"
                    style={{ padding: '12px 32px' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleErpSubmit}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <Building2 size={16} />
                    <span>Enterprise Software & ERP Solutions</span>
                  </div>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--color-white)', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Request Live ERP Walkthrough
                  </h3>
                  <p style={{ color: '#f0ceb3', fontSize: '0.9rem', marginBottom: '1.8rem', lineHeight: '1.5' }}>
                    Discover how Emam's modular institutional ERP, admissions engine, and LMS can streamline your organization.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={erpForm.name}
                        onChange={(e) => setErpForm({ ...erpForm, name: e.target.value })}
                        placeholder="e.g. Dr. Haris Mahmood"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Organization / Institution Name</label>
                      <input
                        type="text"
                        value={erpForm.organization}
                        onChange={(e) => setErpForm({ ...erpForm, organization: e.target.value })}
                        placeholder="e.g. Cambridge Academy / Oxford Global"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Work Email *</label>
                        <input
                          type="email"
                          required
                          value={erpForm.email}
                          onChange={(e) => setErpForm({ ...erpForm, email: e.target.value })}
                          placeholder="name@institution.com"
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>WhatsApp / Phone</label>
                        <input
                          type="text"
                          value={erpForm.phone}
                          onChange={(e) => setErpForm({ ...erpForm, phone: e.target.value })}
                          placeholder="+44 20 7946 0991"
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Estimated Students / Requirements</label>
                      <textarea
                        rows={3}
                        value={erpForm.requirements}
                        onChange={(e) => setErpForm({ ...erpForm, requirements: e.target.value })}
                        placeholder="Tell us about your team size, expected student volume, or custom module requirements..."
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={erpSubmitting}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: erpSubmitting ? 0.7 : 1 }}
                  >
                    {erpSubmitting ? 'Submitting Request...' : 'Submit Demo Request'} <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Class Types Section */}
      <section style={{ padding: '5rem 2rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Class Types</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
            Choose the flexible learning format that fits your daily routine and learning pace.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Card 1: Monday to Friday 1 on 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
            className="glass-panel"
            style={{
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(197, 229, 232, 0.2)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(197, 229, 232, 0.12)', border: '1px solid rgba(197, 229, 232, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <User size={28} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', background: 'rgba(197, 229, 232, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(197, 229, 232, 0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Weekday Format
                </span>
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '0.4rem' }}>
                Monday to Friday
              </h3>
              <p style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '1.2rem' }}>
                1 on 1 Classes Only
              </p>
              <p style={{ color: '#b0c4c6', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.8rem' }}>
                Dedicated private tutoring designed for focused, individual attention and personalized Arabic learning pace.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>100% exclusive 1-on-1 instructor focus</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Customized schedule from Monday to Friday</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Personalized curriculum & speaking practice</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Weekend Group + 1 on 1 (With Brand Color) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
            className="glass-panel"
            style={{
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(197, 229, 232, 0.2)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(197, 229, 232, 0.12)', border: '1px solid rgba(197, 229, 232, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <Users size={28} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', background: 'rgba(197, 229, 232, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(197, 229, 232, 0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Weekend Format
                </span>
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '0.4rem' }}>
                On Weekend
              </h3>
              <p style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '1.2rem' }}>
                Group + 1 on 1 Classes
              </p>
              <p style={{ color: '#b0c4c6', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.8rem' }}>
                Collaborative group sessions with peers alongside flexible 1-on-1 slots, perfect for working professionals and weekend learners.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Interactive small group learning & discussions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Flexible 1-on-1 weekend session options</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Ideal for students & professionals on Saturdays & Sundays</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Arabic Learning Modules Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Arabic Learning Modules</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Explore our structured levels designed to take you from foundational Arabic to complete fluency.</p>
        </motion.div>

        {loadingModules ? (
          <p style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>Loading modules...</p>
        ) : modulesError ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>{modulesError}</p>
        ) : modules.length === 0 ? (
          <p style={{ color: '#e0e0e0', textAlign: 'center', fontSize: '1.1rem', padding: '3rem' }}>No modules available at the moment.</p>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={containerVariants}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}
          >
            {modules.map((mod) => {
              const modTitle = mod.name || mod.title || 'Module';
              return (
                <motion.div
                  key={mod._id || mod.id || modTitle}
                  variants={itemVariants}
                  whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                  className="glass-panel"
                  style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(197, 229, 232, 0.15)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  {mod.image ? (
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.2rem', border: '1px solid var(--color-primary)' }}>
                      <img src={getAvatarUrl(mod.image, modTitle)} alt={modTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', color: 'var(--color-bg-dark)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                      {modTitle}
                    </div>
                  )}
                  <p style={{ color: '#b0c4c6', fontSize: '0.95rem', lineHeight: '1.5' }}>{mod.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* Dynamic Instructors Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Our Expert Instructors</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Learn from the best. Our team is constantly growing to bring you diverse expertise.</p>
        </motion.div>

        {loadingInstructors ? (
          <p style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>Loading instructors...</p>
        ) : instructorsError ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>{instructorsError}</p>
        ) : instructors.length === 0 ? (
          <p style={{ color: '#e0e0e0', textAlign: 'center', fontSize: '1.1rem', padding: '3rem' }}>No instructors available at the moment.</p>
        ) : (
          <div style={{ position: 'relative', padding: '0 3rem' }}>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('left')}
              disabled={startIndex === 0}
              className="glass-panel"
              style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex === 0 ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex === 0 ? 0.3 : 1 }}
            >
              <ChevronLeft color="var(--color-primary)" />
            </motion.button>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${itemsToShow}, 1fr)`, gap: '2rem', paddingBottom: '2rem' }}>
              <AnimatePresence mode="popLayout">
                {visibleInstructors.map((instructor) => (
                  <motion.div
                    key={instructor._id || instructor.id || instructor.name}
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -50 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                    whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                    className="glass-panel"
                    style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(197, 229, 232, 0.15)', background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ display: 'inline-block', padding: '4px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', marginBottom: '1rem' }}>
                      <img
                        src={getAvatarUrl(instructor.avatar, instructor.name)}
                        alt={instructor.name}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'block', background: 'var(--color-bg-dark)', objectFit: 'cover' }}
                      />
                    </div>

                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--color-white)', fontWeight: '600' }}>{instructor.name}</h3>
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.95rem', marginBottom: instructor.about ? '0.5rem' : '0' }}>
                      {instructor.specialty || 'Arabic Instructor'}
                    </p>
                    {instructor.about && (
                      <p style={{ color: '#b0c4c6', fontSize: '0.85rem', lineHeight: '1.4' }}>{instructor.about}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('right')}
              disabled={startIndex >= Math.max(0, instructors.length - itemsToShow)}
              className="glass-panel"
              style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex >= Math.max(0, instructors.length - itemsToShow) ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex >= Math.max(0, instructors.length - itemsToShow) ? 0.3 : 1 }}
            >
              <ChevronRight color="var(--color-primary)" />
            </motion.button>
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Student Reviews</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Don't just take our word for it. Here is what our students have to say.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={containerVariants}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}
        >
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="glass-panel"
              style={{ padding: '2rem', border: '1px solid rgba(197, 229, 232, 0.15)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="var(--color-primary)" color="var(--color-primary)" />)}
              </div>
              <p style={{ color: '#e0e0e0', fontStyle: 'italic', flexGrow: 1 }}>"{review.text}"</p>
              <h4 style={{ color: 'var(--color-white)', fontWeight: '600' }}>- {review.student}</h4>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </motion.div>
  );
}

