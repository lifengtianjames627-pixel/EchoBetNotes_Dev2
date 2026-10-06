import { base44 } from '@/api/base44Client';

// Fire-and-forget helper to drop a system notification for a member. Used by
// like / follow / friend-request / badge events. Never throws — notifications
// are a side-channel, not a path that should break the triggering action.
export function notify({ owner_email, type, title, body = '', link = '', actor_name = '' }) {
  if (!owner_email || !type || !title) return;
  base44.functions
    .invoke('notifications', { action: 'create', owner_email, type, title, body, link, actor_name })
    .catch(() => {});
}