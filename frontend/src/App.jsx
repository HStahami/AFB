import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Globe2, Sparkles, ArrowRight, Send, Users, Star, Mail, Phone, MapPin, ChevronDown, ChevronLeft, ChevronRight, Menu, X, Plus, Trash2, Check, XCircle, LogOut, Lock } from 'lucide-react';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const BACKEND_URL = API_BASE.startsWith('http') ? API_BASE.replace(/\/api\/?$/, '') : '';

const getAvatarUrl = (avatarUrl, name) => {
  if (!avatarUrl) {
    const encoded = encodeURIComponent(name || 'Instructor');
    return `https://ui-avatars.com/api/?name=${encoded}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true`;
  }
  if (avatarUrl.startsWith('/uploads')) {
    return `${BACKEND_URL}${avatarUrl}`;
  }
  return avatarUrl;
};

// --- Shared Components ---

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }} className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <img src="/afb1.jpeg" alt="AFB Logo" style={{ height: 35, width: 50 }} />
          <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: '700', whiteSpace: 'nowrap' }} className="gradient-text">Alarabia Fi Buyutikum</h1>
        </Link>

        {isMobile && (
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-white)', display: 'flex', alignItems: 'center', padding: 0 }}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        )}
      </div>

      <div style={{
        display: isMobile ? (isOpen ? 'flex' : 'none') : 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1.5rem' : '2rem',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-end',
        width: '100%',
        marginTop: isMobile && isOpen ? '1.5rem' : '0',
        paddingTop: isMobile && isOpen ? '1rem' : '0',
        borderTop: isMobile && isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
        position: isMobile ? 'relative' : 'absolute',
        right: isMobile ? 'auto' : '1.5rem',
        top: isMobile ? 'auto' : '50%',
        transform: isMobile ? 'none' : 'translateY(-50%)'
      }}>
        <Link to="/about" onClick={() => setIsOpen(false)} style={{ color: 'var(--color-white)', textDecoration: 'none', fontWeight: '500' }}>About Us</Link>
        <Link to="/contact" onClick={() => setIsOpen(false)} style={{ color: 'var(--color-white)', textDecoration: 'none', fontWeight: '500' }}>Contact Us</Link>
        <Link to="/admission" onClick={() => setIsOpen(false)} className="btn-primary" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto', textAlign: 'center', boxSizing: 'border-box' }}>Get Started</Link>
      </div>
    </nav>
  );
}

// --- Pages ---

