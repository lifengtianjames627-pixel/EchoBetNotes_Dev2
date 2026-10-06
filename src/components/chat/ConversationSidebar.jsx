import React from 'react';
import { PanelLeftClose, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Collapsible side column shown next to an open conversation: jump between the
// people you've talked to without going back to the landing page.
export default function ConversationSidebar({ V, conversations = [], activeEmail, onOpen, onCollapse }) {
  return (
    <aside className="hidden md:flex flex-col shrink-0 w-72 overflow-y-auto"
      style={{ borderRight: `1px solid ${V.border}`, background: '#f7f3ea' }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${V.border}` }}>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: V.muted }}>
          <History className="w-3 h-3" style={{ color: V.accent }} /> Conversations
        </p>
        <button onClick={onCollapse} title="Hide panel" style={{ color: V.muted }}>
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs px-3 py-4" style={{ color: V.muted }}>No other conversations yet.</p>
        )}
        {conversations.map(c => {
          const active = c.peer_email === activeEmail;
          return (
            <button
              key={c.peer_email}
              onClick={() => onOpen(c.peer_email, c.peer_name)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
              style={active
                ? { background: '#f1ebdd', border: '1px solid #ddd0b6' }
                : { background: 'transparent', border: '1px solid transparent' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#f1ebdd', color: '#8a5a20' }}>
                {(c.peer_name || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: V.text }}>{c.peer_name || 'Anonymous'}</p>
                <p className="text-xs truncate" style={{ color: V.muted }}>{c.last_message || ''}</p>
              </div>
              {c.last_at && (
                <span className="text-[10px] shrink-0" style={{ color: V.muted }}>
                  {formatDistanceToNow(new Date(c.last_at))}
                </span>
              )}
              {c.unread > 0 && (
                <span className="shrink-0 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#c0392b' }}>
                  {c.unread > 9 ? '9+' : c.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}