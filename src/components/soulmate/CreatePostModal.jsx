import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { findContactInfo } from '@/lib/contactFilter';
import SafetyNotice from '@/components/soulmate/SafetyNotice';
import { useLang } from '@/i18n/LanguageContext';
import recruitCopy from '@/features/soulmate/i18n/recruitCopy';
import PrivatePosterUpload from '@/features/soulmate/components/PrivatePosterUpload';

export const INSTRUMENTS = [
  'Vocals', 'Guitar', 'Lead Guitar', 'Bass', 'Drums', 'Keys',
  'Synth', 'Violin', 'Sax', 'Trumpet', 'DJ / Production',
];

const COMMITMENTS = [
  { id: 'casual', label: 'Just for fun' },
  { id: 'regular', label: 'Rehearsing regularly' },
  { id: 'serious', label: 'Serious about gigging' },
];

const EMPTY = {
  kind: 'band',
  title: '',
  band_name: '',
  poster_asset_id: '',
  city: '',
  school: '',
  looking_for: [],
  i_play: [],
  genre_tags: [],
  influences: '',
  commitment: 'casual',
  description: '',
};

const FIELD_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(124,111,255,0.2)',
  color: 'rgba(220,225,255,0.9)',
};

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
      style={active
        ? { background: 'rgba(124,111,255,0.25)', color: '#c4baff', border: '1px solid rgba(124,111,255,0.5)' }
        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(160,175,215,0.65)', border: '1px solid rgba(124,111,255,0.14)' }
      }
    >
      {children}
    </button>
  );
}

