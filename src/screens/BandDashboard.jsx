import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Save, Users, Music2, ChevronRight, UserMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { displayName } from '@/lib/displayName';

// Paper palette, same language as the rest of the site.
const V = {
  bg: '#f3efe6',
  card: '#faf8f2',
  border: '#e0d8c8',
  accent: '#8a5a20',
  accentBg: '#f1ebdd',
  text: '#1a1815',
  muted: '#6b6358',
};

function EditBandForm({ band, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: band?.name || '',
    genre: band?.genre || 'rock',
    description: band?.description || '',
    status: band?.status || 'recruiting',
  });

  return (
    <div className="space-y-4">
      {[['name', 'Band Name'], ['description', 'Biography / History']].map(([key, label]) => (
        <div key={key}>
          <label className="text-xs uppercase tracking-widest font-bold mb-1 block" style={{ color: V.muted }}>{label}</label>
          {key === 'description' ? (
            <textarea
              rows={5}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
              value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
            />
          ) : (
            <input
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
              value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
            />
          )}
        </div>
      ))}
      <div>
        <label className="text-xs uppercase tracking-widest font-bold mb-1 block" style={{ color: V.muted }}>Genre</label>
        <select
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
          value={form.genre}
          onChange={e => setForm({ ...form, genre: e.target.value })}
        >
          {['rock','pop','hip_hop','r_and_b','jazz','classical','electronic','indie','metal','punk','folk','country','latin','k_pop','other'].map(g => (
            <option key={g} value={g}>{g.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest font-bold mb-1 block" style={{ color: V.muted }}>Status</label>
        <select
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        >
          {['recruiting','active','inactive'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
          style={{ background: V.accentBg, color: V.accent, border: '1px solid #ddd0b6' }}
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={onCancel} className="px-5 py-2 rounded-full text-sm" style={{ color: V.muted }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function BandDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null); // band id or 'new'
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-bands', user?.email],
    queryFn: () => base44.entities.BandMember.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const founderBandIds = myMemberships.filter(m => m.is_founder).map(m => m.band_id);

  const { data: allBands = [] } = useQuery({
    queryKey: ['bands-list'],
    queryFn: () => base44.entities.Band.list('-created_date', 100),
  });
  const myBands = allBands.filter(b => founderBandIds.includes(b.id));

  const { data: allMembers = [] } = useQuery({
    queryKey: ['band-members-all'],
    queryFn: () => base44.entities.BandMember.list(),
  });

  const createBand = useMutation({
    mutationFn: async (form) => {
      const band = await base44.entities.Band.create(form);
      await base44.entities.BandMember.create({
        band_id: band.id,
        band_name: form.name,
        user_email: user.email,
        user_name: displayName(user),
        role: 'Founder',
        is_founder: true,
      });
      return band;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bands-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-bands'] });
      setEditing(null);
    },
  });

  const updateBand = useMutation({
    mutationFn: ({ id, form }) => base44.entities.Band.update(id, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bands-list'] }); setEditing(null); },
  });

  const addMember = useMutation({
    mutationFn: ({ bandId, bandName }) => base44.entities.BandMember.create({
      band_id: bandId,
      band_name: bandName,
      user_email: addMemberEmail,
      user_name: addMemberEmail,
      role: addMemberRole || 'Member',
      is_founder: false,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['band-members-all'] }); setAddMemberEmail(''); setAddMemberRole(''); },
  });

  const removeMember = useMutation({
    mutationFn: (id) => base44.entities.BandMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['band-members-all'] }),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen p-6" style={{ background: V.bg }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-playfair italic text-2xl" style={{ color: V.text }}>Band Dashboard</h1>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: V.accentBg, color: V.accent, border: '1px solid #ddd0b6' }}
          >
            <Plus className="w-4 h-4" /> Create Band
          </button>
        </div>

        {/* Create new band form */}
        {editing === 'new' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5" style={{ background: V.card, border: `1px solid ${V.border}` }}>
            <p className="text-sm font-bold mb-4" style={{ color: V.accent }}>New Band</p>
            <EditBandForm
              onSave={(form) => createBand.mutate(form)}
              onCancel={() => setEditing(null)}
            />
          </motion.div>
        )}

        {/* My bands */}
        {myBands.length === 0 && editing !== 'new' && (
          <div className="text-center py-16 rounded-2xl" style={{ background: V.card, border: `1px solid ${V.border}` }}>
            <Music2 className="w-10 h-10 mx-auto mb-3" style={{ color: V.muted }} />
            <p className="text-sm" style={{ color: V.muted }}>You haven't created any bands yet.</p>
          </div>
        )}

        {myBands.map(band => {
          const members = allMembers.filter(m => m.band_id === band.id);
          const isEditing = editing === band.id;
          return (
            <motion.div key={band.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl overflow-hidden" style={{ background: V.card, border: `1px solid ${V.border}` }}>
              {/* Band header */}
              <div className="p-5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4" style={{ color: V.accent }} />
                    <h2 className="font-bold text-lg" style={{ color: V.text }}>{band.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: V.accentBg, color: V.accent }}>
                      {band.genre?.replace('_',' ')}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: V.muted }}>{band.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/band/${band.id}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                    style={{ color: V.muted, border: `1px solid ${V.border}` }}>
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                  <button onClick={() => setEditing(isEditing ? null : band.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: V.accentBg, color: V.accent, border: '1px solid #ddd0b6' }}>
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="px-5 pb-5" style={{ borderTop: `1px solid ${V.border}` }}>
                  <div className="pt-4">
                    <EditBandForm band={band}
                      onSave={(form) => updateBand.mutate({ id: band.id, form })}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="px-5 pb-5" style={{ borderTop: `1px solid ${V.border}` }}>
                <p className="text-xs uppercase tracking-widest font-bold pt-4 mb-3" style={{ color: V.muted }}>
                  <Users className="w-3 h-3 inline mr-1.5" />Members ({members.length})
                </p>
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: '#f5f2ea', border: '1px solid #ece5d6' }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: V.text }}>{m.user_name || 'Anonymous'}</span>
                        <span className="text-xs ml-2" style={{ color: V.muted }}>{m.role}</span>
                        {m.is_founder && <span className="text-xs ml-2 px-1.5 py-0.5 rounded" style={{ background: V.accentBg, color: V.accent }}>Founder</span>}
                      </div>
                      {!m.is_founder && (
                        <button onClick={() => removeMember.mutate(m.id)} title="Remove">
                          <UserMinus className="w-3.5 h-3.5" style={{ color: V.muted }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add member */}
                <div className="flex gap-2 mt-3">
                  <input
                    placeholder="Member email"
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
                    value={addMemberEmail}
                    onChange={e => setAddMemberEmail(e.target.value)}
                  />
                  <input
                    placeholder="Role"
                    className="w-28 px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: '#ffffff', border: `1px solid ${V.border}`, color: V.text }}
                    value={addMemberRole}
                    onChange={e => setAddMemberRole(e.target.value)}
                  />
                  <button
                    disabled={!addMemberEmail}
                    onClick={() => addMember.mutate({ bandId: band.id, bandName: band.name })}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: V.accentBg, color: V.accent }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}