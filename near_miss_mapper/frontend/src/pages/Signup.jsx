import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';
import { Mail, Lock } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email_or_phone: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await signup(form);
      setSuccess('Account created successfully. Please sign in.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to sign up');
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
      flex: '1 1 auto'
    }}>
      <div style={{ width: 460, background: '#ffffff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color:'#111827'}}>Create your account</div>
          <div style={{ color: '#6b7280', marginTop: 6 }}>Sign up to start contributing near-miss reports</div>
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
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="password"
                name="password"
                placeholder="Create a secure password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Default is User. Admins can get additional management actions in future.</div>
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 13, margin: '6px 0 10px' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a', fontSize: 13, margin: '6px 0 10px' }}>{success}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #111827', background: loading ? '#1f2937' : '#111827', color: '#fff', fontWeight: 700 }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 12, color: '#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