export default function CreatePostModal({ currentUser, onClose }) {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const copy = recruitCopy(lang);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState(null);

  const set = (patch) => setData(d => ({ ...d, ...patch }));
  const toggle = (field, value) => setData(d => ({
    ...d,
    [field]: d[field].includes(value) ? d[field].filter(v => v !== value) : [...d[field], value],
  }));



  const create = useMutation({
    mutationFn: async () => {
      setBlockedMsg(null);
      const allText = [data.title, data.band_name, data.description, data.influences, data.city, data.school]
        .filter(Boolean).join('\n');

      // Contact details must never appear on the board.
      const contact = findContactInfo(allText);
      if (contact.length > 0) {
        throw new Error(`CONTACT:${contact.join(', ')}`);
      }

      const response = await base44.functions.invoke('publishRecruitPost', { draft: data, agreed });
      return response.data.action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['recruit-posts'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-recruit'] });
      setSubmitted(true);
      if (action === 'review') {
        setBlockedMsg(copy.pending);
      } else {
        onClose();
      }
    },
    onError: (err) => {
      const code = err.response?.data?.error || err.message;
      setBlockedMsg(code === 'CONTACT' || code.startsWith('CONTACT:') ? copy.contact
        : code === 'MODERATION' ? copy.blocked : copy.failed);
    },
  });

  const canSubmit = data.title.trim() && agreed && !uploading && !create.isPending && !submitted;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ background: 'rgba(10,13,32,0.98)', border: '1px solid rgba(124,111,255,0.28)', boxShadow: '0 0 60px rgba(124,111,255,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: 'rgba(10,13,32,0.98)', borderBottom: '1px solid rgba(124,111,255,0.15)' }}>
          <p className="font-playfair italic text-xl" style={{ color: '#e8e9ff' }}>Put up a poster</p>
          <button onClick={onClose} style={{ color: 'rgba(140,155,210,0.55)' }}><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-6 pt-4 space-y-4">
          <SafetyNotice compact />

          {/* Kind switch */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'band', label: "We're a band", desc: 'Looking for members' },
              { id: 'musician', label: "I'm a player", desc: 'Looking for a band' },
            ].map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => set({ kind: o.id })}
                className="px-3 py-2.5 rounded-2xl text-left transition-all"
                style={data.kind === o.id
                  ? { background: 'rgba(124,111,255,0.2)', border: '1px solid rgba(124,111,255,0.5)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.14)' }
                }
              >
                <p className="text-xs font-semibold" style={{ color: data.kind === o.id ? '#c4baff' : 'rgba(200,210,245,0.8)' }}>{o.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(140,155,210,0.55)' }}>{o.desc}</p>
              </button>
            ))}
          </div>

          <PrivatePosterUpload onChange={poster_asset_id => set({ poster_asset_id })} onUploading={setUploading} disabled={create.isPending || submitted} />

          {data.kind === 'band' && (
            <input
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={FIELD_STYLE}
              placeholder="Band name"
              value={data.band_name}
              onChange={e => set({ band_name: e.target.value })}
            />
          )}

          <input
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={FIELD_STYLE}
            placeholder={data.kind === 'band' ? 'Headline — e.g. Shoegaze trio needs a drummer' : "Headline — e.g. Bassist looking for a post-punk band"}
            value={data.title}
            onChange={e => set({ title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={FIELD_STYLE}
              placeholder="City / area"
              value={data.city}
              onChange={e => set({ city: e.target.value })}
            />
            <input
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={FIELD_STYLE}
              placeholder="School (optional)"
              value={data.school}
              onChange={e => set({ school: e.target.value })}
            />
          </div>

          {/* Looking for */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: 'rgba(124,111,255,0.7)' }}>
              Looking for
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INSTRUMENTS.map(i => (
                <Chip key={i} active={data.looking_for.includes(i)} onClick={() => toggle('looking_for', i)}>{i}</Chip>
              ))}
            </div>
          </div>

          {/* I play */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: 'rgba(124,111,255,0.7)' }}>
              You play
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INSTRUMENTS.map(i => (
                <Chip key={i} active={data.i_play.includes(i)} onClick={() => toggle('i_play', i)}>{i}</Chip>
              ))}
            </div>
          </div>

          {/* Commitment */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: 'rgba(124,111,255,0.7)' }}>
              Commitment
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMITMENTS.map(c => (
                <Chip key={c.id} active={data.commitment === c.id} onClick={() => set({ commitment: c.id })}>{c.label}</Chip>
              ))}
            </div>
          </div>

          <input
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={FIELD_STYLE}
            placeholder="Bands that shaped your sound"
            value={data.influences}
            onChange={e => set({ influences: e.target.value })}
          />

          {/* Genre tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {data.genre_tags.map(tag => (
                <Chip key={tag} active onClick={() => toggle('genre_tags', tag)}>#{tag} ×</Chip>
              ))}
            </div>
            <input
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={FIELD_STYLE}
              placeholder="Add a style tag and press Enter (e.g. shoegaze)"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/^#/, '');
                  if (!data.genre_tags.includes(t)) set({ genre_tags: [...data.genre_tags, t] });
                  setTagInput('');
                }
              }}
            />
          </div>

          <textarea
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={FIELD_STYLE}
            rows={4}
            placeholder="Tell people what you're after — rehearsal habits, experience level, what you want to make…"
            value={data.description}
            onChange={e => set({ description: e.target.value })}
          />

          {blockedMsg && (
            <div className="flex gap-2.5 rounded-2xl p-3.5"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.28)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(251,191,36,0.9)' }}>{blockedMsg}</p>
            </div>
          )}

          {/* Required acknowledgement — the record that the user was told the rules. */}
          <button
            type="button"
            onClick={() => setAgreed(a => !a)}
            className="w-full flex gap-3 text-left px-4 py-3 rounded-2xl transition-all"
            style={agreed
              ? { background: 'rgba(124,111,255,0.14)', border: '1px solid rgba(124,111,255,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,111,255,0.16)' }
            }
          >
            <div className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold"
              style={{
                background: agreed ? '#7c6fff' : 'transparent',
                border: `1px solid ${agreed ? '#7c6fff' : 'rgba(124,111,255,0.4)'}`,
                color: '#fff',
              }}>
              {agreed ? '✓' : ''}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(150,165,215,0.75)' }}>
              I won't post phone numbers, WeChat/QQ IDs or other handles, I won't ask anyone for money, and I
              understand echoesbetweennotes only shows this post and passes messages — it doesn't verify anyone or take
              part in anything offline. If I'm under 18, I'll tell a parent or guardian before meeting anyone.
            </p>
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => create.mutate()}
            className="w-full py-3 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(124,111,255,0.25)',
              border: '1px solid rgba(124,111,255,0.45)',
              color: '#c4baff',
              opacity: canSubmit ? 1 : 0.45,
            }}
          >
            {create.isPending ? 'Checking your post…' : 'Post to the board'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}