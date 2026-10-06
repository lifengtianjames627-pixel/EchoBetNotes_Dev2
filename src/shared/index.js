// ─────────────────────────────────────────────────────────────────────────────
// src/shared — the cross-cutting layer.
//
// Anything used by more than one feature area lives here, so there is exactly
// one definition of each rule. Feature-specific UI stays in its own folder
// under src/components/<domain>/ and src/pages/.
//
//   shared/config/genres    → the genre roster, paper palette, skins, share
//                             colors, slug aliases, theme builder
//   shared/identity         → display names, public-name masking, auth gate
//   shared/hooks            → cross-feature behavior (content moderation)
//
// Older paths (@/lib/genreConfig, @/lib/genreSkins, @/lib/displayName,
// @/hooks/useAuthed) are thin re-export shims pointing here, so existing
// imports keep working while new code imports from '@/shared/...'.
// ─────────────────────────────────────────────────────────────────────────────

export * from '@/shared/config/genres';
export * from '@/shared/identity';
export { useContentModeration } from '@/shared/hooks/useContentModeration';