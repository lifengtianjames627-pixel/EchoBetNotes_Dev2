import { apiClient } from '@/api/appClient';

// Fire-and-forget: record that the current listener opened content in this
// genre, feeding the home "For You" feed. Self-gates for guests so pages can
// call it unconditionally without producing auth errors.
export function trackGenre(genre) {
  if (!genre) return;
  apiClient.auth
    .isAuthenticated()
    .then((ok) => {
      if (ok) apiClient.functions.invoke('trackGenre', { genre }).catch(() => {});
    })
    .catch(() => {});
}