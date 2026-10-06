// Scholarly badge set — bookmarks, pens, theory books and library seals instead
// of glowing stars. Muted earthy inks only (ochre / sage / indigo / clay), three
// tiers per family. `icon` is a lucide-react component name resolved in
// BadgeIcon; keep ids stable — awarding logic references them.
export const BADGES = [
  // ── Welcome ────────────────────────────────────────────────────────────────
  {
    id: 'critic_welcome', category: 'Welcome', tier: 1,
    name: 'Reader\'s Card', desc: 'Joined the echoesbetweennotes reading room',
    icon: 'BookMarked', color: '#8a6f4a',
  },

  // ── Attendance (time spent in the app) ─────────────────────────────────────
  {
    id: 'daily_listener', category: 'Attendance', tier: 1,
    name: 'Morning Session', desc: '45+ minutes in a single day',
    icon: 'Sunrise', color: '#bf7a35',
  },
  {
    id: 'weekly_devotee', category: 'Attendance', tier: 2,
    name: 'Weekly Attendance', desc: '3+ hours in a single week',
    icon: 'CalendarDays', color: '#bf7a35',
  },
  {
    id: 'monthly_obsessive', category: 'Attendance', tier: 3,
    name: 'Full Term', desc: '30+ hours in a single month',
    icon: 'Hourglass', color: '#a0522d',
  },
  {
    id: 'time_10h', category: 'Attendance', tier: 1,
    name: 'Ten Hours Read', desc: '10+ total hours in the app',
    icon: 'Clock3', color: '#6b6358',
  },
  {
    id: 'time_100h', category: 'Attendance', tier: 2,
    name: 'Hundred Hours Read', desc: '100+ total hours in the app',
    icon: 'Clock3', color: '#6b6358',
  },
  {
    id: 'time_1000h', category: 'Attendance', tier: 3,
    name: 'Thousand Hours Read', desc: '1,000+ total hours in the app',
    icon: 'Clock3', color: '#4f5a7a',
  },

  // ── Craft (reviews written) ────────────────────────────────────────────────
  {
    id: 'reviews_5', category: 'Craft', tier: 1,
    name: 'First Notebook', desc: 'Wrote 5 reviews',
    icon: 'NotebookPen', color: '#6f7a5a',
  },
  {
    id: 'reviews_25', category: 'Craft', tier: 2,
    name: 'Steady Pen', desc: 'Wrote 25 reviews',
    icon: 'PenTool', color: '#6f7a5a',
  },
  {
    id: 'reviews_100', category: 'Craft', tier: 3,
    name: 'Collected Essays', desc: 'Wrote 100 reviews',
    icon: 'Library', color: '#4f5a7a',
  },

  // ── Repertoire (genres covered) ────────────────────────────────────────────
  {
    id: 'genres_3', category: 'Repertoire', tier: 1,
    name: 'Three Keys', desc: 'Reviewed music from 3 different genres',
    icon: 'Music4', color: '#8a6f4a',
  },
  {
    id: 'genres_6', category: 'Repertoire', tier: 2,
    name: 'Broad Ear', desc: 'Reviewed music from 6 different genres',
    icon: 'BookOpen', color: '#8a6f4a',
  },
  {
    id: 'genres_10', category: 'Repertoire', tier: 3,
    name: 'Theory Shelf', desc: 'Reviewed music from 10 different genres',
    icon: 'GraduationCap', color: '#4f5a7a',
  },

  // ── Readership (views on the albums you wrote about) ───────────────────────
  {
    id: 'views_100', category: 'Readership', tier: 1,
    name: 'Read Aloud', desc: '100+ views on albums you reviewed',
    icon: 'Eye', color: '#6b6358',
  },
  {
    id: 'views_1000', category: 'Readership', tier: 2,
    name: 'Passed Around', desc: '1,000+ views on albums you reviewed',
    icon: 'Bookmark', color: '#6b6358',
  },
  {
    id: 'views_5000', category: 'Readership', tier: 3,
    name: 'Reference Copy', desc: '5,000+ views on albums you reviewed',
    icon: 'Stamp', color: '#a0522d',
  },

  // ── Acclaim (likes received) ───────────────────────────────────────────────
  {
    id: 'likes_100', category: 'Acclaim', tier: 1,
    name: 'Margin Praise', desc: '100+ likes received on your reviews',
    icon: 'Feather', color: '#bf7a35',
  },
  {
    id: 'likes_300', category: 'Acclaim', tier: 2,
    name: 'Quoted Often', desc: '300+ likes received on your reviews',
    icon: 'Quote', color: '#bf7a35',
  },
  {
    id: 'likes_500', category: 'Acclaim', tier: 3,
    name: 'Laurel Seal', desc: '500+ likes received on your reviews',
    icon: 'Award', color: '#a0522d',
  },

  // ── Community (comments received) ─────────────────────────────────────────
  {
    id: 'comments_10', category: 'Community', tier: 1,
    name: 'Reading Circle', desc: '10+ comments received on your reviews',
    icon: 'MessageSquare', color: '#6f7a5a',
  },
  {
    id: 'comments_50', category: 'Community', tier: 2,
    name: 'Seminar Host', desc: '50+ comments received on your reviews',
    icon: 'MessagesSquare', color: '#6f7a5a',
  },
  {
    id: 'comments_100', category: 'Community', tier: 3,
    name: 'Society Chair', desc: '100+ comments received on your reviews',
    icon: 'Users', color: '#4f5a7a',
  },
  {
    id: 'comments_200', category: 'Community', tier: 3,
    name: 'Honorary Fellow', desc: '200+ comments received on your reviews',
    icon: 'Scroll', color: '#4f5a7a',
  },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));
export const BADGE_CATEGORIES = [
  'Welcome', 'Attendance', 'Craft', 'Repertoire', 'Readership', 'Acclaim', 'Community',
];