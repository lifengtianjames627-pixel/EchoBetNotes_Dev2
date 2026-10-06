// Compatibility shim — the auth gate now lives in the unified identity layer.
// New code should import from '@/shared/identity' directly.
export { useAuthed } from '@/shared/identity';