// Compatibility shim — identity helpers now live in the unified identity layer.
// New code should import from '@/shared/identity' directly.
export {
  displayName,
  publicName,
  maskEmail,
  initialOf,
  isEmail,
  isAdmin,
  ANONYMOUS,
} from '@/shared/identity';