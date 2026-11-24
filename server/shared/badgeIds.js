export const BADGES = [
  { id: 'critic_welcome', category: 'Welcome', name: "Reader's Card", desc: 'Joined the Echoes Between Notes reading room' },
  { id: 'daily_listener', category: 'Attendance', name: 'Morning Session', desc: '45+ minutes in a single day' },
  { id: 'weekly_devotee', category: 'Attendance', name: 'Weekly Attendance', desc: '3+ hours in a single week' },
  { id: 'monthly_obsessive', category: 'Attendance', name: 'Full Term', desc: '30+ hours in a single month' },
  { id: 'time_10h', category: 'Attendance', name: 'Ten Hours Read', desc: '10+ total hours in the app' },
  { id: 'time_100h', category: 'Attendance', name: 'Hundred Hours Read', desc: '100+ total hours in the app' },
  { id: 'time_1000h', category: 'Attendance', name: 'Thousand Hours Read', desc: '1,000+ total hours in the app' },
  { id: 'reviews_5', category: 'Craft', name: 'First Notebook', desc: 'Wrote 5 reviews' },
  { id: 'reviews_25', category: 'Craft', name: 'Steady Pen', desc: 'Wrote 25 reviews' },
  { id: 'reviews_100', category: 'Craft', name: 'Collected Essays', desc: 'Wrote 100 reviews' },
  { id: 'genres_3', category: 'Repertoire', name: 'Three Keys', desc: 'Reviewed music from 3 different genres' },
  { id: 'genres_6', category: 'Repertoire', name: 'Broad Ear', desc: 'Reviewed music from 6 different genres' },
  { id: 'genres_10', category: 'Repertoire', name: 'Theory Shelf', desc: 'Reviewed music from 10 different genres' },
  { id: 'views_100', category: 'Readership', name: 'Read Aloud', desc: '100+ views on albums you reviewed' },
  { id: 'views_1000', category: 'Readership', name: 'Passed Around', desc: '1,000+ views on albums you reviewed' },
  { id: 'views_5000', category: 'Readership', name: 'Reference Copy', desc: '5,000+ views on albums you reviewed' },
  { id: 'likes_100', category: 'Acclaim', name: 'Margin Praise', desc: '100+ likes received on your reviews' },
  { id: 'likes_300', category: 'Acclaim', name: 'Quoted Often', desc: '300+ likes received on your reviews' },
  { id: 'likes_500', category: 'Acclaim', name: 'Laurel Seal', desc: '500+ likes received on your reviews' },
  { id: 'comments_10', category: 'Community', name: 'Reading Circle', desc: '10+ comments received on your reviews' },
  { id: 'comments_50', category: 'Community', name: 'Seminar Host', desc: '50+ comments received on your reviews' },
  { id: 'comments_100', category: 'Community', name: 'Society Chair', desc: '100+ comments received on your reviews' },
  { id: 'comments_200', category: 'Community', name: 'Honorary Fellow', desc: '200+ comments received on your reviews' },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((badge) => [badge.id, badge]));
export const BADGE_IDS = new Set(BADGES.map((badge) => badge.id));
