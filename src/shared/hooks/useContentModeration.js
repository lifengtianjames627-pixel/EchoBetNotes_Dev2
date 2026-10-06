import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Single source of truth for the AI moderation flow used by both review
// creation and comment creation. Returns a `moderate(text)` function that
// runs the moderateContent backend function and resolves to the raw result,
// plus a `status` flag ('blocked' | 'pending' | null) for UI feedback.
//
// Contract:
//  - On `suggestedAction === 'block'` it sets status to 'blocked' and throws
//    Error('BLOCKED') so the caller's mutation onError can react.
//  - On `suggestedAction === 'review'` it sets status to 'pending' and still
//    resolves with the result so the caller can persist the record as
//    pending_review.
//  - On any AI failure it silently falls back to 'allow' so a platform
//    outage never blocks user contributions.
export function useContentModeration() {
  const [status, setStatus] = useState(null);

  const moderate = useCallback(async (text) => {
    setStatus(null);
    const textToCheck = (text || '').trim();
    if (!textToCheck) {
      return { isFlagged: false, confidence: 0, categories: [], reason: '', suggestedAction: 'allow' };
    }
    let modResult = { isFlagged: false, confidence: 0, categories: [], reason: '', suggestedAction: 'allow' };
    try {
      const res = await base44.functions.invoke('moderateContent', { text: textToCheck });
      modResult = res.data ?? modResult;
    } catch (_) {
      // AI failure → allow
    }
    if (modResult.suggestedAction === 'block') {
      setStatus('blocked');
      throw new Error('BLOCKED');
    }
    if (modResult.suggestedAction === 'review') {
      setStatus('pending');
    }
    return modResult;
  }, []);

  const resetStatus = useCallback(() => setStatus(null), []);

  return { moderate, status, resetStatus };
}