import { chatIdFor, normalizeEmail, safeMemberName } from './identity.js';

const contactPatterns = [
  /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
  /\b(?:https?:\/\/|www\.)\S+/i,
  /\b(?:wechat|whatsapp|telegram|discord|qq|微信|加我|手机号)\b/i,
  /(?:\+?\d[\s().-]*){10,}/,
];

export const containsExternalContact = (text) =>
  contactPatterns.some((pattern) => pattern.test(String(text || '')));

export function buildChatMessage(actor, payload) {
  const participants = String(payload.chat_id || '').split('|').map(normalizeEmail).filter(Boolean);
  if (participants.length !== 2 || !participants.includes(normalizeEmail(actor.email))) {
    throw Object.assign(new Error('invalid_chat'), { statusCode: 400 });
  }
  if (payload.chat_id !== chatIdFor(...participants)) {
    throw Object.assign(new Error('invalid_chat'), { statusCode: 400 });
  }
  const content = String(payload.content || '').trim();
  if (!content && !payload.attachment_url) {
    throw Object.assign(new Error('invalid_message'), { statusCode: 400 });
  }
  if (content.length > 5000) throw Object.assign(new Error('invalid_message'), { statusCode: 400 });
  if (containsExternalContact(content)) throw Object.assign(new Error('contact_blocked'), { statusCode: 400 });
  if (payload.attachment_kind && !['image', 'pdf', 'file'].includes(payload.attachment_kind)) {
    throw Object.assign(new Error('invalid_attachment'), { statusCode: 400 });
  }
  return {
    chat_id: payload.chat_id,
    participants,
    sender_email: normalizeEmail(actor.email),
    sender_name: safeMemberName(actor),
    content,
    attachment_url: payload.attachment_url || '',
    attachment_kind: payload.attachment_kind || '',
    attachment_name: String(payload.attachment_name || '').slice(0, 255),
  };
}

export function lastSeenFor(user, peerEmail) {
  const value = user?.messages_last_seen;
  if (typeof value === 'string') return new Date(value).getTime() || 0;
  if (value && typeof value === 'object') return new Date(value[peerEmail] || 0).getTime() || 0;
  return 0;
}
