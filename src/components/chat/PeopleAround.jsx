import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, List, Map as MapIcon, Wifi } from 'lucide-react';
import { peerColor } from './peerColors';
import ChatSection from './ChatSection';
import PeerRow from './PeerRow';
import LocationShareBar from './LocationShareBar';
import NearbyMap from './NearbyMap';
import { useLang } from '@/i18n/LanguageContext';

// People currently active on the band board — closest first when the viewer has
// shared their location, otherwise same city. Age is not collected or matched.
export default function PeopleAround({ V, nearby, loading, city, matchedCity, located, locationSource, myLat, myLng, isPinned, onTogglePin, onOpen }) {
  const [view, setView] = useState('list');
  const [wifiOpen, setWifiOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();
  const hint = located ? t('chat.closestFirst') : matchedCity && city ? t('chat.inCity', { c: city }) : t('chat.onBoard');
  const canMap = located && typeof myLat === 'number' && typeof myLng === 'number';
  const people = nearby.map((p, i) => ({ ...p, color: peerColor(i) }));

  return (
    <ChatSection V={V} icon={MapPin} label={t('chat.around')} hint={hint} count={nearby.length}>
      <LocationShareBar V={V} located={located} locationSource={locationSource} myLat={myLat} myLng={myLng} />

      {/* One short line by default — the full explanation is one tap away. */}
      <button
        onClick={() => setWifiOpen(o => !o)}
        className="flex items-start gap-1.5 text-[10px] leading-relaxed mb-2 px-1 text-left w-full"
        style={{ color: V.muted }}
      >
        <Wifi className="w-3 h-3 shrink-0 mt-0.5" style={{ color: V.accent }} />
        <span>{wifiOpen ? t('chat.wifiNote') : t('chat.wifiShort')}</span>
      </button>

      {canMap && (
        <div className="flex gap-1.5 mb-2">
          {[
            { id: 'list', label: t('chat.list'), icon: List },
            { id: 'map', label: t('chat.map'), icon: MapIcon },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={view === t.id
                ? { background: '#f1ebdd', border: '1px solid #ddd0b6', color: '#8a5a20' }
                : { background: V.card, border: `1px solid ${V.border}`, color: V.muted }}
            >
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-1.5">
          {[0, 1].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#ece5d6' }} />)}
        </div>
      ) : canMap && view === 'map' ? (
        <NearbyMap
          V={V}
          center={[myLat, myLng]}
          people={people}
          onOpen={(email) => navigate(`/u/${encodeURIComponent(email)}`)}
        />
      ) : nearby.length === 0 ? (
        <p className="text-xs px-4 py-4 rounded-2xl" style={{ color: V.muted, background: V.card, border: `1px dashed ${V.border}` }}>
          {t('chat.nearbyEmpty')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {people.map(p => (
            <PeerRow
              key={p.email}
              V={V}
              name={p.name}
              email={p.email}
              color={p.color}
              online={p.online}
              subtitle={[
                p.online ? t('chat.online') : p.last_active ? t('chat.lastSeen', { ago: formatDistanceToNow(new Date(p.last_active), { addSuffix: true }) }) : t('chat.offline'),
                p.same_network ? t('chat.sameWifi') : null,
                p.distance_km !== null && p.distance_km !== undefined
                  ? (p.distance_km < 1 ? t('chat.underKm') : t('chat.kmAway', { km: p.distance_km })) + (p.online ? '' : ` (${t('chat.lastSpot')})`)
                  : null,
                p.city,
                p.school,
                p.kind ? (p.kind === 'band' ? t('sm.bandRecruiting') : t('sm.playerAvailable')) : null,
              ].filter(Boolean).join(' · ')}
              pinned={isPinned(p.email)}
              onOpen={() => onOpen(p.email, p.name)}
              onTogglePin={() => onTogglePin({ peer_email: p.email, peer_name: p.name })}
            />
          ))}
        </div>
      )}
    </ChatSection>
  );
}