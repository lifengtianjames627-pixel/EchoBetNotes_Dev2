import { base44 } from '@/api/base44Client';

// Fire-and-forget: record that the current listener opened content in this
// genre, feeding the home "For You" feed. Self-gates for guests so pages can
// call it unconditionally without producing auth errors.
export function trackGenre(genre) {
  if (!genre) return;
  base44.auth
    .isAuthenticated()
    .then((ok) => {
      if (ok) base44.functions.invoke('trackGenre', { genre }).catch(() => {});
    })
    .catch(() => {});
}