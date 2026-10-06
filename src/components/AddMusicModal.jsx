import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TagPicker from '@/components/TagPicker';

export default function AddMusicModal({ v, type, onClose, onSubmit, isPending, errorMessage }) {
  const [data, setData] = useState({ title: '', artist: '', cover_url: '', mv_url: '', release_year: '', description: '', tags: [] });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(d => ({ ...d, cover_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...data, type, release_year: data.release_year ? Number(data.release_year) : undefined, tags: data.tags });
  };

  const inp = "w-full px-3 py-2 rounded-lg text-sm outline-none";
  const inpStyle = { background: 'rgba(255,255,255,0.06)', border: `1px solid ${v.accent}30`, color: v.text };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ background: v.cardBg, border: `1px solid ${v.accent}40`, boxShadow: `0 0 40px ${v.accentGlow}` }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold" style={{ color: v.text }}>Add {type === 'single' ? 'Single' : 'Album'}</h3>
            <button onClick={onClose} style={{ color: v.muted }}><X className="w-5 h-5" /></button>
          </div>
          <p className="text-xs mb-5" style={{ color: `${v.muted}80` }}>
            Tracklist will be fetched automatically from MusicBrainz once added.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>Title *</label>
              <input className={inp} style={inpStyle} value={data.title} onChange={e => setData({ ...data, title: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>Artist *</label>
              <input className={inp} style={inpStyle} value={data.artist} onChange={e => setData({ ...data, artist: e.target.value })} required />
            </div>

            {/* Cover image upload */}
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>
                Cover Picture
                <span className="ml-1 normal-case font-normal opacity-60">(optional — auto-fetched if left empty)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <div
                className="w-full rounded-xl overflow-hidden cursor-pointer flex items-center justify-center transition-all"
                style={{ height: data.cover_url ? 'auto' : 100, border: `1.5px dashed ${v.accent}40`, background: 'rgba(255,255,255,0.04)' }}
                onClick={() => fileRef.current.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: v.accent }} />
                    <span className="text-xs" style={{ color: v.muted }}>Uploading…</span>
                  </div>
                ) : data.cover_url ? (
                  <div className="relative w-full">
                    <img src={data.cover_url} alt="cover" className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <span className="text-xs font-semibold text-white">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <ImageIcon className="w-6 h-6" style={{ color: v.muted }} />
                    <span className="text-xs" style={{ color: v.muted }}>Click to upload cover</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>Release Year</label>
              <input type="number" className={inp} style={inpStyle} value={data.release_year} onChange={e => setData({ ...data, release_year: e.target.value })} placeholder="2024" />
            </div>

            {type === 'single' && (
              <div>
                <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>
                  Music Video Link
                  <span className="ml-1 normal-case font-normal opacity-60">(YouTube recommended)</span>
                </label>
                <input className={inp} style={inpStyle} value={data.mv_url} onChange={e => setData({ ...data, mv_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>Description</label>
              <textarea className={`${inp} resize-none`} style={inpStyle} rows={2} value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: v.muted }}>Tags <span className="normal-case font-normal opacity-60">(sub-genre, style…)</span></label>
              <TagPicker tags={data.tags} onChange={tags => setData({ ...data, tags })} v={v} />
            </div>

            {errorMessage && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(220,50,50,0.12)', color: '#ff6b6b', border: '1px solid rgba(220,50,50,0.25)' }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || uploading}
              className="w-full py-2.5 rounded-full text-sm font-semibold mt-2"
              style={{ background: v.accent, color: '#000', opacity: (isPending || uploading) ? 0.6 : 1, boxShadow: `0 0 16px ${v.accentGlow}` }}
            >
              {isPending ? 'Adding…' : `Add ${type === 'single' ? 'Single' : 'Album'}`}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}