function Home() {
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
        const res = await fetch(`${API_BASE}/modules/`);
        if (!res.ok) throw new Error("Failed to load modules.");
        const data = await res.json();
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
        const res = await fetch(`${API_BASE}/instructors/`);
        if (!res.ok) throw new Error("Failed to load instructors.");
        const data = await res.json();
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
    handleResize(); // Initial check
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero Section */}
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'var(--color-glow)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'var(--color-accent)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}
          >
            Master Arabic from the <br /> <span className="gradient-text glow-text">Comfort of Your Home</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 1.25rem)', color: '#e0e0e0', marginBottom: '2.5rem' }}
          >
            Join a next-generation learning platform designed to make Arabic accessible, engaging, and deeply fulfilling.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}
          >
            <Link to="/admission" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '16px 40px', fontSize: '1.1rem', textDecoration: 'none' }}>
              Get Started <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Arabic Learning Modules Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* <BookOpen size={40} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} /> */}
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Arabic Learning Modules</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Explore our structured levels designed to take you from foundational Arabic to complete fluency.</p>
        </div>

        {loadingModules ? (
          <p style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>Loading modules...</p>
        ) : modulesError ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>{modulesError}</p>
        ) : modules.length === 0 ? (
          <p style={{ color: '#e0e0e0', textAlign: 'center', fontSize: '1.1rem', padding: '3rem' }}>No modules available at the moment.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {modules.map((mod) => (
              <motion.div
                key={mod._id || mod.id || mod.name}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                className="glass-panel"
                style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(197, 229, 232, 0.15)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {mod.image ? (
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.2rem', border: '1px solid var(--color-primary)' }}>
                    <img src={getAvatarUrl(mod.image, mod.name)} alt={mod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', color: 'var(--color-bg-dark)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {mod.name}
                  </div>
                )}
                {/* <h3 style={{ fontSize: '1.6rem', marginBottom: '0.8rem', color: 'var(--color-white)', fontWeight: '700' }}>{mod.name}</h3> */}
                <p style={{ color: '#b0c4c6', fontSize: '0.95rem', lineHeight: '1.5' }}>{mod.description}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Dynamic Instructors Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* <Users size={40} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} /> */}
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Our Expert Instructors</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Learn from the best. Our team is constantly growing to bring you diverse expertise.</p>
        </div>

        {loadingInstructors ? (
          <p style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>Loading instructors...</p>
        ) : instructorsError ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>{instructorsError}</p>
        ) : instructors.length === 0 ? (
          <p style={{ color: '#e0e0e0', textAlign: 'center', fontSize: '1.1rem', padding: '3rem' }}>No instructors available at the moment.</p>
        ) : (
          <div style={{ position: 'relative', padding: '0 3rem' }}>
            <button
              onClick={() => scroll('left')}
              disabled={startIndex === 0}
              className="glass-panel"
              style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex === 0 ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex === 0 ? 0.3 : 1 }}
            >
              <ChevronLeft color="var(--color-primary)" />
            </button>

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

            <button
              onClick={() => scroll('right')}
              disabled={startIndex >= Math.max(0, instructors.length - itemsToShow)}
              className="glass-panel"
              style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex >= Math.max(0, instructors.length - itemsToShow) ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex >= Math.max(0, instructors.length - itemsToShow) ? 0.3 : 1 }}
            >
              <ChevronRight color="var(--color-primary)" />
            </button>
          </div>
        )}
      </section>

      {/* Dynamic Reviews Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* <Star size={40} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} /> */}
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Student Reviews</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Don't just take our word for it. Here is what our students have to say.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {reviews.map((review) => (
            <motion.div
              key={review.id}
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
        </div>
      </section>
    </motion.div>
  );
}

