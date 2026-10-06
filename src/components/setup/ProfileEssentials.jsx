import React from 'react';

export default function ProfileEssentials({ biography, onChange }) {
  return <section className="mt-7">
    <label className="block text-sm font-semibold" style={{ color: '#1a1815' }}>A little about you</label>
    <p className="text-xs mt-1 mb-3" style={{ color: '#6b6358' }}>Your bio appears on your profile.</p>
    <textarea value={biography} onChange={e => onChange(e.target.value)} maxLength={280} rows={4} placeholder="The songs, artists or stories you want people to know…" className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#ffffff', border: '1px solid #e0d8c8', color: '#1a1815' }} />
  </section>;
}