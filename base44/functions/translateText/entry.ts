import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const LANGS = { en: 'English', zh: 'Simplified Chinese', ja: 'Japanese', ko: 'Korean', fr: 'French', ru: 'Russian' };

// Translates one piece of member-written content (a review body, title, etc.)
// on demand. Content is never rewritten in storage — the translation is only
// returned for reading.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { text, target } = await req.json();
    const language = LANGS[target];
    if (!text || !language) return Response.json({ error: 'text and a supported target language are required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Translate the music review below into ${language}. Keep the author's tone, keep album, song and artist names in their original language, and do not add commentary.\n\n---\n${text}`,
      response_json_schema: {
        type: 'object',
        properties: { translated: { type: 'string' } },
        required: ['translated'],
      },
    });

    return Response.json({ translated: result?.translated || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}