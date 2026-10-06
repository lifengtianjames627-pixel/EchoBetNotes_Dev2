import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return Response.json({ isFlagged: false, confidence: 0, categories: [], reason: '', suggestedAction: 'allow' });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a lenient content moderation AI for a music review forum. Your job is to catch only genuinely harmful content — NOT casual strong language, music slang, passionate opinions, or enthusiastic writing.

DO NOT FLAG:
- Strong opinions about music ("this album is garbage", "worst album ever", "this sucks")
- Casual swear words used as emphasis ("this is f***ing amazing", "holy shit what a banger")
- Harsh but music-focused criticism
- Enthusiastic caps ("WOW", "AMAZING", "BANGER")
- Any content that is clearly about music, albums, or artists

ONLY FLAG if the text contains:
- hate: explicit hate speech targeting a person/group based on race, gender, religion, ethnicity (full sentences, not just a word)
- harassment: direct personal attacks or threats aimed at a real person (not the music)
- spam: obvious advertising or completely off-topic promotion
- sexual: sexually explicit content
- violence: direct threats of violence against a real person
- privacy: sharing someone's private personal information
- politics: any political stance, party affiliation, or partisan discussion — including but not limited to: 共产党 (Communist Party), 国民党 (KMT), 民进党 (DPP), 民主党 (Democratic Party), 共和党 (Republican Party), MAGA, Trump, Biden, 习近平, 蔡英文, 党派, 政治立场, 左派/右派, liberal, conservative, or any other political party/figure/ideology. This is a music forum, not a political platform.

A single strong word is NOT enough to flag. The entire line/sentence must be aggressive or harmful in context.

Text to analyze:
"""
${text}
"""

Respond with a JSON object only, no explanation:
{
  "isFlagged": boolean,
  "confidence": number between 0.0 and 1.0,
  "categories": array of matched category strings from the list above,
  "reason": short one-sentence explanation in English,
  "suggestedAction": "block" if confidence > 0.9 and isFlagged, "review" if confidence > 0.75 and isFlagged, otherwise "allow"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          isFlagged: { type: 'boolean' },
          confidence: { type: 'number' },
          categories: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
          suggestedAction: { type: 'string' }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    // On AI failure: default to allow + log, never block users due to system error
    console.error('Moderation error:', error.message);
    return Response.json({
      isFlagged: false,
      confidence: 0,
      categories: [],
      reason: 'Moderation service unavailable',
      suggestedAction: 'allow'
    });
  }
});