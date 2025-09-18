import React from 'react';

/**
 * Floating pill button to open the Report Incident form
 * Usage: <ReportButton onClick={() => {...}} />
 */
export default function ReportButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Report Incident"
      title="Report Incident"
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 9999,
        border: '1px solid rgba(255,255,255,0.12)',
        background: '#111827',
        color: '#F9FAFB',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        zIndex: 1100
      }}
    >
      {/* Paper plane icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.44 2.56a1 1 0 0 0-1.06-.23L3.9 8.47a1 1 0 0 0 .06 1.88l7.12 2.37 2.37 7.12a1 1 0 0 0 1.88.06l6.14-16.48a1 1 0 0 0-.03-.88ZM14.3 20.33l-1.88-5.64 5.64-5.64-3.76 9.92ZM5.42 9.42l12.02-4.49-7.5 7.5-4.52-1.48Z" fill="#F9FAFB"/>
      </svg>
      <span style={{ fontWeight: 600 }}>Report Incident</span>
    </button>
  );
}
