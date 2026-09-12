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
  BookOpen,
  GraduationCap,
  Award,
  Globe2,
  Quote
} from 'lucide-react';
import { modulesApi, instructorsApi } from '../../api';
import { getAvatarUrl } from '../../api/client';

export function Home() {
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [modulesError, setModulesError] = useState(null);

  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [instructorsError, setInstructorsError] = useState(null);

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

    fetchModules();
    fetchInstructors();
  }, []);

  const reviews = [
    { id: 1, student: 'Yusuf K.', role: 'Level 2 Student', text: 'The methodology is incredible. I learned more in 3 months than I did in 2 years of self-study.', rating: 5 },
    { id: 2, student: 'Sarah M.', role: 'Weekend Cohort', text: 'A truly futuristic platform. The instructors are top-notch, patient, and the interactive portal is beautiful.', rating: 5 },
    { id: 3, student: 'Omar R.', role: '1-on-1 Student', text: 'Convenient and highly effective. Highly recommended for anyone serious about Quranic and conversational Arabic.', rating: 5 },
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
        staggerChildren: 0.15,
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
      {/* Hero Section */}
      <section style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 2rem 2rem 2rem', position: 'relative' }}>
        {/* Animated Glow Elements */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, 20, 0],
            y: [0, -15, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '10%', left: '5%', width: '340px', height: '340px', background: 'var(--color-glow)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '10%', right: '5%', width: '420px', height: '420px', background: 'var(--color-accent)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', width: '100%' }}>
          {/* Floating Arabic Tags in Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
              marginBottom: '1.75rem',
            }}
          >
            {[
              { ar: 'العربية الفصحى', en: 'Classical Arabic', icon: Sparkles },
              { ar: 'محادثة وطلاقة', en: 'Conversational Fluency', icon: Globe2 },
              { ar: 'تجويد وقواعد', en: 'Grammar & Tajweed', icon: BookOpen },
            ].map((tag, idx) => {
              const IconComp = tag.icon;
              return (
                <motion.div
                  key={idx}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5 + idx * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.06, borderColor: 'var(--color-primary)' }}
                  className="glass-panel"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '6px 14px',
                    borderRadius: '30px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(197, 229, 232, 0.2)',
                    color: 'var(--color-primary)',
                    fontSize: '0.85rem',
                    cursor: 'default',
                  }}
                >
                  <IconComp size={14} color="var(--color-primary)" />
                  <span className="arabic-text" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{tag.ar}</span>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>• {tag.en}</span>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: 'clamp(2.4rem, 5vw + 1rem, 4.4rem)', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem' }}
          >
            Master Arabic from the <br /> <span className="gradient-text glow-text">Comfort of Your Home</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 1.25rem)', color: '#e0e0e0', marginBottom: '2.5rem', lineHeight: 1.6 }}
          >
            Join a next-generation learning platform with dedicated 1-on-1 tutoring, structured levels, and expert instructors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link to="/admission" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '16px 38px', fontSize: '1.1rem', textDecoration: 'none', fontWeight: 600 }}>
                Get Started <ArrowRight size={20} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link to="/about" className="glass-panel" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '16px 32px', fontSize: '1.1rem', textDecoration: 'none', color: '#fff', border: '1px solid rgba(197, 229, 232, 0.25)', borderRadius: '30px', fontWeight: 500 }}>
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Highlights Strip */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={containerVariants}
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 2.5rem 2rem', position: 'relative', zIndex: 1 }}
      >
        <div
          className="glass-panel"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid rgba(197, 229, 232, 0.15)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {[
            { icon: User, title: '1-on-1 & Group Formats', desc: 'Flexible weekday & weekend pacing' },
            { icon: GraduationCap, title: 'Expert Native Tutors', desc: 'Certified Arabic instructors' },
            { icon: BookOpen, title: 'Structured Modules', desc: 'From foundational to complete fluency' },
            { icon: Award, title: 'Interactive LMS Portal', desc: 'Assignments, attendance & progress tracking' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-white)', margin: 0 }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#8892b0', margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Class Types Section */}
      <section style={{ padding: '5rem 2rem 3rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={14} /> Flexible Scheduling
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Class Types</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
            Choose the learning format that fits your schedule, lifestyle, and personalized Arabic learning pace.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Card 1: Monday to Friday 1 on 1 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
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
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}
                >
                  <User size={28} />
                </motion.div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(56, 189, 248, 0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                Dedicated private tutoring designed for focused, individual attention and customized Arabic fluency milestones.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
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

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/admission"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Apply for 1-on-1 <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Card 2: Weekend Group + 1 on 1 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
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
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}
                >
                  <Users size={28} />
                </motion.div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', background: 'rgba(217, 119, 6, 0.1)', color: '#fbbf24', border: '1px solid rgba(217, 119, 6, 0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Weekend Format
                </span>
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '0.4rem' }}>
                On Weekend
              </h3>
              <p style={{ fontSize: '1.15rem', color: '#fbbf24', fontWeight: '600', marginBottom: '1.2rem' }}>
                Group + 1 on 1 Classes
              </p>
              <p style={{ color: '#b0c4c6', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.8rem' }}>
                Collaborative group sessions with peers alongside flexible 1-on-1 slots, perfect for working professionals and weekend learners.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <span>Interactive small group learning & discussions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <span>Flexible 1-on-1 weekend session options</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e0e0', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <span>Ideal for students & professionals on Saturdays & Sundays</span>
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/admission"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Apply for Weekend <ArrowRight size={18} />
              </Link>
            </motion.div>
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <BookOpen size={14} /> Comprehensive Syllabus
          </div>
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
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}
          >
            {modules.map((mod, idx) => {
              const modTitle = mod.name || mod.title || 'Module';
              return (
                <motion.div
                  key={mod._id || mod.id || modTitle}
                  variants={itemVariants}
                  whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                  className="glass-panel"
                  style={{
                    padding: '2.2rem 1.8rem',
                    textAlign: 'center',
                    border: '1px solid rgba(197, 229, 232, 0.15)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: '18px',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      opacity: 0.7,
                      fontFamily: 'monospace',
                    }}
                  >
                    0{idx + 1}
                  </span>

                  {mod.image ? (
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      style={{ width: '68px', height: '68px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.2rem', border: '1px solid var(--color-primary)' }}
                    >
                      <img src={getAvatarUrl(mod.image, modTitle)} alt={modTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      style={{ width: '68px', height: '68px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', color: 'var(--color-bg-dark)', fontWeight: 'bold', fontSize: '1.5rem' }}
                    >
                      {modTitle[0] || 'A'}
                    </motion.div>
                  )}

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-white)', marginBottom: '0.6rem' }}>
                    {modTitle}
                  </h3>

                  <p style={{ color: '#b0c4c6', fontSize: '0.92rem', lineHeight: '1.5' }}>{mod.description}</p>
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <GraduationCap size={14} /> Qualified Faculty
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Our Expert Instructors</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Learn from native and qualified Arabic scholars dedicated to your personal growth.</p>
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
              style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex === 0 ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex === 0 ? 0.3 : 1 }}
            >
              <ChevronLeft color="var(--color-primary)" />
            </motion.button>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${itemsToShow}, 1fr)`, gap: '2rem', paddingBottom: '2rem' }}>
              <AnimatePresence mode="popLayout">
                {visibleInstructors.map((instructor) => (
                  <motion.div
                    key={instructor._id || instructor.id || instructor.name}
                    layout
                    initial={{ opacity: 0, scale: 0.85, x: 40 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, x: -40 }}
                    transition={{ duration: 0.45, type: "spring", bounce: 0.25 }}
                    whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                    className="glass-panel"
                    style={{ padding: '2.2rem 1.8rem', textAlign: 'center', border: '1px solid rgba(197, 229, 232, 0.15)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      style={{ display: 'inline-block', padding: '4px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', marginBottom: '1rem' }}
                    >
                      <img
                        src={getAvatarUrl(instructor.avatar, instructor.name)}
                        alt={instructor.name}
                        style={{ width: '84px', height: '84px', borderRadius: '50%', display: 'block', background: 'var(--color-bg-dark)', objectFit: 'cover' }}
                      />
                    </motion.div>

                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--color-white)', fontWeight: '600' }}>{instructor.name}</h3>
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.92rem', fontWeight: 500, marginBottom: instructor.about ? '0.6rem' : '0' }}>
                      {instructor.specialty || 'Arabic Instructor'}
                    </p>
                    {instructor.about && (
                      <p style={{ color: '#b0c4c6', fontSize: '0.85rem', lineHeight: '1.5' }}>{instructor.about}</p>
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
              style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex >= Math.max(0, instructors.length - itemsToShow) ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex >= Math.max(0, instructors.length - itemsToShow) ? 0.3 : 1 }}
            >
              <ChevronRight color="var(--color-primary)" />
            </motion.button>
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section style={{ padding: '5rem 2rem 3rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <Star size={14} fill="var(--color-primary)" /> Testimonials
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Student Reviews</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Hear what our dedicated learners have to say about their experience.</p>
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
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-panel"
              style={{
                padding: '2.2rem',
                border: '1px solid rgba(197, 229, 232, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderRadius: '20px',
                position: 'relative',
              }}
            >
              <Quote size={28} color="rgba(197, 229, 232, 0.2)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
              
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(review.rating)].map((_, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.3, rotate: 12 }}>
                    <Star size={16} fill="var(--color-primary)" color="var(--color-primary)" />
                  </motion.div>
                ))}
              </div>

              <p style={{ color: '#e0e0e0', fontStyle: 'italic', flexGrow: 1, fontSize: '0.98rem', lineHeight: '1.6' }}>"{review.text}"</p>
              
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--color-white)', fontWeight: '600', fontSize: '1rem', margin: 0 }}>{review.student}</h4>
                  <span style={{ color: '#8892b0', fontSize: '0.8rem' }}>{review.role}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 8px', borderRadius: '12px' }}>
                  Verified Student
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Final Interactive CTA Banner */}
      <section style={{ padding: '4rem 2rem 6rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          whileHover={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
          className="glass-panel"
          style={{
            padding: '4rem 2.5rem',
            borderRadius: '24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(197, 229, 232, 0.25)',
            background: 'linear-gradient(135deg, rgba(7, 34, 36, 0.9), rgba(17, 66, 70, 0.75))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '240px',
              height: '240px',
              background: 'var(--color-glow)',
              borderRadius: '50%',
              filter: 'blur(90px)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '-60px',
              width: '240px',
              height: '240px',
              background: 'var(--color-accent)',
              borderRadius: '50%',
              filter: 'blur(90px)',
              zIndex: 0,
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '6px 16px',
                borderRadius: '20px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--color-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={15} /> Admissions Open for Next Cohort
            </motion.div>

            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw + 1rem, 3rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.2rem' }} className="gradient-text">
              Ready to Master the Arabic Language?
            </h2>

            <p style={{ color: '#e0e0e0', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Begin with a dedicated 1-on-1 weekday tutor or join our weekend cohort. Step into a personalized learning journey today.
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/admission"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '16px 36px',
                    fontSize: '1.05rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Apply for Admission <ArrowRight size={18} />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/contact"
                  className="glass-panel"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '16px 32px',
                    fontSize: '1.05rem',
                    textDecoration: 'none',
                    color: 'var(--color-white)',
                    border: '1px solid rgba(197, 229, 232, 0.3)',
                    borderRadius: '30px',
                    fontWeight: 500,
                  }}
                >
                  Contact Admissions Team
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

