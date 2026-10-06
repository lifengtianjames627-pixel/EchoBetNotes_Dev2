import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Preference labels chosen at profile setup → Album.genre enum ids.
const PREF_TO_GENRE = {
  'Rock': 'rock', 'Pop': 'pop', 'Classical': 'classical', 'Metal': 'metal',
  'Jazz': 'jazz', 'Blues': 'blues', 'R&B': 'r_and_b', 'Core': 'punk',
  'Country': 'country', 'Hip-hop': 'hip_hop', 'Indie': 'indie', 'Grunge': 'grunge',
  'Electronic': 'electronic', 'Funk': 'funk', 'ACG': 'acg', 'Cinematic': 'cinematic',
};

const GENRE_LABEL = {
  rock: 'Rock', pop: 'Pop', classical: 'Classical', metal: 'Metal',
  jazz: 'Jazz', blues: 'Blues', r_and_b: 'R&B', punk: 'Core',
  country: 'Country', hip_hop: 'Hip-hop', indie: 'Indie', grunge: 'Grunge',
  electronic: 'Electronic', funk: 'Funk', acg: 'ACG', cinematic: 'Cinematic',
};

// Home feed: newest reviews + podcasts for everyone, plus an AI-curated
// "For You" selection. Taste is a blend of the listener's actual genre clicks
// (GenreTally, which dominates over time) and their stated music_preferences
// (a baseline so first-login still gets a feed). Uses the service role so the
// feed works for guests (public content) too.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (e) { user = null; }

    const reviews = await base44.asServiceRole.entities.Review.list('-created_date', 40);
    const approved = (reviews || []).filter(r => !r.moderation_status || r.moderation_status === 'approved');

    const podcasts = await base44.asServiceRole.entities.Podcast.list('-created_date', 10);

    // Join review → album genre so we can match against taste.
    const albumReviews = approved.filter(r => !r.kind || r.kind === 'album_review');
    const ids = [...new Set(albumReviews.map(r => r.album_id).filter(id => /^[a-f\d]{24}$/i.test(id || '')))];
    const albums = ids.length ? await base44.asServiceRole.entities.Album.filter({ id: { $in: ids } }, '-created_date', ids.length) : [];
    const byId = new Map(albums.map(a => [a.id, a]));
    const enriched = albumReviews.filter(r => byId.has(r.album_id)).map(r => {
      const a = byId.get(r.album_id);
      return { ...r, album_title: a.title, album_artist: a.artist, album_cover_url: a.cover_url || '', _genre: a.genre };
    });

    const recentReviews = enriched.slice(0, 6);

    // Taste weights: clicks count fully, preferences add a small baseline.
    const weights = {};
    let tallies = [];
    if (user) {
      (user.music_preferences || []).forEach(p => {
        const g = PREF_TO_GENRE[p];
        if (g) weights[g] = (weights[g] || 0) + 2;
      });
      try {
        tallies = await base44.asServiceRole.entities.GenreTally.filter({ user_email: user.email });
      } catch (e) { tallies = []; }
      (tallies || []).forEach(t => {
        if (t.genre) weights[t.genre] = (weights[t.genre] || 0) + (t.count || 0);
      });
    }
    const topGenres = Object.keys(weights)
      .filter(g => weights[g] > 0)
      .sort((a, b) => weights[b] - weights[a]);
    const tasteLabels = topGenres.slice(0, 6).map(g => GENRE_LABEL[g] || g).join(', ');

    let forYou = [];
    let aiBlurb = '';
    if (topGenres.length > 0) {
      const matched = enriched.filter(r => r._genre && topGenres.includes(r._genre));
      // Strongest tastes first, then newest.
      matched.sort((a, b) => (weights[b._genre] - weights[a._genre]) || (new Date(b.created_date) - new Date(a.created_date)));
      forYou = matched.slice(0, 8);
      if (forYou.length > 0) {
        const candidates = forYou.map(r => ({
          id: r.id, title: r.album_title, artist: r.album_artist, genre: r._genre,
          rating: r.rating, snippet: (r.content || '').slice(0, 140),
        }));
        let res = { blurb: '', picks: [] };
        try {
          res = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt:
              `A music-loving high schooler just opened their homepage. Their taste, strongest first: ${tasteLabels}. ` +
              `From these recent reviews, pick the ${Math.min(4, candidates.length)} most relevant for them and write a warm, ` +
              `specific one-line reason for each (address them as "you", tie it to their taste). ` +
              `Also write a one-sentence intro greeting them and naming their taste.\nReviews:\n${JSON.stringify(candidates)}`,
            response_json_schema: {
              type: 'object',
              properties: {
                blurb: { type: 'string' },
                picks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { id: { type: 'string' }, reason: { type: 'string' } },
                    required: ['id', 'reason'],
                  },
                },
              },
              required: ['blurb', 'picks'],
            },
          });
        } catch (e) { res = { blurb: '', picks: [] }; }
        aiBlurb = res.blurb || '';
        const reasonMap = {};
        (res.picks || []).forEach(p => { if (p && p.id) reasonMap[p.id] = p.reason; });
        // AI adds explanations; a missing explanation must not erase valid recommendations.
        const explained = forYou.filter(r => reasonMap[r.id]);
        forYou = (explained.length ? explained : forYou.slice(0, 4)).map(r => ({ ...r, _reason: reasonMap[r.id] || null }));
      }
    }

    const strip = (r) => ({
      id: r.id, album_id: r.album_id, album_title: r.album_title, album_artist: r.album_artist,
      album_cover_url: r.album_cover_url, rating: r.rating, title: r.title, content: r.content,
      reviewer_name: r.reviewer_name, created_date: r.created_date, edited_at: r.edited_at,
      _genre: r._genre, _reason: r._reason || null,
    });

    return Response.json({
      recentReviews: recentReviews.map(strip),
      recentPodcasts: (podcasts || []).slice(0, 4),
      forYou: forYou.map(strip),
      aiBlurb,
      tasteLabels,
      hasTaste: topGenres.length > 0,
      isLoggedIn: !!user,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}