function About() {
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

function Contact() {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', message: '' });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
      }
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
              🎉 Your message has been sent successfully! We will get back to you soon.
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

function CustomSelect({ options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', textAlign: 'left' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: selected ? 'var(--color-white)' : 'rgba(255,255,255,0.6)'
        }}
      >
        {selected ? selected.label : placeholder}
        <ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              background: 'rgba(7, 34, 36, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(197, 229, 232, 0.2)',
              borderRadius: '8px',
              zIndex: 50,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => { setSelected(option); setIsOpen(false); }}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  color: 'var(--color-white)',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(197, 229, 232, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Admission() {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admissions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
      }
    } catch (e) {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div className="glass-panel responsive-form-card" style={{ textAlign: 'center' }}>
        <Sparkles size={48} color="var(--color-primary)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Admission Form</h2>
        <p style={{ color: '#b0c4c6', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Take the first step towards mastering Arabic. Fill out the form below to apply for our courses.
        </p>
        {success ? (
          <div style={{ color: '#2ecc71', fontSize: '1.2rem', padding: '2rem' }}>
            🎉 Application submitted successfully! Our team will contact you soon.
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

// --- Admin Components ---

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('adminToken', data.access_token);
      onLogin();
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <Lock size={48} color="var(--color-primary)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }} className="gradient-text">Admin Portal</h2>
        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, canceled: 0, total_students: 0, total_instructors: 0, total_modules: 0 });
  const [admissions, setAdmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);
  const [slots, setSlots] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Instructor Form State
  const [newInstName, setNewInstName] = useState('');
  const [newInstAbout, setNewInstAbout] = useState('');
  const [newInstSpec, setNewInstSpec] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [instFormSuccess, setInstFormSuccess] = useState('');
  const [instFormError, setInstFormError] = useState('');
  const fileInputRef = useRef(null);

  // Module Form State
  const [modName, setModName] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modOrder, setModOrder] = useState(1);
  const [modFile, setModFile] = useState(null);
  const [editingModId, setEditingModId] = useState(null);
  const [modFormSuccess, setModFormSuccess] = useState('');
  const [modFormError, setModFormError] = useState('');
  const modFileInputRef = useRef(null);

  // Slot Form State
  const [slotDays, setSlotDays] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [slotStatus, setSlotStatus] = useState('Active');
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotFormSuccess, setSlotFormSuccess] = useState('');
  const [slotFormError, setSlotFormError] = useState('');

  // Assign modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignSlot, setAssignSlot] = useState('');
  const [assignInst, setAssignInst] = useState('');

  const token = localStorage.getItem('adminToken');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchAdmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admissions/`, { headers });
      const data = await res.json();
      setAdmissions(data);
    } catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students/`, { headers });
      const data = await res.json();
      setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchInstructors = async () => {
    try {
      const res = await fetch(`${API_BASE}/instructors/`, { headers });
      const data = await res.json();
      setInstructors(data);
    } catch (e) { console.error(e); }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/modules/`);
      const data = await res.json();
      setModules(data);
    } catch (e) { console.error(e); }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_BASE}/slots/`);
      const data = await res.json();
      setSlots(data);
    } catch (e) { console.error(e); }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/contact/`, { headers });
      const data = await res.json();
      setContacts(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    fetchInstructors();
    fetchSlots();
    if (activeTab === 'admissions') fetchAdmissions();
    if (activeTab === 'students') { fetchStudents(); fetchInstructors(); fetchSlots(); }
    if (activeTab === 'instructors') fetchInstructors();
    if (activeTab === 'modules') fetchModules();
    if (activeTab === 'slots') fetchSlots();
    if (activeTab === 'contacts') fetchContacts();
  }, [activeTab]);

  const handleSendFeeEmail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/send-fee-email`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Fee email queued!");
      fetchAdmissions();
    } catch (e) { alert("Failed to send fee email"); }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/approve`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Admission Approved! Student record created.");
      fetchAdmissions();
      fetchStats();
    } catch (e) { alert("Failed to approve"); }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/cancel`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Admission Canceled.");
      fetchAdmissions();
      fetchStats();
    } catch (e) { alert("Failed to cancel"); }
  };

  const handleAddOrUpdateInstructor = async (e) => {
    e.preventDefault();
    setInstFormSuccess('');
    setInstFormError('');
    try {
      const formData = new FormData();
      formData.append('name', newInstName);
      formData.append('about', newInstAbout);
      formData.append('specialty', newInstSpec || newInstAbout);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const url = editingInstId ? `${API_BASE}/instructors/${editingInstId}` : `${API_BASE}/instructors/`;
      const method = editingInstId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save instructor.");

      setInstFormSuccess(editingInstId ? "Instructor updated successfully!" : "Instructor added successfully!");
      setNewInstName('');
      setNewInstAbout('');
      setNewInstSpec('');
      setSelectedFile(null);
      setEditingInstId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchInstructors();
      fetchStats();
    } catch (e) {
      console.error(e);
      setInstFormError("Failed to save instructor. Please try again.");
    }
  };

  const handleEditInstructorClick = (inst) => {
    setEditingInstId(inst._id || inst.id);
    setNewInstName(inst.name || '');
    setNewInstAbout(inst.about || inst.specialty || '');
    setNewInstSpec(inst.specialty || inst.about || '');
    setSelectedFile(null);
    setInstFormSuccess('');
    setInstFormError('');
  };

  const handleCancelEditInstructor = () => {
    setEditingInstId(null);
    setNewInstName('');
    setNewInstAbout('');
    setNewInstSpec('');
    setSelectedFile(null);
    setInstFormSuccess('');
    setInstFormError('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteInstructor = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/instructors/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      fetchInstructors();
      fetchStats();
    } catch (e) { alert("Failed to delete instructor"); }
  };

  // Module Actions
  const handleAddOrUpdateModule = async (e) => {
    e.preventDefault();
    setModFormSuccess('');
    setModFormError('');
    try {
      const formData = new FormData();
      formData.append('name', modName);
      formData.append('description', modDesc);
      formData.append('order', modOrder);
      if (modFile) {
        formData.append('image', modFile);
      }

      const url = editingModId ? `${API_BASE}/modules/${editingModId}` : `${API_BASE}/modules/`;
      const method = editingModId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save module.");

      setModFormSuccess(editingModId ? "Module updated successfully!" : "Module added successfully!");
      setModName('');
      setModDesc('');
      setModOrder(1);
      setModFile(null);
      setEditingModId(null);
      if (modFileInputRef.current) modFileInputRef.current.value = "";
      fetchModules();
      fetchStats();
    } catch (e) {
      console.error(e);
      setModFormError("Failed to save module. Please try again.");
    }
  };

  const handleEditModuleClick = (mod) => {
    setEditingModId(mod._id || mod.id);
    setModName(mod.name || '');
    setModDesc(mod.description || '');
    setModOrder(mod.order || 1);
    setModFile(null);
    setModFormSuccess('');
    setModFormError('');
  };

  const handleCancelEditModule = () => {
    setEditingModId(null);
    setModName('');
    setModDesc('');
    setModOrder(1);
    setModFile(null);
    setModFormSuccess('');
    setModFormError('');
    if (modFileInputRef.current) modFileInputRef.current.value = "";
  };

  const handleDeleteModule = async (id) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    try {
      const res = await fetch(`${API_BASE}/modules/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      fetchModules();
      fetchStats();
    } catch (e) { alert("Failed to delete module"); }
  };

  // Slot Actions
  const handleAddOrUpdateSlot = async (e) => {
    e.preventDefault();
    setSlotFormSuccess('');
    setSlotFormError('');
    try {
      const formData = new FormData();
      formData.append('days', slotDays);
      formData.append('time', slotTime);
      formData.append('status', slotStatus);

      const url = editingSlotId ? `${API_BASE}/slots/${editingSlotId}` : `${API_BASE}/slots/`;
      const method = editingSlotId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save slot.");

      setSlotFormSuccess(editingSlotId ? "Slot updated successfully!" : "Slot added successfully!");
      setSlotDays('');
      setSlotTime('');
      setSlotStatus('Active');
      setEditingSlotId(null);
      fetchSlots();
      fetchStats();
    } catch (e) {
      console.error(e);
      setSlotFormError("Failed to save slot. Please try again.");
    }
  };

  const handleEditSlotClick = (slotItem) => {
    setEditingSlotId(slotItem._id || slotItem.id);
    setSlotDays(slotItem.days || '');
    setSlotTime(slotItem.time || '');
    setSlotStatus(slotItem.status || 'Active');
    setSlotFormSuccess('');
    setSlotFormError('');
  };

  const handleCancelEditSlot = () => {
    setEditingSlotId(null);
    setSlotDays('');
    setSlotTime('');
    setSlotStatus('Active');
    setSlotFormSuccess('');
    setSlotFormError('');
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    try {
      const res = await fetch(`${API_BASE}/slots/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      fetchSlots();
      fetchStats();
    } catch (e) { alert("Failed to delete slot"); }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/students/${selectedStudent._id}/assign?slot=${encodeURIComponent(assignSlot)}&instructor=${encodeURIComponent(assignInst)}`, {
        method: 'PATCH',
        headers
      });
      if (!res.ok) throw new Error();
      alert("Slot & Instructor assigned! Email sent to student.");
      setSelectedStudent(null);
      fetchStudents();
    } catch (e) { alert("Failed to assign"); }
  };

  const tableHeaderStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-primary)', textAlign: 'left' };
  const tableCellStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e0e0e0' };

  return (
    <div className="admin-layout">
      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <h3 style={{ color: 'var(--color-white)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }} className="gradient-text">LMS Panel</h3>
        <button className="glass-panel" style={{ padding: '6px 12px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff6b6b', fontSize: '0.85rem' }} onClick={onLogout}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Mobile Horizontal Tab Navigation */}
      <div className="admin-mobile-tab-bar no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'admissions', label: 'Admissions' },
          { id: 'students', label: 'Students' },
          { id: 'instructors', label: 'Instructors' },
          { id: 'modules', label: 'Modules' },
          { id: 'slots', label: 'Slots' },
          { id: 'contacts', label: 'Messages' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <div className="admin-sidebar">
        <h3 style={{ color: 'var(--color-white)', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }} className="gradient-text">LMS Panel</h3>
        <button className={activeTab === 'overview' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'admissions' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('admissions')}>Admissions</button>
        <button className={activeTab === 'students' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('students')}>Students</button>
        <button className={activeTab === 'instructors' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('instructors')}>Instructors</button>
        <button className={activeTab === 'modules' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('modules')}>Modules</button>
        <button className={activeTab === 'slots' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('slots')}>Slots</button>
        <button className={activeTab === 'contacts' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('contacts')}>Messages</button>

        <button className="glass-panel" style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b6b' }} onClick={onLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Main Admin Area */}
      <div className="admin-content-area">
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Institute Overview</h2>
            <div className="stats-cards-grid">
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Total Forms</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-white)' }}>{stats.total}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #f39c12' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Pending</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#f39c12' }}>{stats.pending}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #2ecc71' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Approved</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#2ecc71' }}>{stats.approved}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #e74c3c' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Canceled</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#e74c3c' }}>{stats.canceled}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--color-primary)' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Active Students</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats.total_students}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--color-accent)' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Active Instructors</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{instructors.length}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #3498db' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Class Slots</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#3498db' }}>{stats.total_slots || slots.length || 0}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #9b59b6' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Modules</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#9b59b6' }}>{stats.total_modules || 0}</p>
              </div>
            </div>

            {/* Active Instructors & Assigned Classes Breakdown */}
            <div style={{ marginTop: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
                Active Instructors & Class Workload Breakdown
              </h3>

              {instructors.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
                  No active instructors registered yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {instructors.map(inst => {
                    const slotMap = {};
                    if (inst.students && inst.students.length > 0) {
                      inst.students.forEach(s => {
                        const sSlot = s.slot || 'Unassigned Slot';
                        if (!slotMap[sSlot]) slotMap[sSlot] = [];
                        slotMap[sSlot].push(s.name);
                      });
                    }

                    const assignedSlotsCount = Object.keys(slotMap).length;

                    return (
                      <div key={inst._id || inst.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(197, 229, 232, 0.15)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <img
                            src={getAvatarUrl(inst.avatar, inst.name)}
                            alt={inst.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-bg-dark)' }}
                          />
                          <div>
                            <h4 style={{ color: 'var(--color-white)', fontSize: '1.1rem', fontWeight: '600' }}>{inst.name}</h4>
                            <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{inst.specialty || inst.about || 'Arabic Instructor'}</p>
                          </div>
                          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{inst.total_students || 0}</span>
                            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Students</div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e0e0e0', marginBottom: '0.5rem' }}>
                            Assigned Classes ({assignedSlotsCount})
                          </div>
                          {assignedSlotsCount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {Object.entries(slotMap).map(([slotName, studentList], idx) => (
                                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)', fontWeight: '500', marginBottom: '4px' }}>
                                    <span>• {slotName}</span>
                                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{studentList.length} Student{studentList.length > 1 ? 's' : ''}</span>
                                  </div>
                                  <div style={{ color: '#aaa', fontSize: '0.8rem', paddingLeft: '0.8rem' }}>
                                    {studentList.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#666', fontSize: '0.85rem', italic: 'true' }}>No active class assignments yet</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admissions' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Admission Forms</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map(adm => (
                    <tr key={adm._id}>
                      <td style={tableCellStyle}>{adm.first_name} {adm.last_name}</td>
                      <td style={tableCellStyle}>{adm.email}</td>
                      <td style={tableCellStyle}>{adm.phone}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          background: adm.status === 'Approved' ? 'rgba(46, 204, 113, 0.2)' : adm.status === 'Canceled' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(243, 156, 18, 0.2)',
                          color: adm.status === 'Approved' ? '#2ecc71' : adm.status === 'Canceled' ? '#e74c3c' : '#f39c12'
                        }}>{adm.status}</span>
                      </td>
                      <td style={tableCellStyle}>
                        {adm.status === 'Pending' && (
                          <button onClick={() => handleSendFeeEmail(adm._id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '8px' }}>Send Fee Info</button>
                        )}
                        {adm.status === 'Fee Email Sent' && (
                          <button onClick={() => handleApprove(adm._id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '8px', background: '#2e7d32' }}>Approve (Paid)</button>
                        )}
                        {adm.status !== 'Approved' && adm.status !== 'Canceled' && (
                          <button onClick={() => handleCancel(adm._id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Active Students</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Slot</th>
                    <th style={tableHeaderStyle}>Instructor</th>
                    <th style={tableHeaderStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(std => (
                    <tr key={std._id}>
                      <td style={tableCellStyle}>{std.first_name} {std.last_name}</td>
                      <td style={tableCellStyle}>{std.email}</td>
                      <td style={tableCellStyle}>{std.phone}</td>
                      <td style={tableCellStyle}>{std.slot || <span style={{ color: '#777' }}>Not Assigned</span>}</td>
                      <td style={tableCellStyle}>{std.instructor || <span style={{ color: '#777' }}>Not Assigned</span>}</td>
                      <td style={tableCellStyle}>
                        <button onClick={() => setSelectedStudent(std)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Assign/Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assign Modal Overlay */}
            {selectedStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '400px', width: '90%' }}>
                  <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem' }}>Assign Class Details</h3>
                  <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Student: {selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Select Slot/Time</label>
                      <select required value={assignSlot} onChange={e => setAssignSlot(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                        <option value="" disabled>Choose Slot...</option>
                        {slots.filter(s => s.status === 'Active' || (selectedStudent && selectedStudent.slot && (selectedStudent.slot === `${s.days} — ${s.time}` || selectedStudent.slot === `${s.days} ${s.time}`))).map(s => {
                          const val = `${s.days} — ${s.time}`;
                          return <option key={s._id || s.id} value={val}>{val}</option>;
                        })}
                        {selectedStudent && selectedStudent.slot && !slots.some(s => `${s.days} — ${s.time}` === selectedStudent.slot || `${s.days} ${s.time}` === selectedStudent.slot) && (
                          <option value={selectedStudent.slot}>{selectedStudent.slot} (Current)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Select Instructor</label>
                      <select required value={assignInst} onChange={e => setAssignInst(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                        <option value="" disabled>Choose Instructor...</option>
                        {instructors.map(inst => (
                          <option key={inst._id} value={inst.name}>{inst.name} ({inst.specialty})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Confirm</button>
                      <button type="button" onClick={() => setSelectedStudent(null)} className="glass-panel" style={{ flex: 1, padding: '12px', border: 'none' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructors' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem' }}>Instructors Management</h2>

            {/* Instructor Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                {editingInstId ? 'Edit Instructor' : 'Add New Instructor'}
              </h3>
              {instFormSuccess && <p style={{ color: '#2ecc71', marginBottom: '1rem' }}>{instFormSuccess}</p>}
              {instFormError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{instFormError}</p>}

              <form onSubmit={handleAddOrUpdateInstructor} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Instructor Name *</label>
                    <input type="text" placeholder="e.g. Ustadh Ahmed" value={newInstName} onChange={e => setNewInstName(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Specialty / Role</label>
                    <input type="text" placeholder="e.g. Grammar & Morphology" value={newInstSpec} onChange={e => setNewInstSpec(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>About / Description</label>
                  <textarea placeholder="Experienced Arabic language instructor specializing in grammar and morphology." value={newInstAbout} onChange={e => setNewInstAbout(e.target.value)} rows="3" style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Profile Picture (File Upload)</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} style={{ color: '#e0e0e0', padding: '8px 0' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {editingInstId ? 'Update Instructor' : 'Add Instructor'}
                  </button>
                  {editingInstId && (
                    <button type="button" onClick={handleCancelEditInstructor} className="glass-panel" style={{ padding: '12px 20px', border: 'none', color: '#e0e0e0' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Picture</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>About / Specialty</th>
                    <th style={tableHeaderStyle}>Active Slots / Students</th>
                    <th style={tableHeaderStyle}>Total Students</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map(inst => (
                    <tr key={inst._id || inst.id}>
                      <td style={tableCellStyle}>
                        <img src={getAvatarUrl(inst.avatar, inst.name)} alt={inst.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-bg-dark)' }} />
                      </td>
                      <td style={tableCellStyle}><strong>{inst.name}</strong></td>
                      <td style={tableCellStyle}>
                        <div>{inst.about || inst.specialty || '-'}</div>
                        {inst.specialty && inst.about && inst.specialty !== inst.about && (
                          <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>{inst.specialty}</div>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                          {inst.students && inst.students.length > 0 ? (
                            inst.students.map((s, idx) => (
                              <span key={idx} style={{ color: '#b0c4c6' }}>
                                • {s.slot}: {s.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#666' }}>No active assignments</span>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{inst.total_students || 0}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditInstructorClick(inst)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Edit</button>
                          <button onClick={() => handleDeleteInstructor(inst._id || inst.id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Modules / Arabic Levels</h2>

            {/* Module Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                {editingModId ? 'Edit Module' : 'Add New Module'}
              </h3>
              {modFormSuccess && <p style={{ color: '#2ecc71', marginBottom: '1rem' }}>{modFormSuccess}</p>}
              {modFormError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{modFormError}</p>}

              <form onSubmit={handleAddOrUpdateModule} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '220px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Module / Level Name *</label>
                    <input type="text" placeholder="e.g. A1 or Arabic for Quran" value={modName} onChange={e => setModName(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Display Order</label>
                    <input type="number" min="1" placeholder="1" value={modOrder} onChange={e => setModOrder(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Description / About *</label>
                  <textarea placeholder="Beginner Arabic level designed for students starting their learning journey." value={modDesc} onChange={e => setModDesc(e.target.value)} required rows="3" style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Optional Module Image/Icon (File Upload)</label>
                  <input ref={modFileInputRef} type="file" accept="image/*" onChange={e => setModFile(e.target.files[0])} style={{ color: '#e0e0e0', padding: '8px 0' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {editingModId ? 'Update Module' : 'Add Module'}
                  </button>
                  {editingModId && (
                    <button type="button" onClick={handleCancelEditModule} className="glass-panel" style={{ padding: '12px 20px', border: 'none', color: '#e0e0e0' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Order</th>
                    <th style={tableHeaderStyle}>Icon/Image</th>
                    <th style={tableHeaderStyle}>Module Name</th>
                    <th style={tableHeaderStyle}>Description</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(mod => (
                    <tr key={mod._id || mod.id}>
                      <td style={tableCellStyle}><strong>#{mod.order || 1}</strong></td>
                      <td style={tableCellStyle}>
                        {mod.image ? (
                          <img src={getAvatarUrl(mod.image, mod.name)} alt={mod.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-primary)', color: 'var(--color-bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {mod.name.substring(0, 2)}
                          </div>
                        )}
                      </td>
                      <td style={tableCellStyle}><strong>{mod.name}</strong></td>
                      <td style={tableCellStyle}>{mod.description}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditModuleClick(mod)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Edit</button>
                          <button onClick={() => handleDeleteModule(mod._id || mod.id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'slots' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem' }}>Class Slots Management</h2>

            {/* Slot Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                {editingSlotId ? 'Edit Class Slot' : 'Add New Class Slot'}
              </h3>
              {slotFormSuccess && <p style={{ color: '#2ecc71', marginBottom: '1rem' }}>{slotFormSuccess}</p>}
              {slotFormError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{slotFormError}</p>}

              <form onSubmit={handleAddOrUpdateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Day(s) *</label>
                    <input type="text" placeholder="e.g. Monday & Wednesday" value={slotDays} onChange={e => setSlotDays(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Time *</label>
                    <input type="text" placeholder="e.g. 6:00 PM" value={slotTime} onChange={e => setSlotTime(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Status *</label>
                    <select value={slotStatus} onChange={e => setSlotStatus(e.target.value)} style={{ ...inputStyle, width: '100%', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {editingSlotId ? 'Update Slot' : 'Add Slot'}
                  </button>
                  {editingSlotId && (
                    <button type="button" onClick={handleCancelEditSlot} className="glass-panel" style={{ padding: '12px 20px', border: 'none', color: '#e0e0e0' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Days</th>
                    <th style={tableHeaderStyle}>Time</th>
                    <th style={tableHeaderStyle}>Full Slot String</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s._id || s.id}>
                      <td style={tableCellStyle}><strong>{s.days}</strong></td>
                      <td style={tableCellStyle}>{s.time}</td>
                      <td style={tableCellStyle}><span style={{ color: 'var(--color-primary)' }}>{s.days} — {s.time}</span></td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          background: s.status === 'Active' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                          color: s.status === 'Active' ? '#2ecc71' : '#e74c3c'
                        }}>{s.status || 'Active'}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditSlotClick(s)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Edit</button>
                          <button onClick={() => handleDeleteSlot(s._id || s.id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Contact Messages</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Sender Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Message</th>
                    <th style={tableHeaderStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c._id}>
                      <td style={tableCellStyle}>{c.first_name} {c.last_name}</td>
                      <td style={tableCellStyle}>{c.email}</td>
                      <td style={tableCellStyle}>{c.message}</td>
                      <td style={tableCellStyle}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(197, 229, 232, 0.3)',
  background: 'rgba(0,0,0,0.2)',
  color: 'var(--color-white)',
  fontSize: '1rem',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color 0.3s'
};

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!localStorage.getItem('adminToken'));
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  const handleAdminLogin = () => setIsAdminLoggedIn(true);
  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminLoggedIn(false);
  };

  return (
    <Router>
      <div className="app-container">
        {!isAdminRoute && (
          <div style={{ position: 'fixed', top: '1rem', left: '0', right: '0', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '90%', maxWidth: '1200px' }}>
              <Navbar />
            </div>
          </div>
        )}

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: isAdminRoute ? '2rem' : '8rem', paddingLeft: isAdminRoute ? '2rem' : '0', paddingRight: isAdminRoute ? '2rem' : '0' }}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admission" element={<Admission />} />
              <Route
                path="/admin"
                element={isAdminLoggedIn ? <AdminDashboard onLogout={handleAdminLogout} /> : <AdminLogin onLogin={handleAdminLogin} />}
              />
            </Routes>
          </AnimatePresence>
        </main>

        {!isAdminRoute && (
          <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem', textAlign: 'center', color: '#888', marginTop: 'auto' }}>
            <p>© 2026 AlArabia Fi Buyutikum. All rights reserved.</p>
          </footer>
        )}
      </div>
    </Router>
  );
}

export default App;
