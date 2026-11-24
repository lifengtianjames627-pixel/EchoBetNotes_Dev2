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
    desc: 'Music lovers who live for production, arrangement, timbre and mixing logic teach audiences to hear music like an engineer — dissecting an album mix, layout and structure.',
    accent: '#2c7da0',
  },
  {
    id: 'cross_cultural_sound',
    label: 'Cross-Cultural Sound Dialogue',
    tagline: 'Music Beyond Borders',
    desc: 'Global listeners who explore multilingual and regional music break cultural barriers — rating representative non-native albums and unpacking globalized pop.',
    accent: '#2d7a5e',
  },
  {
    id: 'live_scene_chronicle',
    label: 'Live Scene Chronicle',
    tagline: 'Underground & Livehouse Stories',
    desc: 'Audiences who live in underground gigs, small livehouses and indie shows capture the emotional value of live music that recordings cannot replicate.',
    accent: '#b44d6f',
  },
  {
    id: 'independent_creator',
    label: 'Independent Creator Spotlight',
    tagline: 'Bedroom Producers & Unsigned Bands',
    desc: 'Bedroom producers, student bands and unsigned musicians tell the full story of conceiving, writing and producing their work.',
    accent: '#bf7a35',
  },
  {
    id: 'behind_the_lyrics',
    label: 'Behind the Lyrics',
    tagline: 'Meanings, Symbolism & Stories',
    desc: 'Lyric analysts, songwriters and devoted readers uncover the hidden meanings, symbolism and real-life stories behind songs.',
    accent: '#6b5b95',
  },
];

export const PODCAST_CATEGORY_MAP = Object.fromEntries(
  PODCAST_CATEGORIES.map((category) => [category.id, category]),
);
