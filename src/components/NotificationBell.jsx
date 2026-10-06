import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';

// Bell in the top bar with an unread count badge. Lists system notifications
// (likes, follows, badges, friend requests). Direct messages live on the
// Messages nav item, not here.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.functions.invoke('notifications', { action: 'list' }).then(r => r.data),
    refetchInterval: 30000,
  });
  const items = data?.items || [];
  const unread = data?.unread || 0;

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onClick);
    return () => document.removeEventListener('pointerdown', onClick);
  }, []);

  const markAll = async () => {
    await base44.functions.invoke('notifications', { action: 'markAll' });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const openItem = async (n) => {
    if (!n.read) {
      await base44.functions.invoke('notifications', { action: 'markRead', id: n.id });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ color: '#6b6358', border: '1px solid rgba(26,24,21,0.14)' }}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: '#c0392b' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-11 w-80 max-h-[70vh] overflow-y-auto z-50"
          style={{ background: '#faf8f2', border: '1px solid #e0d8c8', borderRadius: 12, boxShadow: '0 8px 30px rgba(120,100,80,0.18)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 sticky top-0"
            style={{ background: '#faf8f2', borderBottom: '1px solid #e6ddc9' }}
          >
            <p className="font-playfair italic text-sm" style={{ color: '#1a1815' }}>Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-semibold hover:underline" style={{ color: '#bf7a35' }}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-center py-10" style={{ color: '#8a7e6f' }}>No notifications yet.</p>
          ) : (
            items.map(n => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className="w-full text-left px-4 py-3 flex gap-2.5 transition-colors hover:bg-[#f5f0e3]"
                style={{ borderBottom: '1px solid #f0e8d6' }}
              >
                <span
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{ background: n.read ? 'transparent' : '#bf7a35', border: n.read ? '1px solid #d0c4a8' : 'none' }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug" style={{ color: '#1a1815' }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: '#6b6358' }}>{n.body}</p>}
                  <p className="text-[10px] mt-1" style={{ color: '#8a7e6f' }}>
                    {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}