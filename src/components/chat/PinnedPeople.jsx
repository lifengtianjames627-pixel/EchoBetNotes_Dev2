import React from 'react';
import { Pin } from 'lucide-react';
import ChatSection from './ChatSection';
import PeerRow from './PeerRow';
import { useLang } from '@/i18n/LanguageContext';

export default function PinnedPeople({ V, pins, isPinned, onTogglePin, onOpen }) {
  const { t } = useLang();
  return (
    <ChatSection V={V} icon={Pin} label={t('chat.pinned')} count={pins.length}>
      {pins.length === 0 ? (
        <p className="text-xs px-4 py-4 rounded-2xl" style={{ color: V.muted, background: V.card, border: `1px dashed ${V.border}` }}>
          {t('chat.pinnedEmpty')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {pins.map(p => (
            <PeerRow
              key={p.id}
              V={V}
              name={p.peer_name}
              email={p.peer_email}
              subtitle={null}
              pinned={isPinned(p.peer_email)}
              onOpen={() => onOpen(p.peer_email, p.peer_name)}
              onTogglePin={() => onTogglePin({ peer_email: p.peer_email, peer_name: p.peer_name })}
            />
          ))}
        </div>
      )}
    </ChatSection>
  );
}