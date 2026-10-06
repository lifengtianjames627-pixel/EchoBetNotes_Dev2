import React from 'react';
import { Pin, PinOff } from 'lucide-react';

// One person row, shared by the pinned / conversations / nearby lists.
export default function PeerRow({ V, name, email, subtitle, meta, color, pinned, online, unread, onOpen, onTogglePin }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: V.card, border: `1px solid ${V.border}` }}>
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={color
              ? { background: `${color}26`, color, border: `1.5px solid ${color}`, opacity: online === false ? 0.55 : 1 }
              : { background: '#f1ebdd', color: '#8a5a20', opacity: online === false ? 0.55 : 1 }}>
            {(name || '?')[0].toUpperCase()}
          </div>
          {online !== undefined && online !== null && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
              style={{
                background: online ? '#5f7a4f' : '#c4bba9',
                border: '2px solid #faf8f2',
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: V.text }}>{name || 'Anonymous'}</p>
          {subtitle && <p className="text-xs truncate" style={{ color: V.muted }}>{subtitle}</p>}
        </div>
        {meta && <span className="text-[10px] shrink-0 ml-2" style={{ color: '#8a7e6f' }}>{meta}</span>}
        {unread > 0 && (
          <span className="shrink-0 ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#c0392b' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          title={pinned ? 'Unpin' : 'Pin to top'}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{
            background: pinned ? '#f1ebdd' : 'transparent',
            color: pinned ? V.accent : V.muted,
          }}
        >
          {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}