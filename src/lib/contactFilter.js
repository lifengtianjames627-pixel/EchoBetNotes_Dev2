// Detects contact info in user-generated text.
//
// Why this exists: everything must stay inside the app. If contact details leak out,
// we stop being a bulletin board and become a channel that hands personal information
// from one user to another — with no record, no report path, and no way to intervene.
// Keeping conversations in-app means every exchange is logged, reportable and moderatable.

const PATTERNS = [
  { label: 'phone number', re: /(?:\+?86[-\s.]?)?1[3-9]\d[-\s.]?\d{4}[-\s.]?\d{4}/ },
  { label: 'WeChat ID', re: /(?:微信|weixin|wechat|wx|vx|v信|威信)\s*(?:号|id)?\s*[:：=\-—]?\s*[a-zA-Z0-9_-]{5,}/i },
  { label: 'QQ number', re: /(?:qq|扣扣|企鹅)\s*(?:号)?\s*[:：=\-—]?\s*[1-9]\d{4,11}/i },
  { label: 'email address', re: /[\w.+-]+\s*(?:@|＠|\(at\)|\[at\])\s*[\w-]+\s*\.\s*[\w.]{2,}/i },
  { label: 'social handle', re: /(?:小红书|抖音|快手|ins|instagram|telegram|电报|discord|line|whatsapp|snapchat)\s*(?:号|id)?\s*[:：=\-—]?\s*[a-zA-Z0-9_.-]{4,}/i },
  { label: 'request for contact details', re: /(?:加|留|发|私|给|要)\s*(?:个|下|一下)?\s*(?:我的|你的)?\s*(?:微信|wx|vx|qq|电话|手机|联系方式|号码)/i },
  { label: 'long number sequence', re: /\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d/ },
];

// Returns the human-readable labels of every kind of contact info found.
export function findContactInfo(text) {
  if (!text) return [];
  const found = [];
  for (const { label, re } of PATTERNS) {
    if (re.test(text) && !found.includes(label)) found.push(label);
  }
  return found;
}

export function hasContactInfo(text) {
  return findContactInfo(text).length > 0;
}