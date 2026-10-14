import { config } from '../config/env.js';

export async function completeJson(system, user, fallback) {
  if (!config.llm.apiUrl || !config.llm.apiKey || !config.llm.model) return fallback;
  const response = await fetch(config.llm.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.llm.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`LLM request failed (${response.status})`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return content ? JSON.parse(content) : fallback;
}

export async function moderateText(text) {
  if (!String(text || '').trim()) {
    return { isFlagged: false, confidence: 0, categories: [], reason: '', suggestedAction: 'allow' };
  }
  const fallback = {
    isFlagged: false,
    confidence: 0,
    categories: [],
    reason: config.llm.apiUrl ? '' : 'Moderation service unavailable',
    suggestedAction: 'allow',
  };
  try {
    return await completeJson(
      'Moderate a music community post. Return JSON with isFlagged, confidence, categories, reason, suggestedAction (allow, review, or block). Block only severe high-confidence abuse, threats, sexual exploitation, private data, or spam.',
      String(text).slice(0, 20_000),
      fallback,
    );
  } catch {
    return fallback;
  }
}
