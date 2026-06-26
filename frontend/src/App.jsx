import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Globe2, Sparkles, ArrowRight, Send, Users, Star, Mail, Phone, MapPin, ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import './index.css';

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
          <div style={{ minWidth: '36px', width: '36px', height: '36px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ color: 'var(--color-bg-dark)', fontWeight: 'bold', fontFamily: 'var(--font-arabic)' }}>ع</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: '700', whiteSpace: 'nowrap' }} className="gradient-text">AlArabia Fi Buyutikum</h1>
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
  const instructors = [
    { id: 1, name: 'Ustadh Ahmed', specialty: 'Grammar & Morphology', avatar: 'https://ui-avatars.com/api/?name=Ustadh+Ahmed&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true' },
    { id: 2, name: 'Ustadh Bilal', specialty: 'Conversational Arabic', avatar: 'https://ui-avatars.com/api/?name=Ustadh+Bilal&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true' },
    { id: 3, name: 'Ustadha Fatima', specialty: 'Quranic Arabic', avatar: 'https://ui-avatars.com/api/?name=Ustadha+Fatima&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true' },
    { id: 4, name: 'Ustadh Omar', specialty: 'Advanced Literature', avatar: 'https://ui-avatars.com/api/?name=Ustadh+Omar&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true' },
    { id: 5, name: 'Ustadha Aisha', specialty: 'Tajweed', avatar: 'https://ui-avatars.com/api/?name=Ustadha+Aisha&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true' },
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
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction) => {
    if (direction === 'left') {
      setStartIndex(Math.max(0, startIndex - 1));
    } else {
      setStartIndex(Math.min(instructors.length - itemsToShow, startIndex + 1));
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

      {/* Dynamic Instructors Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <Users size={40} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Our Expert Instructors</h2>
          <p style={{ color: '#e0e0e0', maxWidth: '600px', margin: '0 auto' }}>Learn from the best. Our team is constantly growing to bring you diverse expertise.</p>
        </div>
        
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
                  key={instructor.id}
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
                    <img src={instructor.avatar} alt={instructor.name} style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'block', background: 'var(--color-bg-dark)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--color-white)', fontWeight: '600' }}>{instructor.name}</h3>
                  <p style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>{instructor.specialty}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => scroll('right')}
            disabled={startIndex >= instructors.length - itemsToShow}
            className="glass-panel"
            style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: startIndex >= instructors.length - itemsToShow ? 'not-allowed' : 'pointer', border: '1px solid var(--color-primary)', background: 'var(--color-bg-dark)', opacity: startIndex >= instructors.length - itemsToShow ? 0.3 : 1 }}
          >
            <ChevronRight color="var(--color-primary)" />
          </button>
        </div>
      </section>

      {/* Dynamic Reviews Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <Star size={40} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '8rem 2rem 5rem', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '2rem' }} className="gradient-text">About Us</h2>
      <p style={{ fontSize: '1.2rem', color: '#e0e0e0', marginBottom: '2rem', lineHeight: '1.8' }}>
        AlArabia Fi Buyutikum (Arabic in Your Homes) was founded with a singular vision: to make the majestic Arabic language accessible to everyone, everywhere. We believe that learning Arabic shouldn't be confined to traditional classrooms or limited by geographical boundaries.
      </p>
      <p style={{ fontSize: '1.2rem', color: '#e0e0e0', marginBottom: '4rem', lineHeight: '1.8' }}>
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
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '8rem 2rem 5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">Contact Us</h2>
        <p style={{ color: '#e0e0e0', fontSize: '1.2rem' }}>We'd love to hear from you. Reach out with any questions.</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'center' }}>
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Mail size={32} color="var(--color-primary)" />
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>Email</h4>
              <p style={{ color: '#b0c4c6' }}>info@alarabiafibuyutikum.com</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Phone size={32} color="var(--color-primary)" />
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>Phone</h4>
              <p style={{ color: '#b0c4c6' }}>+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <MapPin size={32} color="var(--color-primary)" />
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: '1.2rem', marginBottom: '0.2rem' }}>Location</h4>
              <p style={{ color: '#b0c4c6' }}>Global Online Institute</p>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: '2', minWidth: '350px', padding: '3rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <input type="text" placeholder="First Name" required style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid rgba(197, 229, 232, 0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-white)', outline: 'none' }} />
              <input type="text" placeholder="Last Name" required style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid rgba(197, 229, 232, 0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-white)', outline: 'none' }} />
            </div>
            <input type="email" placeholder="Email Address" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(197, 229, 232, 0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-white)', outline: 'none' }} />
            <textarea placeholder="Your Message" rows="5" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(197, 229, 232, 0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-white)', outline: 'none', resize: 'vertical' }}></textarea>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              Send Message <Send size={18} />
            </button>
          </form>
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
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for applying! Our team will contact you soon regarding your admission.');
  };

  const courseOptions = [
    { value: 'grammar', label: 'Grammar & Morphology' },
    { value: 'conversational', label: 'Conversational Arabic' },
    { value: 'quranic', label: 'Quranic Arabic' },
    { value: 'advanced', label: 'Advanced Literature' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '4rem 3rem', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <Sparkles size={48} color="var(--color-primary)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }} className="gradient-text">Admission Form</h2>
        <p style={{ color: '#b0c4c6', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Take the first step towards mastering Arabic. Fill out the form below to apply for our courses.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" placeholder="First Name" required style={inputStyle} />
            <input type="text" placeholder="Last Name" required style={inputStyle} />
          </div>
          <input type="email" placeholder="Email Address" required style={inputStyle} />
          <input type="tel" placeholder="Phone Number" required style={inputStyle} />
          <CustomSelect options={courseOptions} placeholder="Select a Course of Interest" />
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '16px', fontSize: '1.1rem', marginTop: '1rem' }}>
            Submit Application <Send size={20} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

const inputStyle = {
  flex: 1,
  padding: '16px',
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
  return (
    <Router>
      <div className="app-container">
        <div style={{ position: 'fixed', top: '1rem', left: '0', right: '0', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '1200px' }}>
            <Navbar />
          </div>
        </div>
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '8rem' }}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admission" element={<Admission />} />
            </Routes>
          </AnimatePresence>
        </main>

        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem', textAlign: 'center', color: '#888', marginTop: 'auto' }}>
          <p>© 2026 AlArabia Fi Buyutikum. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
