import { HttpError } from '../entities/policies.js';
import { entity } from '../entities/repository.js';

export function requireUser(context) {
  if (!context.user) throw new HttpError(401, 'auth_required', 'Authentication required');
  return context.user;
}

export function requireAdmin(context) {
  const user = requireUser(context);
  if (user.role !== 'admin') throw new HttpError(403, 'forbidden');
  return user;
}

export const records = (name) => entity(name);

export const ok = (data) => data;
