import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inputStyle } from '../../components/common/styles';

export function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const userData = await login(username, password);
      if (userData.role !== 'admin') {
        logout();
        setError(`Access Denied: This account has '${userData.role}' privileges. Only administrators are authorized to access the Admin Dashboard.`);
        return;
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <Lock size={48} color="var(--color-primary)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }} className="gradient-text">Admin Portal</h2>
        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
          <div>
            <label htmlFor="admin_username" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#b0c4c6' }}>
              Username or Email
            </label>
            <input
              id="admin_username"
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="admin_password" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#b0c4c6' }}>
              Password
            </label>
            <input
              id="admin_password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '14px', fontSize: '1rem', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
