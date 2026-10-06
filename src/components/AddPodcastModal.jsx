import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PODCAST_CATEGORIES } from '@/lib/podcastConfig';

export default function AddPodcastModal({ defaultCategory, onClose, onSubmit, isPending }) {
  const [data, setData] = useState({
    title: '', host_name: '', category: defaultCategory || PODCAST_CATEGORIES[0].id,
    description: '', cover_url: '', audio_url: '', duration_minutes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...data, duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : undefined });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-md rounded-2xl p-6 space-y-3"
        style={{ background: 'rgba(10,12,30,0.98)', border: '1px solid rgba(124,111,255,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-base" style={{ color: 'rgba(220,225,255,0.9)' }}>Submit an Episode</p>
          <button type="button" onClick={onClose} style={{ color: 'rgba(140,155,210,0.6)' }}><X className="w-5 h-5" /></button>
        </div>

        <input required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          placeholder="Episode title" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />

        <input required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          placeholder="Host / creator name" value={data.host_name} onChange={e => setData({ ...data, host_name: e.target.value })} />

        <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
          {PODCAST_CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.label}</option>)}
        </select>

        <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          placeholder="Short description" value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />

        <input className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          placeholder="Cover image URL (optional)" value={data.cover_url} onChange={e => setData({ ...data, cover_url: e.target.value })} />

        <input required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          placeholder="Audio link (URL)" value={data.audio_url} onChange={e => setData({ ...data, audio_url: e.target.value })} />

        <input type="number" min="1" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.2)', color: 'rgba(220,225,255,0.9)' }}
          placeholder="Duration in minutes (optional)" value={data.duration_minutes} onChange={e => setData({ ...data, duration_minutes: e.target.value })} />

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(124,111,255,0.2)', color: '#a5b4fc', border: '1px solid rgba(124,111,255,0.3)', opacity: isPending ? 0.6 : 1 }}>
            {isPending ? 'Submitting…' : 'Submit Episode'}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm" style={{ color: 'rgba(140,155,210,0.5)' }}>Cancel</button>
        </div>
      </motion.form>
    </motion.div>
  );
}