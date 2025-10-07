import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './MapView';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import ProtectedRoute from './components/ProtectedRoute';

function HeaderBar() {
  const { token, role, logout } = useAuth();
  return (
    <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h1 style={{ margin: 0 }}>Urban Near Miss Mapper</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {token ? (
          <>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>Role: {role}</span>
            <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #374151', background: '#111827', color: '#e5e7eb' }}>Logout</button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/login" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>Sign In</a>
            <a href="/signup" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>Sign Up</a>
          </div>
        )}
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <HeaderBar />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </main>
          <footer>
            <p>© {new Date().getFullYear()} Urban Near Miss Mapper</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
