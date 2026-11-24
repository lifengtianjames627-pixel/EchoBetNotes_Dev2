export const PAPER = {
  base: '#f3efe6',
  card: '#faf8f2',
  bar: '#e6ddc9',
  text: '#1a1815',
  muted: '#5a5a5a',
  faint: '#9a958a',
  border: '#e0d9c8',
};

export const GENRES = [
  { id: 'rock', label: 'Rock', entityGenre: 'rock', tagline: 'Underground · Raw · Alive', desc: 'The sound of rebellion, garage riffs, and honest power.', accent: '#a0392e' },
  { id: 'pop', label: 'Pop', entityGenre: 'pop', tagline: 'Clean · Bright · Now', desc: 'Hooks that last forever. Perfectly polished moments.', accent: '#c45a7c' },
  { id: 'classical', label: 'Classical', entityGenre: 'classical', tagline: 'Timeless · Precise · Profound', desc: 'Centuries of craft distilled into structured beauty.', accent: '#8b6914' },
  { id: 'metal', label: 'Metal', entityGenre: 'metal', tagline: 'Heavy · Dark · Relentless', desc: 'Pure intensity. No compromise. Total commitment.', accent: '#8b0000' },
  { id: 'jazz', label: 'Jazz', entityGenre: 'jazz', tagline: 'Improvised · Intimate · Late Night', desc: 'Where conversation becomes music. Every note a deliberate choice.', accent: '#b8860b' },
  { id: 'blues', label: 'Blues', entityGenre: 'blues', tagline: 'Slow · Honest · Deep', desc: 'The roots of everything. Pain turned into beauty.', accent: '#1e3a5f' },
  { id: 'r_and_b', label: 'R&B', entityGenre: 'r_and_b', tagline: 'Smooth · Soulful · Night', desc: 'Rhythm, soul, and the warmth of 2am.', accent: '#6b3fa0' },
  { id: 'core', label: 'Core', entityGenre: 'punk', tagline: 'Hardcore · Metalcore · Deathcore', desc: 'Explore the Core spectrum, from hardcore and metalcore to deathcore and beyond.', accent: '#7a8a1a' },
  { id: 'country', label: 'Country', entityGenre: 'country', tagline: 'Warm · Story-driven · Real', desc: 'Life, roads, and the people you never forget.', accent: '#4a6741' },
  { id: 'hip_hop', label: 'Hip-hop', entityGenre: 'hip_hop', tagline: 'Culture · Rhythm · Truth', desc: 'A whole culture compressed into beats and bars.', accent: '#c5a028' },
  { id: 'indie', label: 'Indie', entityGenre: 'indie', tagline: 'Curious · Unfiltered · Yours', desc: 'Made on your own terms. Nothing to prove.', accent: '#5a7a4a' },
  { id: 'grunge', label: 'Grunge', entityGenre: 'grunge', tagline: 'Distorted · Raw · Unapologetic', desc: 'Flannel, feedback, and feelings too big to name.', accent: '#8b3a3a' },
  { id: 'electronic', label: 'Electronic', entityGenre: 'electronic', tagline: 'Synthetic · Future · Dance', desc: 'Sound as architecture. The machine with a soul.', accent: '#0090a8' },
  { id: 'funk', label: 'Funk', entityGenre: 'funk', tagline: 'Groovy · Loose · Alive', desc: 'The bassline runs the show. Rhythm you can feel in your chest.', accent: '#e07020' },
  { id: 'acg', label: 'ACG', entityGenre: 'acg', tagline: 'Nostalgic · Epic · Playful', desc: 'Anime, comics, and games — the soundtrack to other worlds.', accent: '#d1638a' },
  { id: 'cinematic', label: 'Cinematic', entityGenre: 'cinematic', tagline: 'Sweeping · Dramatic · Immersive', desc: 'Film scores and soundtracks — music that tells a story.', accent: '#5d6b7a' },
];

export const GENRE_SLUG_ALIASES = {
  rnb: 'r_and_b',
  'r&b': 'r_and_b',
  'r-and-b': 'r_and_b',
  r_and_b: 'r_and_b',
  hiphop: 'hip_hop',
  'hip-hop': 'hip_hop',
  punk: 'core',
};

export function resolveGenreId(slug) {
  if (!slug) return null;
  const key = String(slug).trim().toLowerCase();
  return GENRE_SLUG_ALIASES[key] || key;
}

export function getGenre(slug) {
  const id = resolveGenreId(slug);
  return GENRES.find((genre) => genre.id === id) || null;
}
