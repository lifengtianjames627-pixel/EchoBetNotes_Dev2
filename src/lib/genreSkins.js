// Compatibility shim — the genre skin layer now lives in the unified config.
// New code should import from '@/shared/config/genres' directly.
export {
  GENRE_SKINS,
  DEFAULT_SKIN,
  PAPER,
  GENRE_SLUG_ALIASES,
  getGenreSkin,
  getShareTheme,
  buildGenreTheme,
  resolveGenreId,
} from '@/shared/config/genres';