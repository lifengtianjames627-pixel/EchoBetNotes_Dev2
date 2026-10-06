import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Shield, ArrowLeft } from 'lucide-react';

// Admin-only member roster. Shows each member's public identity plus
// registration date and aggregate site-usage averages — never their messages.
const V = { bg: '#f3efe6', card: '#faf8f2', border: '#e0d8c8', accent: '#bf7a35', text: '#1a1815', muted: '#6b6358' };

export default function Manage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['manage-users'],
    queryFn: () => base44.entities.User.list(),
  });

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: V.bg }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs mb-5" style={{ color: V.muted }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4" style={{ color: V.accent }} />
          <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: V.accent }}>Admin</p>
        </div>
        <h1 className="font-playfair text-4xl italic" style={{ color: V.text }}>Manage Members</h1>
        <p className="text-xs mt-2 mb-8" style={{ color: V.muted }}>
          Registered members and their site-usage averages. Tap a member to open their public profile. Private messages are never visible here.
        </p>

        <div className="space-y-2">
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse" style={{ background: '#ece5d6', borderRadius: 10 }} />
          ))}
          {!isLoading && users.map(u => (
            <button
              key={u.id}
              onClick={() => navigate(`/u/${encodeURIComponent(u.id)}`)}
              className="w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#f1ebdd]"
              style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 10 }}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: '#f1ebdd', color: '#8a5a20' }}>
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate" style={{ color: V.text }}>
                  {u.full_name || u.email}
                  {u.role === 'admin' && <span className="ml-2 text-[10px] uppercase tracking-wider" style={{ color: V.accent }}>admin</span>}
                </p>
                <p className="text-xs truncate" style={{ color: V.muted }}>{u.email}</p>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-[11px]" style={{ color: V.muted }}>
                  Joined {u.created_date ? new Date(u.created_date).toLocaleDateString() : '—'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: V.muted }}>
                  Today {u.daily_minutes || 0}m · Total {u.total_browsing_minutes || 0}m
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}