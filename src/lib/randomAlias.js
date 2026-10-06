// Music-themed pseudonym generator — used when a new member skips the
// display-name field in onboarding so their real email / full name is never
// the only thing identifying them publicly. Adjective + musical noun.
const ADJ = [
  'Velvet', 'Crimson', 'Amber', 'Indigo', 'Sage', 'Cobalt', 'Ember', 'Hazel',
  'Marble', 'Willow', 'Bronze', 'Ivory', 'Slate', 'Juniper', 'Ochre', 'Linen',
  'Copper', 'Mossy', 'Dusky', 'Silver', 'Russet', 'Pearl', 'Smoke', 'Linnet',
];
const NOUN = [
  'Treble', 'Clef', 'Reed', 'Fret', 'Cadence', 'Octave', 'Minim', 'Coda',
  'Bridge', 'Verse', 'Motif', 'Harmonic', 'Tempo', 'Ledger', 'Sustain',
  'Phrase', 'Riff', 'Lullaby', 'Echo', 'Crescendo', 'Serenade', 'Nocturne',
  'Aria', 'Prelude',
];

export function randomAlias() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  // 2-digit suffix so collisions among many members are unlikely.
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${a} ${n} ${suffix}`;
}