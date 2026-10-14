import { definitions } from './definitions/index.js';

export class HttpError extends Error {
  constructor(statusCode, code, message = code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const email = (value) => String(value || '').trim().toLowerCase();
const isAdmin = (actor) => actor?.role === 'admin';
const isOwner = (actor, record) =>
  Boolean(actor && (record?.created_by_id === actor.id || email(record?.created_by) === email(actor.email)));
const participant = (actor, record) =>
  Boolean(actor && (
    Array.isArray(record?.participants) && record.participants.map(email).includes(email(actor.email))
    || email(record?.from_email) === email(actor.email)
    || email(record?.to_email) === email(actor.email)
  ));
const moderated = (actor, record) =>
  isOwner(actor, record)
  || isAdmin(actor)
  || !record?.moderation_status
  || record.moderation_status === 'approved';

export function canReadRecord(entityName, actor, record) {
  const mode = definitions[entityName]?.policy.read;
  switch (mode) {
    case 'public': return true;
    case 'admin': return isAdmin(actor);
    case 'participant': return participant(actor, record);
    case 'moderated': return moderated(actor, record);
    case 'recruitVisible':
      return isOwner(actor, record)
        || isAdmin(actor)
        || (record?.status === 'active' && (!record?.moderation_status || record.moderation_status === 'approved'));
    case 'selfOrAdmin': return Boolean(actor && (record?.id === actor.id || isAdmin(actor)));
    case 'ownerOrAdmin': return isOwner(actor, record) || isAdmin(actor);
    case 'ownerByEmail': return Boolean(actor && email(record?.owner_email) === email(actor.email));
    case 'voterOrAdmin': return Boolean(actor && (email(record?.voter_email) === email(actor.email) || isAdmin(actor)));
    case 'subscriberOrAdmin': return Boolean(actor && (email(record?.subscriber_email) === email(actor.email) || isAdmin(actor)));
    default: return false;
  }
}

export function assertEntityOperation(entityName, operation, actor, record = null, input = {}) {
  const definition = definitions[entityName];
  if (!definition) throw new HttpError(404, 'unknown_entity', 'Unknown entity');
  const mode = definition.policy[operation];
  if (operation === 'read') {
    if (!canReadRecord(entityName, actor, record)) throw new HttpError(actor ? 403 : 401, 'forbidden');
    return;
  }
  if (mode === 'functionOnly') throw new HttpError(403, 'function_required', 'Use the dedicated workflow endpoint');
  if (mode === 'public') return;
  if (!actor) throw new HttpError(401, 'auth_required', 'Authentication required');
  if (mode === 'authenticated') return;
  if (mode === 'admin' && isAdmin(actor)) return;
  if ((mode === 'owner' || mode === 'ownerOrAdmin') && (isOwner(actor, record || input) || !record)) return;
  if (mode === 'ownerOrAdmin' && isAdmin(actor)) return;
  if (mode === 'sender' && email(record?.sender_email) === email(actor.email)) return;
  if (mode === 'ownerByEmail' && email(input.owner_email) === email(actor.email)) return;
  if (mode === 'ownerByEmailOrAdmin' && (email(record?.owner_email) === email(actor.email) || isAdmin(actor))) return;
  if (mode === 'subscriber' && email(input.subscriber_email) === email(actor.email)) return;
  if (mode === 'subscriberOrAdmin' && (email(record?.subscriber_email) === email(actor.email) || isAdmin(actor))) return;
  if (mode === 'selfOrAdmin' && (record?.id === actor.id || isAdmin(actor))) return;
  throw new HttpError(403, 'forbidden');
}

export function prepareEntityInput(entityName, actor, input) {
  const next = { ...input };
  if (actor) {
    next.created_by_id = actor.id;
    if (entityName === 'PinnedPeer') next.owner_email = actor.email;
    if (entityName === 'Subscription') next.subscriber_email = actor.email;
    if (entityName === 'RecruitPost') {
      next.author_email = actor.email;
      next.moderation_status = 'pending_review';
    }
  }
  if (entityName === 'User') delete next.role;
  return next;
}
