import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }} className="navbar-glass">
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
