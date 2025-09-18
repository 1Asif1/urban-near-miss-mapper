import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './MapView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>Urban Near Miss Mapper</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MapView />} />
          </Routes>
        </main>
        <footer>
          <p>© {new Date().getFullYear()} Urban Near Miss Mapper</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
