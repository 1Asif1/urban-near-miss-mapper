import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';
import { House, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ email_or_phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await login(form);
      setAuth({ token: res.access_token, role: res.role, userId: null });
      const from = location.state?.from?.pathname || '/map';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      width: '100%',
      boxSizing: 'border-box',
      flex: '1 1 auto',
      
      
      //background: '#f5f7fb'
    }}>
      <div style={{ width: 420, background: '#ffffff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700,  color:'#111827'}}><House/> Welcome Back</div>
          <div style={{ color: '#6b7280', marginTop: 6 }}>Sign in to continue mapping risks and making cities safer</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Email / Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                name="email_or_phone"
                placeholder="Enter your email or phone number"
                value={form.email_or_phone}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}
              />
            </div>
          </div>
          {error && (
            <div style={{ color: '#dc2626', fontSize: 13, margin: '6px 0 10px' }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #111827', background: loading ? '#1f2937' : '#111827', color: '#fff', fontWeight: 700 }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 12, color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
          Secure • Simple • Fast
        </div>
      </div>
    </div>
  );
}
