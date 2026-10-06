import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ACG (anime/game/comic) soundtracks are often stored under a Chinese fan
// title (e.g. 死神, 恶魔城) but international databases (MusicBrainz, iTunes)
// only index the official Japanese/English release title. This resolves the
// official title + composer/artist so the search actually finds a match.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, artist } = await req.json();
    if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `This is an anime/game/comic (ACG) music album. The title/artist given may be a Chinese fan name or translation:\nTitle: "${title}"\nArtist: "${artist || ''}"\n\nIdentify the official Japanese or English release title of this soundtrack/album, and the official composer or artist name as used internationally (e.g. on MusicBrainz, iTunes, VGMdb). If you cannot identify it confidently, just return the original title/artist unchanged.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          resolved_title: { type: 'string' },
          resolved_artist: { type: 'string' },
        },
        required: ['resolved_title', 'resolved_artist'],
      },
    });

    return Response.json({
      title: result.resolved_title || title,
      artist: result.resolved_artist || artist,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});