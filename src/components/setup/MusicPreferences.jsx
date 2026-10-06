import React from 'react';

const OPTIONS = ['Rock', 'Pop', 'Classical', 'Metal', 'Jazz', 'Blues', 'R&B', 'Core', 'Country', 'Hip-hop', 'Indie', 'Grunge', 'Electronic', 'Funk', 'ACG', 'Cinematic'];

export default function MusicPreferences({ values, onToggle }) {
  return <section>
    <p className="text-sm font-semibold" style={{ color: '#1a1815' }}>What moves you?</p>
    <p className="text-xs mt-1" style={{ color: '#6b6358' }}>Choose the sounds you come back to.</p>
    <div className="flex flex-wrap gap-2 mt-3">
      {OPTIONS.map(item => <button key={item} type="button" onClick={() => onToggle(item)} className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors" style={values.includes(item) ? { background: '#f1ebdd', border: '1px solid #ddd0b6', color: '#8a5a20' } : { background: '#f5f2ea', border: '1px solid #e6ddc9', color: '#6b6358' }}>{item}</button>)}
    </div>
  </section>;
}