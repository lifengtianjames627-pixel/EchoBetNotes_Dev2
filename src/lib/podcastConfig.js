export const PODCAST_CATEGORIES = [
  {
    id: 'youth_ears_lab',
    label: "Youth Ears' Lab",
    tagline: 'Impromptu Taste Exchanges',
    desc: 'High schoolers with distinctive musical tastes sit down for an impromptu exchange. The host plays a track, the guest rates it from their own perspective — then hands the aux back.',
    accent: '#7c6fff',
  },
  {
    id: 'sonic_technical_breakdown',
    label: 'Sonic Technical Breakdown',
    tagline: 'Production, Mixing & Arrangement',
    desc: 'Music lovers who live for production, arrangement, timbre and mixing logic teach audiences to hear music like an engineer — dissecting an album mix, layout and structure, and weighing over-polished commercial sound against raw independent recording.',
    accent: '#38bdf8',
  },
  {
    id: 'cross_cultural_sound',
    label: 'Cross-Cultural Sound Dialogue',
    tagline: 'Music Beyond Borders',
    desc: 'Global listeners who actively explore multilingual and regional music break cultural barriers — recounting how they fell for sounds from unfamiliar backgrounds, rating a representative non-native album, and unpacking the localization, assimilation and authenticity of globalized pop.',
    accent: '#34d399',
  },
  {
    id: 'live_scene_chronicle',
    label: 'Live Scene Chronicle',
    tagline: 'Underground & Livehouse Stories',
    desc: 'Audiences who live in underground gigs, small livehouses and indie shows capture the emotional value of live music that recordings cannot replicate — recounting their most unforgettable night, scoring stagecraft, improvisation and crowd energy, and reflecting on the survival of small live scenes in the streaming era.',
    accent: '#f472b6',
  },
  {
    id: 'independent_creator',
    label: 'Independent Creator Spotlight',
    tagline: 'Bedroom Producers & Unsigned Bands',
    desc: 'Amateur bedroom producers, student bands and unsigned musicians get a stage of their own — telling the full story of conceiving, writing and producing their work, self-scoring their latest release, and sharing honest thoughts on the threshold, traffic and profit of the independent music industry.',
    accent: '#fbbf24',
  },
  {
    id: 'behind_the_lyrics',
    label: 'Behind the Lyrics',
    tagline: 'Meanings, Symbolism & Stories',
    desc: 'Lyric analysts, songwriters and devoted readers uncover the hidden meanings, symbolism and real-life stories behind songs — breaking down metaphors, literary, film, book and mythology references, the songwriter background, and the craft of writing lyrics itself.',
    accent: '#a78bfa',
  },
];

export const PODCAST_CATEGORY_MAP = Object.fromEntries(PODCAST_CATEGORIES.map(c => [c.id, c]));