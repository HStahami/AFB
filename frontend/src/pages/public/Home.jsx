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
  Sparkles,
  Layers,
  Briefcase,
  BookOpen,
  Building2,
  ShieldCheck,
  Award,
  X,
  Check,
  HelpCircle,
  Clock,
  Calendar,
  Monitor,
  GraduationCap
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

  // Pricing Billing Cycle (Monthly / Annual)
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Active Audience Tab in Platform Overview
  const [activeAudience, setActiveAudience] = useState('student');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Institute Onboarding / Demo Modal State
  const [instituteModalOpen, setInstituteModalOpen] = useState(false);
  const [instituteForm, setInstituteForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    plan: 'Institute Campus License',
    requirements: ''
  });
  const [instituteSubmitting, setInstituteSubmitting] = useState(false);
  const [instituteSubmitted, setInstituteSubmitted] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      setModulesError(null);
      try {
        const data = await modulesApi.getAll();
        setModules(data);
      } catch (err) {
        console.error(err);
        setModulesError("Unable to load academic modules. Please try again later.");
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
        setInstructorsError("Unable to load faculty members right now.");
      } finally {
        setLoadingInstructors(false);
      }
    };

    void fetchModules();
    void fetchInstructors();
  }, []);

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

  const handleInstituteSubmit = async (e) => {
    e.preventDefault();
    if (!instituteForm.name || !instituteForm.email) {
      alert('Please provide your full name and official email address.');
      return;
    }
    setInstituteSubmitting(true);
    try {
      await contactApi.submit({
        first_name: instituteForm.name.split(' ')[0] || instituteForm.name,
        last_name: instituteForm.name.split(' ').slice(1).join(' ') || (instituteForm.organization ? `(${instituteForm.organization})` : 'Institution Head'),
        email: instituteForm.email,
        phone: instituteForm.phone || '+44 0000 000000',
        subject: `Institutional SaaS Provisioning Request — ${instituteForm.organization || 'Academy / School'}`,
        message: `Plan Selected: ${instituteForm.plan}\nOrganization: ${instituteForm.organization || 'Not specified'}\nPhone/WhatsApp: ${instituteForm.phone || 'Not specified'}\nRequirements & Deployment Notes:\n${instituteForm.requirements || 'Requested an isolated institutional tenant setup on Emam Arabic LMS.'}`
      });
      setInstituteSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Unable to submit your request at this moment. Please reach out via our contact page.');
    } finally {
      setInstituteSubmitting(false);
    }
  };

  const audiencePillars = [
    {
      id: 'student',
      label: 'For Students',
      icon: GraduationCap,
      title: 'Accelerated Arabic Learning & Certification',
      subtitle: 'Complete student workspace engineered for syntax, morphology, and keyboard mastery.',
      points: [
        'Structured A1 to B2 progressive curriculum with CEFR alignment',
        '200-level Touch-Typing Lab with real-time accuracy & WPM engine',
        'Live virtual smart classroom with integrated digital whiteboard notes',
        'Auto-saved personal Smart Notebook with one-click PDF export',
        'Cryptographically verifiable digital completion certificate'
      ],
      actionLabel: 'Enroll as Student',
      actionLink: '/admission'
    },
    {
      id: 'instructor',
      label: 'For Instructors',
      icon: User,
      title: 'Dedicated Virtual Teaching Studio',
      subtitle: 'Professional workspace for Arabic tutors, language coaches, and linguistic scholars.',
      points: [
        'Dedicated instructor portal with centralized student roster and attendance',
        'Integrated WebRTC virtual smart classroom with dual-canvas whiteboard',
        'Structured assignment distribution, evaluation, and grading workflow',
        'Direct consultation messaging bridge with active students',
        'Flexible schedule configuration for weekday 1-on-1 and weekend cohorts'
      ],
      actionLabel: 'Instructor Workspace Info',
      actionLink: '/instructor/login'
    },
    {
      id: 'institute',
      label: 'For Institutes & Academies',
      icon: Building2,
      title: 'Multi-Tenant Institutional SaaS Environment',
      subtitle: 'Isolated institutional tenant space provisioned and governed by Emam Super Admin.',
      points: [
        'Fully dedicated Institute Administrator Dashboard with zero data cross-over',
        'Automated applicant pipeline with custom sequential student IDs (EMAM-YYYY-XXXX)',
        'Real-time fee verification, payment proof auditing, and automated receipt notifications',
        'Comprehensive institutional reports, attendance analytics, and academic audit logs',
        'Super Admin technical support, institutional onboarding, and custom domain options'
      ],
      actionLabel: 'Request Institute Provisioning',
      actionModal: true
    }
  ];

  const pricingTiers = [
    {
      id: 'student',
      name: 'Student License',
      badge: 'Individual Learners',
      priceMonthly: '£19',
      priceAnnual: '£15',
      period: 'per month',
      description: 'Ideal for independent learners aiming for comprehensive Arabic fluency, grammar syntax, and touch-typing certification.',
      features: [
        'Full access to structured A1 – B2 academic curriculum',
        '200-Level Arabic Touch-Typing Lab & benchmark grading',
        'Interactive Smart Classroom access with live lecture archive',
        'Auto-saved digital Smart Notebook with PDF export',
        'Official cryptographically verified course certificate',
        'Standard student support desk'
      ],
      ctaText: 'Start Learning',
      ctaLink: '/admission',
      isPopular: false
    },
    {
      id: 'instructor',
      name: 'Instructor Workspace',
      badge: 'Independent Tutors',
      priceMonthly: '£49',
      priceAnnual: '£39',
      period: 'per month',
      description: 'Designed for independent Arabic teachers and scholars conducting private 1-on-1 tutoring and small group workshops.',
      features: [
        'Full Instructor Portal access & student roster management',
        'Virtual Smart Classroom with integrated Arabic digital whiteboard',
        'Manage up to 25 active concurrent private students',
        'Assignment distribution, grading, and attendance tracking',
        'In-platform direct messaging & consultation channel',
        'Official certified tutor profile listing on Emam',
        'Priority technical assistance'
      ],
      ctaText: 'Access Tutor Portal',
      ctaLink: '/instructor/login',
      isPopular: false
    },
    {
      id: 'institute',
      name: 'Institute Campus SaaS',
      badge: 'Most Comprehensive for Academies',
      priceMonthly: 'Custom',
      priceAnnual: 'Annual Contract',
      period: 'billed annually',
      description: 'Dedicated multi-tenant cloud environment for Islamic schools, madrasahs, and language centers, provisioned by Emam Super Admin.',
      features: [
        'Fully isolated institutional space with dedicated Admin Portal',
        'Super Admin provisioned credentials and tenant configuration',
        'Unlimited instructor accounts and scalable student enrollment',
        'Automated admissions pipeline & unique student code generator',
        'Financial module: payment verification, receipt logs, and auditing',
        'Multi-cohort scheduling (Weekday 1-on-1 & Weekend Group Classes)',
        'Institutional data ownership, compliance, and priority SLA support'
      ],
      ctaText: 'Request Institute Demo',
      actionModal: true,
      isPopular: true
    }
  ];

  const faqs = [
    {
      q: 'What is Emam Arabic LMS and how does the SaaS model work?',
      a: 'Emam is a specialized cloud learning management system (LMS) and administrative ERP built specifically for Arabic language education. We support individual students, independent tutors, and educational institutes. For institutes, Emam Super Admin provisions a dedicated, private tenant space where the institute administrator manages their own teachers, students, admissions, and financial records in full isolation.'
    },
    {
      q: 'How does an institute or academy get onboarded?',
      a: 'School and academy leaders can request an Institute Campus License through our demo request form. Emam Super Admin reviews the institutional requirements and provisions a dedicated administrative account with tailored seat allocations, student code sequences, and customized course modules.'
    },
    {
      q: 'What makes the Emam Arabic Touch-Typing Lab unique?',
      a: 'Our typing lab features 200 progressive difficulty levels mapped to the standard Arabic 101 keyboard. It includes automatic transliteration for QWERTY keyboards, real-time WPM and accuracy metrics, and awards an official verifiable digital certificate upon completing the curriculum.'
    },
    {
      q: 'Can instructors use Emam to teach their own independent students?',
      a: 'Yes. Our Instructor Workspace provides certified tutors with a standalone virtual teaching studio, including an interactive Arabic digital whiteboard, student attendance tracking, assignment evaluation, and direct messaging.'
    },
    {
      q: 'How are certificates verified on Emam?',
      a: 'Every completion certificate issued through Emam carries a unique cryptographically generated serial ID. Anyone can instantly verify the authenticity, issue date, and grade through our public verification portal at /verify-certificate.'
    }
  ];

  const reviews = [
    { id: 1, student: 'Dr. Tariq Al-Hashimi', role: 'Academy Director, London', text: 'Deploying Emam across our weekend school simplified student tracking and fee verification. The dedicated administrative dashboard gives us total visibility without operational friction.', rating: 5 },
    { id: 2, student: 'Sarah M.', role: 'Intermediate Arabic Student', text: 'The combination of live classes and the 200-level typing lab helped me achieve fluency and keyboard proficiency in months. The smart notebook feature is exceptional.', rating: 5 },
    { id: 3, student: 'Ustadh Omar Farooq', role: 'Classical Arabic Instructor', text: 'The virtual smart classroom with the Arabic digital whiteboard provides everything an instructor needs. Attendance, grading, and lecturing are completely unified.', rating: 5 },
  ];

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minWidth: 0, overflowX: 'hidden' }}>
      {/* ======================================================== */}
      {/* 1. ENTERPRISE HERO SECTION                               */}
      {/* ======================================================== */}
      <section style={{ minHeight: 'calc(100vh - 5.5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.25rem 1.5rem 2.25rem', position: 'relative', overflow: 'hidden' }}>
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

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
          {/* Top Authority Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 18px', borderRadius: '30px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.28)', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.9rem' }}
          >
            <Sparkles size={15} color="var(--color-primary)" />
            <span>Emam Platform • Enterprise Arabic Education SaaS</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontSize: 'clamp(1.9rem, 3.2vw + 0.4rem, 3.2rem)', fontWeight: '800', lineHeight: '1.18', marginBottom: '1rem', color: 'var(--color-white)', letterSpacing: '-0.5px' }}
          >
            The Cloud Learning &amp;
            <br />
            <span className="gradient-text glow-text">Institutional Management Platform</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ fontSize: 'clamp(0.92rem, 1.1vw + 0.15rem, 1.05rem)', color: '#f0ceb3', maxWidth: '760px', margin: '0 auto 1.6rem auto', lineHeight: '1.55' }}
          >
            A unified multi-tenant SaaS engineered for ambitious students, professional Arabic tutors, and language academies. Delivering CEFR-aligned curriculum, 200-level typing certification, virtual smart classrooms, and institutional management.
          </motion.p>

          {/* Dual Action CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}
          >
            <a
              href="#pricing"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '13px 28px', fontSize: '0.98rem', textDecoration: 'none' }}
            >
              Explore Pricing &amp; Plans <ArrowRight size={17} />
            </a>

            <button
              onClick={() => {
                setInstituteSubmitted(false);
                setInstituteModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '13px 26px',
                fontSize: '0.98rem',
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
              <Building2 size={17} /> Request Institute Onboarding
            </button>
          </motion.div>

          {/* Metrics Trust Bar (4 Proof Points) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', width: '100%', maxWidth: '940px', margin: '0 auto' }}
          >
            <div className="glass-panel" style={{ padding: '0.9rem 0.75rem', textAlign: 'center', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>A1 – B2</div>
              <div style={{ fontSize: '0.82rem', color: '#f0ceb3', fontWeight: '500' }}>CEFR Aligned Arabic Curriculum</div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 0.75rem', textAlign: 'center', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>200 Levels</div>
              <div style={{ fontSize: '0.82rem', color: '#f0ceb3', fontWeight: '500' }}>Progressive Touch-Typing Lab</div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 0.75rem', textAlign: 'center', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>1-on-1 &amp; Cohort</div>
              <div style={{ fontSize: '0.82rem', color: '#f0ceb3', fontWeight: '500' }}>Virtual Smart Classroom Studio</div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 0.75rem', textAlign: 'center', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>Multi-Tenant</div>
              <div style={{ fontSize: '0.82rem', color: '#f0ceb3', fontWeight: '500' }}>Dedicated Institutional Spaces</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. PLATFORM ARCHITECTURE FOR 3 AUDIENCES                 */}
      {/* ======================================================== */}
      <section id="architecture" style={{ padding: '5.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.25)', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <Layers size={14} color="var(--color-primary)" />
            <span>Integrated Platform Architecture</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.9rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            Engineered for Three Distinct Stakeholders
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '720px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            From independent learners and private tutors to multi-branch Islamic academies, Emam provides dedicated workspaces tailored to each role.
          </p>
        </motion.div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          {audiencePillars.map((p) => {
            const Icon = p.icon;
            const active = activeAudience === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveAudience(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  border: active ? '1px solid var(--color-primary)' : '1px solid rgba(241, 163, 42, 0.2)',
                  background: active ? 'var(--color-primary)' : 'rgba(105, 14, 31, 0.25)',
                  color: active ? '#2c050d' : '#f0ceb3',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                <Icon size={18} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Audience Content Display */}
        {(() => {
          const current = audiencePillars.find((p) => p.id === activeAudience) || audiencePillars[0];
          const CurrentIcon = current.icon;
          return (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="glass-panel"
              style={{
                padding: '2.75rem',
                borderRadius: '24px',
                border: '1px solid rgba(241, 163, 42, 0.28)',
                background: 'linear-gradient(135deg, rgba(105, 14, 31, 0.55), rgba(44, 5, 13, 0.85))'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    <CurrentIcon size={18} />
                    <span>Workspace Specification</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: '800', color: 'var(--color-white)', marginBottom: '0.6rem' }}>
                    {current.title}
                  </h3>
                  <p style={{ color: '#f0ceb3', fontSize: '1.05rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
                    {current.subtitle}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem' }}>
                    {current.points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#fdfdfd', fontSize: '0.94rem' }}>
                        <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {current.actionModal ? (
                    <button
                      onClick={() => {
                        setInstituteSubmitted(false);
                        setInstituteModalOpen(true);
                      }}
                      className="btn-primary"
                      style={{ padding: '14px 30px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                    >
                      {current.actionLabel} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <Link
                      to={current.actionLink}
                      className="btn-primary"
                      style={{ padding: '14px 30px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                    >
                      {current.actionLabel} <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </section>

      {/* ======================================================== */}
      {/* 3. TRAINING DELIVERY FORMATS                             */}
      {/* ======================================================== */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            Flexible Delivery Formats
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem' }}>
            Structured learning schedules tailored for individual focus, collaborative cohort interaction, or independent self-study.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Card 1: Weekday 1 on 1 */}
          <motion.div
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
            className="glass-panel"
            style={{ padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(241, 163, 42, 0.22)', background: 'rgba(105, 14, 31, 0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(241, 163, 42, 0.12)', border: '1px solid rgba(241, 163, 42, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <User size={28} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(241, 163, 42, 0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Weekday Format
                </span>
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '0.4rem' }}>
                Monday to Friday
              </h3>
              <p style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '1.2rem' }}>
                1 on 1 Private Tutoring
              </p>
              <p style={{ color: '#e0d0c8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.8rem' }}>
                Intensive one-on-one sessions offering undivided instructor focus, customized pacing, and targeted conversational practice.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fdfdfd', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>100% individual mentor engagement</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fdfdfd', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Customizable weekly time slots</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fdfdfd', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Rapid correction and spoken fluency drills</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Weekend Cohorts */}
          <motion.div
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
            className="glass-panel"
            style={{ padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(241, 163, 42, 0.22)', background: 'rgba(105, 14, 31, 0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(241, 163, 42, 0.12)', border: '1px solid rgba(241, 163, 42, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <Users size={28} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(241, 163, 42, 0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Weekend Format
                </span>
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '0.4rem' }}>
                Saturday & Sunday
              </h3>
              <p style={{ fontSize: '1.15rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '1.2rem' }}>
                Collaborative Cohorts + 1 on 1
              </p>
              <p style={{ color: '#e0d0c8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.8rem' }}>
                Interactive small group discussions paired with individual consultations, perfectly structured for working professionals and weekend learners.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fdfdfd', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Interactive peer discussions & group exercises</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fdfdfd', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Flexible weekend consultation hours</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fdfdfd', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Ideal for professionals balancing full-time work</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. DYNAMIC COURSE MODULES (/api/modules)                 */}
      {/* ======================================================== */}
      <section id="courses" style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.25)', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <BookOpen size={14} color="var(--color-primary)" />
            <span>Structured Academic Tracks</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            Arabic Language Curriculum Levels
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem' }}>
            Progression paths built according to global language standards, guiding students from foundational literacy to advanced linguistic mastery.
          </p>
        </motion.div>

        {loadingModules ? (
          <p style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '3rem', fontSize: '1.15rem' }}>Loading academic modules...</p>
        ) : modulesError ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>{modulesError}</p>
        ) : modules.length === 0 ? (
          <p style={{ color: '#f0ceb3', textAlign: 'center', fontSize: '1.1rem', padding: '3rem' }}>No modules available at the moment.</p>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={containerVariants}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.8rem' }}
          >
            {modules.map((mod) => {
              const modTitle = mod.name || mod.title || 'Module';
              return (
                <motion.div
                  key={mod._id || mod.id || modTitle}
                  variants={itemVariants}
                  whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                  className="glass-panel"
                  style={{ padding: '2rem 1.5rem', textAlign: 'center', border: '1px solid rgba(241, 163, 42, 0.2)', background: 'rgba(105, 14, 31, 0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '18px' }}
                >
                  {mod.image ? (
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.2rem', border: '1px solid var(--color-primary)' }}>
                      <img src={getAvatarUrl(mod.image, modTitle)} alt={modTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', color: '#2c050d', fontWeight: '800', fontSize: '1.4rem' }}>
                      {modTitle}
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--color-white)', fontWeight: '700', marginBottom: '0.6rem' }}>
                    Level {modTitle}
                  </h3>
                  <p style={{ color: '#e0d0c8', fontSize: '0.92rem', lineHeight: '1.55', flexGrow: 1, marginBottom: '1.25rem' }}>
                    {mod.description || 'Comprehensive curriculum covering syntax, morphology, oral fluency, and reading comprehension.'}
                  </p>
                  <Link
                    to="/admission"
                    style={{ color: 'var(--color-primary)', fontSize: '0.88rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Apply for Level <ArrowRight size={14} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 5. DYNAMIC FACULTY DIRECTORY (/api/instructors)          */}
      {/* ======================================================== */}
      <section id="faculty" style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.25)', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <Users size={14} color="var(--color-primary)" />
            <span>Certified Teaching Faculty</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            Learn from Verified Arabic Instructors
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem' }}>
            Our vetted educators bring years of academic experience in classical Arabic, grammatical syntax (Nahw), morphology (Sarf), and spoken proficiency.
          </p>
        </motion.div>

        {loadingInstructors ? (
          <p style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '3rem', fontSize: '1.15rem' }}>Loading certified faculty...</p>
        ) : instructorsError ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>{instructorsError}</p>
        ) : instructors.length === 0 ? (
          <p style={{ color: '#f0ceb3', textAlign: 'center', fontSize: '1.1rem', padding: '3rem' }}>No faculty profiles available at the moment.</p>
        ) : (
          <div style={{ position: 'relative', padding: '0 2.5rem' }}>
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
                    style={{ padding: '2.25rem 1.75rem', textAlign: 'center', border: '1px solid rgba(241, 163, 42, 0.2)', background: 'rgba(105, 14, 31, 0.22)', borderRadius: '20px' }}
                  >
                    <div style={{ display: 'inline-block', padding: '3px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', marginBottom: '1rem' }}>
                      <img
                        src={getAvatarUrl(instructor.avatar, instructor.name)}
                        alt={instructor.name}
                        style={{ width: '84px', height: '84px', borderRadius: '50%', display: 'block', background: 'var(--color-bg-dark)', objectFit: 'cover' }}
                      />
                    </div>

                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--color-white)', fontWeight: '700' }}>{instructor.name}</h3>
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.92rem', fontWeight: '600', marginBottom: instructor.about ? '0.75rem' : '0' }}>
                      {instructor.specialty || 'Classical Arabic & Syntax'}
                    </p>
                    {instructor.about && (
                      <p style={{ color: '#e0d0c8', fontSize: '0.88rem', lineHeight: '1.5' }}>{instructor.about}</p>
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

      {/* ======================================================== */}
      {/* 6. SAAS PRICING & SUBSCRIPTION TIERS (3 OPTIONS)         */}
      {/* ======================================================== */}
      <section id="pricing" style={{ padding: '5.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(241, 163, 42, 0.1)', border: '1px solid rgba(241, 163, 42, 0.25)', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <Award size={14} color="var(--color-primary)" />
            <span>Transparent SaaS Licensing</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            Subscription Plans for Every Stage
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '720px', margin: '0 auto 2rem auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Choose the dedicated license tailored for individual learning, private tutor workspaces, or complete institutional academy provisioning.
          </p>

          {/* Billing Cycle Switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px', borderRadius: '30px', background: 'rgba(105, 14, 31, 0.35)', border: '1px solid rgba(241, 163, 42, 0.25)' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: billingCycle === 'monthly' ? 'var(--color-primary)' : 'transparent',
                color: billingCycle === 'monthly' ? '#2c050d' : '#f0ceb3',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: billingCycle === 'annual' ? 'var(--color-primary)' : 'transparent',
                color: billingCycle === 'annual' ? '#2c050d' : '#f0ceb3',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Annual Billing (Save 20%)
            </button>
          </div>
        </motion.div>

        {/* 3 Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
          {pricingTiers.map((tier) => {
            const price = billingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
            return (
              <motion.div
                key={tier.id}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)' }}
                className="glass-panel"
                style={{
                  padding: '2.75rem 2rem',
                  borderRadius: '24px',
                  border: tier.isPopular ? '2px solid var(--color-primary)' : '1px solid rgba(241, 163, 42, 0.22)',
                  background: tier.isPopular ? 'linear-gradient(135deg, rgba(105, 14, 31, 0.45), rgba(44, 5, 13, 0.85))' : 'rgba(105, 14, 31, 0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '5px 12px', borderRadius: '14px', background: tier.isPopular ? 'var(--color-primary)' : 'rgba(241, 163, 42, 0.12)', color: tier.isPopular ? '#2c050d' : 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {tier.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-white)', marginBottom: '0.5rem' }}>
                    {tier.name}
                  </h3>
                  <p style={{ color: '#e0d0c8', fontSize: '0.92rem', lineHeight: '1.55', marginBottom: '1.75rem' }}>
                    {tier.description}
                  </p>

                  {/* Price Block */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(241, 163, 42, 0.15)', paddingBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                      {price}
                    </span>
                    <span style={{ fontSize: '0.92rem', color: '#f0ceb3', fontWeight: '500' }}>
                      {tier.period}
                    </span>
                  </div>

                  {/* Features List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
                    {tier.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.93rem', color: '#fdfdfd' }}>
                        <Check size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action */}
                <div>
                  {tier.actionModal ? (
                    <button
                      onClick={() => {
                        setInstituteForm({ ...instituteForm, plan: tier.name });
                        setInstituteSubmitted(false);
                        setInstituteModalOpen(true);
                      }}
                      className="btn-primary"
                      style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {tier.ctaText} <ArrowRight size={18} />
                    </button>
                  ) : (
                    <Link
                      to={tier.ctaLink}
                      className={tier.isPopular ? 'btn-primary' : ''}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        borderRadius: '30px',
                        textDecoration: 'none',
                        background: tier.isPopular ? undefined : 'rgba(241, 163, 42, 0.1)',
                        border: tier.isPopular ? undefined : '1px solid rgba(241, 163, 42, 0.3)',
                        color: tier.isPopular ? undefined : 'var(--color-primary)',
                        fontWeight: '700',
                        boxSizing: 'border-box'
                      }}
                    >
                      {tier.ctaText} <ArrowRight size={18} />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. INSTITUTIONAL MULTI-TENANT PROVISIONING SPOTLIGHT     */}
      {/* ======================================================== */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div
          className="glass-panel"
          style={{
            padding: '3.5rem 2.5rem',
            borderRadius: '24px',
            border: '1px solid rgba(241, 163, 42, 0.3)',
            background: 'linear-gradient(135deg, rgba(105, 14, 31, 0.65), rgba(44, 5, 13, 0.95))'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                <ShieldCheck size={18} />
                <span>Super Admin Governed • Complete Data Isolation</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: '800', color: 'var(--color-white)', marginBottom: '1rem', lineHeight: '1.2' }}>
                How Emam Multi-Tenant Architecture Protects Your Academy
              </h2>
              <p style={{ color: '#f0ceb3', fontSize: '1.02rem', lineHeight: '1.65', marginBottom: '1.8rem' }}>
                When an institute joins Emam, our Super Admin provisions a dedicated tenant partition. Your academy maintains independent administrative control over student records, fee approvals, instructor assignments, and academic reports.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>Isolated Student Lifecycle</strong>
                    <p style={{ color: '#e0d0c8', fontSize: '0.88rem', margin: '2px 0 0 0' }}>Sequential student IDs (EMAM-YYYY-XXXX), private enrollment records, and dedicated admission forms.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>Financial & Fee Verification Engine</strong>
                    <p style={{ color: '#e0d0c8', fontSize: '0.88rem', margin: '2px 0 0 0' }}>Institutional bank account reconciliation, proof verification, and automated email receipts.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>Centralized Super Admin Oversight</strong>
                    <p style={{ color: '#e0d0c8', fontSize: '0.88rem', margin: '2px 0 0 0' }}>Emam guarantees 99.9% platform availability, server security hardening, and regular feature updates.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '2rem', borderRadius: '20px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(241, 163, 42, 0.2)' }}>
              <Building2 size={48} color="var(--color-primary)" style={{ margin: '0 auto 1.25rem auto' }} />
              <h3 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: '700', marginBottom: '0.5rem' }}>
                Deploy Emam for Your Academy
              </h3>
              <p style={{ color: '#f0ceb3', fontSize: '0.92rem', lineHeight: '1.55', marginBottom: '1.75rem' }}>
                Connect with our Super Admin team to evaluate student volume, faculty seats, and obtain a tailored campus deployment proposal.
              </p>
              <button
                onClick={() => {
                  setInstituteForm({ ...instituteForm, plan: 'Institute Campus License' });
                  setInstituteSubmitted(false);
                  setInstituteModalOpen(true);
                }}
                className="btn-primary"
                style={{ padding: '14px 32px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
              >
                Schedule Institutional Walkthrough
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. TESTIMONIALS & FAQ ACCORDION                          */}
      {/* ======================================================== */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem' }}>
            Clear insights into our multi-tenant SaaS architecture, curriculum standards, and user licensing.
          </p>
        </motion.div>

        <div style={{ maxWidth: '850px', margin: '0 auto 4.5rem auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  borderRadius: '16px',
                  border: isOpen ? '1px solid var(--color-primary)' : '1px solid rgba(241, 163, 42, 0.2)',
                  background: 'rgba(105, 14, 31, 0.22)',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-white)',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    gap: '1rem'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: '400', flexShrink: 0 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ padding: '0 1.5rem 1.35rem 1.5rem', color: '#f0ceb3', fontSize: '0.95rem', lineHeight: '1.65' }}
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Client & Student Reviews */}
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
              style={{ padding: '2.25rem 1.75rem', border: '1px solid rgba(241, 163, 42, 0.2)', background: 'rgba(105, 14, 31, 0.22)', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '18px' }}
            >
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--color-primary)" color="var(--color-primary)" />
                ))}
              </div>
              <p style={{ color: '#fdfdfd', fontStyle: 'italic', flexGrow: 1, fontSize: '0.94rem', lineHeight: '1.6' }}>
                "{review.text}"
              </p>
              <div>
                <h4 style={{ color: 'var(--color-white)', fontWeight: '700', fontSize: '1rem', margin: '0 0 2px 0' }}>
                  {review.student}
                </h4>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                  {review.role}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ======================================================== */}
      {/* 9. GLOBAL CONVERSION BANNER                              */}
      {/* ======================================================== */}
      <section style={{ padding: '2rem 1.5rem 6rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: '26px',
            border: '1px solid rgba(241, 163, 42, 0.3)',
            background: 'linear-gradient(135deg, rgba(105, 14, 31, 0.7), rgba(44, 5, 13, 0.9))'
          }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)', fontWeight: '800', color: 'var(--color-white)', marginBottom: '1rem' }}>
            Elevate Your Arabic Learning or Academy Today
          </h2>
          <p style={{ color: '#f0ceb3', maxWidth: '650px', margin: '0 auto 2.5rem auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Join hundreds of learners and institutions leveraging Emam's cloud infrastructure for accredited language mastery and institutional governance.
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/admission"
              className="btn-primary"
              style={{ padding: '16px 36px', fontSize: '1.05rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Enroll as a Student <ArrowRight size={18} />
            </Link>

            <button
              onClick={() => {
                setInstituteSubmitted(false);
                setInstituteModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '16px 32px',
                fontSize: '1.05rem',
                borderRadius: '30px',
                background: 'rgba(241, 163, 42, 0.1)',
                border: '1px solid rgba(241, 163, 42, 0.35)',
                color: 'var(--color-primary)',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <Building2 size={18} /> Request Institute Tenant
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 10. INSTITUTE ONBOARDING / PROVISIONING MODAL            */}
      {/* ======================================================== */}
      <AnimatePresence>
        {instituteModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '580px',
                borderRadius: '24px',
                border: '1px solid rgba(241, 163, 42, 0.35)',
                background: 'linear-gradient(135deg, rgba(105, 14, 31, 0.96), rgba(44, 5, 13, 0.98))',
                padding: '2.5rem',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setInstituteModalOpen(false)}
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              {instituteSubmitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <Check size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: '700', marginBottom: '0.75rem' }}>
                    Institutional Request Received
                  </h3>
                  <p style={{ color: '#f0ceb3', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Thank you. Emam Super Admin has received your institutional onboarding request. Our team will contact you within 24 business hours to finalize your dedicated tenant space and provision your administrative credentials.
                  </p>
                  <button
                    onClick={() => setInstituteModalOpen(false)}
                    className="btn-primary"
                    style={{ padding: '12px 32px' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInstituteSubmit}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <Building2 size={16} />
                    <span>Multi-Tenant Institutional Provisioning</span>
                  </div>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--color-white)', fontWeight: '800', marginBottom: '0.4rem' }}>
                    Request Dedicated Institute Space
                  </h3>
                  <p style={{ color: '#f0ceb3', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
                    Empower your school or academy with an isolated Emam tenant, custom student IDs, and automated administration.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Authorized Representative Name *</label>
                      <input
                        type="text"
                        required
                        value={instituteForm.name}
                        onChange={(e) => setInstituteForm({ ...instituteForm, name: e.target.value })}
                        placeholder="e.g. Dr. Haris Mahmood"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Academy / Madrasah / School Name</label>
                      <input
                        type="text"
                        value={instituteForm.organization}
                        onChange={(e) => setInstituteForm({ ...instituteForm, organization: e.target.value })}
                        placeholder="e.g. Al-Noor Islamic Academy"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Official Email *</label>
                        <input
                          type="email"
                          required
                          value={instituteForm.email}
                          onChange={(e) => setInstituteForm({ ...instituteForm, email: e.target.value })}
                          placeholder="admin@academy.edu"
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Phone / WhatsApp</label>
                        <input
                          type="text"
                          value={instituteForm.phone}
                          onChange={(e) => setInstituteForm({ ...instituteForm, phone: e.target.value })}
                          placeholder="+44 20 7946 0991"
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#f0ceb3', fontWeight: '600', marginBottom: '0.35rem' }}>Estimated Student Volume & Requirements</label>
                      <textarea
                        rows={3}
                        value={instituteForm.requirements}
                        onChange={(e) => setInstituteForm({ ...instituteForm, requirements: e.target.value })}
                        placeholder="Estimated number of students, teachers, custom branding, or specific curriculum needs..."
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(241, 163, 42, 0.25)', color: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={instituteSubmitting}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: instituteSubmitting ? 0.7 : 1 }}
                  >
                    {instituteSubmitting ? 'Submitting Request...' : 'Submit Institutional Request'} <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
