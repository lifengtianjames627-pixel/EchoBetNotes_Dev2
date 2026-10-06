import React from 'react';
import { Music, Plus } from 'lucide-react';

// Shown when a genre has no albums/singles yet — never a blank page.
export default function GenreEmptyState({ label, accent, onAdd }) {
  return (
    <div className="py-16 text-center" style={{ background: '#faf8f2', border: '1px dashed #e0d9c8' }}>
      <Music className="mx-auto h-7 w-7" style={{ color: accent, opacity: 0.6 }} />
      <p className="mt-4 font-playfair text-2xl italic" style={{ color: '#1a1815' }}>No reviews yet</p>
      <p className="mt-2 text-sm" style={{ color: '#5a5a5a' }}>Be the first to add a {label} record and start the conversation.</p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ background: '#1a1815', color: '#ffffff' }}
        >
          <Plus className="h-3.5 w-3.5" /> Add a record
        </button>
      )}
    </div>
  );
}