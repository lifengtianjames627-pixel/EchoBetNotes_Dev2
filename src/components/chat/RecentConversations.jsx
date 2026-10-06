import React from 'react';
import { History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChatSection from './ChatSection';
import PeerRow from './PeerRow';
import { useLang } from '@/i18n/LanguageContext';

export default function RecentConversations({ V, conversations, loading, isPinned, onTogglePin, onOpen }) {
  const { t } = useLang();
  return (
    <ChatSection V={V} icon={History} label={t('chat.history')} count={conversations.length}>
      {loading ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#ece5d6' }} />)}
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-xs px-4 py-4 rounded-2xl" style={{ color: V.muted, background: V.card, border: `1px dashed ${V.border}` }}>
          {t('chat.historyEmpty')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {conversations.map(c => (
            <PeerRow
              key={c.peer_email}
              V={V}
              name={c.peer_name}
              email={c.peer_email}
              subtitle={`${c.from_me ? t('chat.you') : ''}${c.last_message}`}
              meta={c.last_at ? formatDistanceToNow(new Date(c.last_at), { addSuffix: true }) : ''}
              unread={c.unread || 0}
              pinned={isPinned(c.peer_email)}
              onOpen={() => onOpen(c.peer_email, c.peer_name)}
              onTogglePin={() => onTogglePin({ peer_email: c.peer_email, peer_name: c.peer_name })}
            />
          ))}
        </div>
      )}
    </ChatSection>
  );
}