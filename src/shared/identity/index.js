// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for member identity.
//
// Identity rules that used to be scattered across components now live here:
//   - a member's chosen display_name always wins over the platform full_name
//   - emails are NEVER shown to non-admins — they fall back to 'Anonymous'
//   - the auth gate (viewer vs logged-in member) is one hook
//
// src/lib/displayName.js and src/hooks/useAuthed.js re-export from here so
// existing imports keep working; new code should import from '@/shared/identity'.
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export const ANONYMOUS = 'Anonymous';

/**
 * A member's chosen display name takes precedence over the platform-set
 * full_name (which can't be changed via updateMe). Falls back to email so a
 * brand-new account still shows something sensible — use publicName() for
 * anything a non-admin can see.
 */
export function displayName(user) {
  if (!user) return '';
  const chosen = typeof user.display_name === 'string' ? user.display_name.trim() : '';
  if (chosen) return chosen;
  return user.full_name || user.email || '';
}

/** True when the string looks like an email address. */
export function isEmail(value) {
  return typeof value === 'string' && /\S+@\S+\.\S+/.test(value.trim());
}

/**
 * A name safe to render anywhere in public UI: never an email address.
 * Accepts either a user object or an already-resolved name string.
 */
export function publicName(userOrName, fallback = ANONYMOUS) {
  const raw = typeof userOrName === 'string' ? userOrName : displayName(userOrName);
  const name = (raw || '').trim();
  if (!name || isEmail(name)) return fallback;
  return name;
}

/** Partially masks an email for the rare admin-only context that shows one. */
export function maskEmail(email) {
  if (!isEmail(email)) return '';
  const [local, domain] = email.trim().split('@');
  const head = local.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

/** The single letter shown inside an avatar circle. */
export function initialOf(userOrName) {
  return publicName(userOrName, ANONYMOUS)[0].toUpperCase();
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Shared gate for viewer/member/admin tiering. `authed` is true only for a
 * logged-in user; `login` sends a viewer to the platform login and back here.
 */
export function useAuthed() {
  const { isAuthenticated } = useAuth();
  return {
    authed: !!isAuthenticated,
    login: () => base44.auth.redirectToLogin(window.location.pathname + window.location.search),
  };
}