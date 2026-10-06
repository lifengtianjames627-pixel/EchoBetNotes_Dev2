import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, MessageCircle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/i18n/LanguageContext';
import { useAuthed } from '@/shared/identity';
import { publicName } from '@/shared/identity';
import { openPrivateChat } from '@/shared/chat/openPrivateChat';
import { peerColor } from '@/components/chat/peerColors';
import useChatDirectory from '@/features/location/queries/useChatDirectory';

// A compact "People Around You" strip for the home page. Reuses the same
// chatDirectory data the Messages page does — same-Wi-Fi, shared-location and
// board members — so it works even before the viewer shares GPS. Tapping a
// member opens a private chat (with the pre-friend 3-message gate).
export default function PeopleAroundYou() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { authed, login } = useAuthed();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    enabled: authed,
  });

  const { data, isLoading } = useChatDirectory(authed ? user : null);

  const nearby = (data?.nearby || []).slice(0, 6);

  const subtitleFor = (p) => {
    const bits = [];
    if (p.online) bits.push(t('chat.online'));
    else if (p.last_active) {
      const mins = Math.round((Date.now() - new Date(p.last_active).getTime()) / 60000);
      bits.push(mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`);
    }
    if (p.same_network) bits.push(t('chat.sameWifi'));
    if (p.distance_km !== null && p.distance_km !== undefined) {
      bits.push(p.distance_km < 1 ? t('chat.underKm') : t('chat.kmAway', { km: p.distance_km }));
    }
    if (p.city) bits.push(p.city);
    return bits.filter(Boolean).join(' · ');
  };

  // Guest state — keep it light, no data fetch.
  if (!authed) {
    return (
      <section className="relative z-10 mt-14 w-full max-w-4xl mx-auto px-4">
        <div className="rounded-2xl p-6 text-center"
          style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 2px 14px rgba(120,100,80,0.06)' }}>
          <MapPin className="w-5 h-5 mx-auto mb-2" style={{ color: '#bf7a35' }} />
          <p className="font-playfair italic text-lg mb-1" style={{ color: '#1a1815' }}>{t('home.peopleAround')}</p>
          <p className="text-xs mb-3" style={{ color: '#6b6358' }}>{t('home.peopleAroundGuest')}</p>
          <button onClick={login}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
            {t('home.peopleAroundViewAll')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 mt-14 w-full max-w-4xl mx-auto px-4">
      <div className="rounded-2xl p-5"
        style={{ background: '#faf8f2', border: '1px solid #e0d8c8', boxShadow: '0 2px 14px rgba(120,100,80,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: '#bf7a35' }} />
            <p className="font-playfair italic text-lg" style={{ color: '#1a1815' }}>{t('home.peopleAround')}</p>
          </div>
          <button onClick={() => navigate('/chat')}
            className="flex items-center gap-1 text-[11px] font-semibold hover:underline"
            style={{ color: '#8a5a20' }}>
            {t('home.peopleAroundViewAll')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: '#6b6358' }}>{t('home.peopleAroundHint')}</p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#ece5d6' }} />
            ))}
          </div>
        ) : nearby.length === 0 ? (
          <div className="rounded-xl p-5 text-center"
            style={{ background: '#f5f2ea', border: '1px dashed #e0d8c8' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#6b6358' }}>{t('home.peopleAroundEmpty')}</p>
            <button onClick={() => navigate('/chat')}
              className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: '#f1ebdd', color: '#8a5a20', border: '1px solid #ddd0b6' }}>
              {t('home.peopleAroundViewAll')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {nearby.map((p, i) => {
              const color = peerColor(i);
              const name = publicName({ full_name: p.name, email: p.email });
              return (
                <button key={p.email}
                  onClick={() => openPrivateChat(p.email, p.name)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:-translate-y-0.5"
                  style={{ background: '#f5f2ea', border: '1px solid #e6ddc9' }}>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: `${color}26`, color, border: `1.5px solid ${color}` }}>
                      {(name || '?')[0].toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{ background: p.online ? '#5f7a4f' : '#c4bba9', border: '2px solid #faf8f2' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1a1815' }}>{name}</p>
                    <p className="text-[10px] truncate" style={{ color: '#8a7e6f' }}>{subtitleFor(p)}</p>
                  </div>
                  <MessageCircle className="w-3.5 h-3.5 shrink-0 opacity-50" style={{ color: '#bf7a35' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}