export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export function safeMemberName(user, fallback = 'Anonymous') {
  const candidate = String(user?.display_name || user?.full_name || '').trim();
  return candidate && !candidate.includes('@') ? candidate : fallback;
}

export const onlineRecently = (date, minutes = 5) =>
  Boolean(date && Date.now() - new Date(date).getTime() <= minutes * 60_000);

export const chatIdFor = (a, b) => [normalizeEmail(a), normalizeEmail(b)].sort().join('|');
