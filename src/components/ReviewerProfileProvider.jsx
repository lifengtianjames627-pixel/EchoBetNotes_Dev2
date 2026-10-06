import React, { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Batches per-card author lookups into one resolveProfiles call so a list of
// reviews resolves all reviewer names + avatars in a single round-trip, then
// caches them for the session. Review cards call useReviewerProfile(email);
// the provider debounces the collected emails and fetches them together.
const ReviewerProfileContext = createContext(null);

export function ReviewerProfileProvider({ children }) {
  const [cache, setCache] = useState({});
  const pendingRef = useRef(new Set());
  const timerRef = useRef(null);

  const flush = useCallback(async () => {
    const emails = [...pendingRef.current];
    if (!emails.length) return;
    pendingRef.current = new Set();
    try {
      const res = await base44.functions.invoke('resolveProfiles', { emails });
      const results = res.data?.results || {};
      setCache(c => ({ ...c, ...results }));
    } catch (e) {
      // swallow — cards fall back to their snapshot names
    }
  }, []);

  const request = useCallback((email) => {
    if (!email) return;
    pendingRef.current.add(email);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 60);
  }, [flush]);

  const get = useCallback((email) => cache[email] || null, [cache]);

  // Re-fetch every author currently in the cache (called after a rename /
  // avatar change) so cards update to the new name + avatar in the same
  // session without a full reload.
  const refresh = useCallback(async () => {
    const emails = Object.keys(cache);
    if (!emails.length) return;
    try {
      const res = await base44.functions.invoke('resolveProfiles', { emails });
      const results = res.data?.results || {};
      setCache(c => ({ ...c, ...results }));
    } catch (e) {
      // swallow — cards keep showing the previously resolved values
    }
  }, [cache]);

  const value = useMemo(() => ({ request, get, refresh }), [request, get, refresh]);
  return (
    <ReviewerProfileContext.Provider value={value}>
      {children}
    </ReviewerProfileContext.Provider>
  );
}

// Returns the live { name, picture_url } for an author email, or null until
// resolved. Triggers a batched fetch on first use.
export function useReviewerProfile(email) {
  const ctx = useContext(ReviewerProfileContext);
  useEffect(() => {
    if (ctx && email) ctx.request(email);
  }, [email, ctx?.request]);
  return ctx ? ctx.get(email) : null;
}

// Call after a rename / avatar change so the renamer's own session re-fetches
// author names + avatars instead of serving the stale cache.
export function useReviewerProfileRefresh() {
  const ctx = useContext(ReviewerProfileContext);
  return ctx?.refresh;
}