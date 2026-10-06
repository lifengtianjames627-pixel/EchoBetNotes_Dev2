// Server validation is authoritative; the existing browser contact check is only early feedback.
const contactPatterns = [
  /[\w.+-]+\s*(?:@|＠|\(at\)|\[at\])\s*[\w-]+\s*\.\s*[\w.]{2,}/i,
  /(?:微信|weixin|wechat|wx|vx|v信|威信)\s*(?:号|id)?\s*[:：=\-—]?\s*[a-zA-Z0-9_-]{5,}/i,
  /(?:qq|扣扣|企鹅)\s*(?:号)?\s*[:：=\-—]?\s*[1-9]\d{4,11}/i,
  /(?:小红书|抖音|快手|ins|instagram|telegram|电报|discord|line|whatsapp|snapchat)\s*(?:号|id)?\s*[:：=\-—]?\s*[a-zA-Z0-9_.-]{4,}/i,
  /(?:加|留|发|私|给|要)\s*(?:个|下|一下)?\s*(?:我的|你的)?\s*(?:微信|wx|vx|qq|电话|手机|联系方式|号码)/i,
  /\d(?:[\s.()-]?\d){9}/,
];
export function recruitmentDraft(input) {
  if (!input || !['band', 'musician'].includes(input.kind)) return null;
  const draft = { kind: input.kind };
  for (const key of ['title', 'band_name', 'poster_asset_id', 'city', 'school', 'influences', 'description']) {
    if (input[key] != null && typeof input[key] !== 'string') return null;
    draft[key] = (input[key] || '').trim();
    if (draft[key].length > (key === 'description' ? 8000 : 2000)) return null;
  }
  if (!draft.title || draft.title.length > 200) return null;
  if (input.poster_url || (draft.poster_asset_id && !/^[a-f0-9]{24}$/i.test(draft.poster_asset_id))) return null;
  draft.commitment = input.commitment || 'casual';
  if (!['casual', 'regular', 'serious'].includes(draft.commitment)) return null;
  for (const key of ['looking_for', 'i_play', 'genre_tags']) {
    const values = input[key] ?? [];
    if (!Array.isArray(values) || values.length > 30 || values.some(v => typeof v !== 'string' || v.length > 100)) return null;
    draft[key] = values.map(v => v.trim()).filter(Boolean);
  }
  return draft;
}
export function recruitmentText(draft) {
  return ['title', 'band_name', 'city', 'school', 'influences', 'description', 'looking_for', 'i_play', 'genre_tags']
    .map(key => Array.isArray(draft[key]) ? draft[key].join(' ') : draft[key]).filter(Boolean).join('\n');
}
export function containsRecruitmentContact(text) {
  return contactPatterns.some(pattern => pattern.test(text));
}