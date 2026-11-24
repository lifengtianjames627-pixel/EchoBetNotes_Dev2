const RAW = Symbol('raw_html');

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

export function raw(content) {
  return { [RAW]: true, value: String(content ?? '') };
}

function renderPart(part) {
  if (part == null || part === false || part === true) return '';
  if (Array.isArray(part)) return part.map(renderPart).join('');
  if (typeof part === 'object' && part[RAW]) return part.value;
  return esc(part);
}

export function html(strings, ...values) {
  let output = '';
  for (let i = 0; i < strings.length; i += 1) {
    output += strings[i];
    if (i < values.length) output += renderPart(values[i]);
  }
  return raw(output);
}

export function renderHtml(fragment) {
  return renderPart(fragment);
}

export function safeUrl(value, fallback = '') {
  const text = String(value || '').trim();
  if (!text) return fallback;
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  try {
    const parsed = new URL(text);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
  } catch {
    return fallback;
  }
  return fallback;
}

export function safeNextPath(value, fallback = '/') {
  const text = String(value || '').trim();
  if (!text || !text.startsWith('/') || text.startsWith('//') || text.includes('\\')) return fallback;
  return text;
}

export function formatDate(value, lang = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const locales = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', fr: 'fr-FR', ru: 'ru-RU' };
  return new Intl.DateTimeFormat(locales[lang] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function renderStars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  if (!value) return '';
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`;
}

export function initialOf(name) {
  const text = String(name || 'A').trim();
  return (text[0] || 'A').toUpperCase();
}
