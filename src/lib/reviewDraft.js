// Persists in-progress review drafts to localStorage so users never lose
// unfinished text — including for virtual singles/albums that don't exist yet.

const PREFIX = 'review_draft_';

export function draftKey(scope) {
  return `${PREFIX}${scope}`;
}

export function loadDraft(scope) {
  try {
    const raw = localStorage.getItem(draftKey(scope));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(scope, data) {
  try {
    localStorage.setItem(draftKey(scope), JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

export function clearDraft(scope) {
  try {
    localStorage.removeItem(draftKey(scope));
  } catch { /* ignore */ }
}