import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkVeil from '../Reactbits/DarkVeil/DarkVeil';

export default function Landing() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const goMap = () => navigate('/map');
  const goToSignup = () => navigate('/signup');
  const goToLogin = () => navigate('/login');

  return (
    <div style={{
      
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 'auto',
      height: 'auto',
      width: '100vw'}}>
      
      <div style={{
        width: 'min(880px, 92vw)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
      
        gap: 24,
        background: '#111827',
        borderRadius: 16,
        padding: 24,
        color: '#e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
      }}>
        <div>
          <h2 style={{ margin: '4px 0 8px', fontSize: 32,textAlign: 'center' }}>Urban Near Miss Mapper</h2>
          <p style={{ margin: 0, color: '#9ca3af' }}>Report and visualize near‑miss incidents to make cities safer.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!token ? (
            <>
              <button onClick={goToSignup} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #2563eb', background: '#2563eb', color: 'white', fontWeight: 700 }}>Sign Up</button>
              <button onClick={goToLogin} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #374151', background: '#111827', color: '#e5e7eb', fontWeight: 700 }}>Sign In</button>
            </>
          ) : (
            <button onClick={goMap} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #22c55e', background: '#22c55e', color: 'white', fontWeight: 700 }}>Go to Map</button>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#9ca3af' }}>Secure • Professional • Ready for Action</div>
      </div>
    </div>
  );
}