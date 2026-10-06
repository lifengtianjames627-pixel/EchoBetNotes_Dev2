import React from 'react';
import { Link } from 'react-router-dom';

const V = { border: '#e0d8c8', muted: '#6b6358' };

export default function SiteFooter() {
  return (
    <footer className="px-5 py-6 mt-auto" style={{ borderTop: `1px solid ${V.border}`, background: '#ece5d6' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
        <Link to="/about" className="text-xs font-medium hover:underline" style={{ color: V.muted }}>About Us</Link>
        <span className="hidden sm:inline" style={{ color: V.border }}>·</span>
        <Link to="/privacy" className="text-xs font-medium hover:underline" style={{ color: V.muted }}>Privacy</Link>
        <span className="hidden sm:inline" style={{ color: V.border }}>·</span>
        <Link to="/terms" className="text-xs font-medium hover:underline" style={{ color: V.muted }}>Terms of Service</Link>
        <p className="text-[11px] sm:ml-auto" style={{ color: V.muted }}>Echo Between Notes · made by music lovers</p>
      </div>
    </footer>
  );
}