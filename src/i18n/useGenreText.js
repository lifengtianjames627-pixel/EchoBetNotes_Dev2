import { useCallback } from 'react';
import { useLang } from '@/i18n/LanguageContext';
import { GENRE_I18N } from '@/i18n/genres';
import { GENRES } from '@/lib/genreConfig';

// Genre names / taglines / descriptions are system copy — they follow the system
// language. Album titles, artist names and review text never do.
export function useGenreText() {
  const { lang } = useLang();

  const pick = useCallback((genreId, field, fallback) => {
    const localized = GENRE_I18N[lang]?.[genreId]?.[field];
    if (localized) return localized;
    return fallback ?? GENRES.find(g => g.id === genreId)?.[field] ?? '';
  }, [lang]);

  const gLabel = useCallback((id, fb) => pick(id, 'label', fb), [pick]);
  const gTagline = useCallback((id, fb) => pick(id, 'tagline', fb), [pick]);
  const gDesc = useCallback((id, fb) => pick(id, 'desc', fb), [pick]);

  // Genre list with localized labels, ready to hand to pickers.
  const localizedGenres = GENRES.map(g => ({ ...g, label: gLabel(g.id, g.label) }));

  return { gLabel, gTagline, gDesc, localizedGenres };
}