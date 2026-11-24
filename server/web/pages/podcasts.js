import { entity } from '../../entities/repository.js';
import { PODCAST_CATEGORIES, PODCAST_CATEGORY_MAP } from '../../shared/podcasts.js';
import { formatDate, html } from '../html.js';
import { t } from '../i18n.js';

export async function renderPodcastsPage({ user, lang }) {
  const episodes = await entity('Podcast').list({ sort: '-created_date', limit: 60 });
  const counts = new Map();
  for (const episode of episodes) {
    counts.set(episode.category, (counts.get(episode.category) || 0) + 1);
  }

  return {
    title: t(lang, 'podcasts.title'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="page-title">${t(lang, 'podcasts.title')}</h1>
        <p class="muted">${t(lang, 'podcasts.subtitle')}</p>
      </section>

      <div class="grid-3 section">
        ${PODCAST_CATEGORIES.map((series) => html`
          <a class="card link-card series-card" style="--series-accent: ${series.accent};" href="/podcasts/${series.id}">
            <p class="eyebrow">${series.tagline}</p>
            <h2 class="card-title">${series.label}</h2>
            <p class="muted text-sm">${series.desc}</p>
            <p class="text-xs muted mt-auto">${counts.get(series.id) || 0} episodes</p>
          </a>
        `)}
      </div>

      ${user?.role === 'admin' ? html`
        <details class="card disclosure section">
          <summary class="disclosure-summary">Publish a podcast episode (Admin)</summary>
          <form class="stack form-pad" data-form="publish-podcast">
            <div class="grid-2">
              <label class="field">
                <span>Series</span>
                <select name="category" required>
                  ${PODCAST_CATEGORIES.map((series) => html`<option value="${series.id}">${series.label}</option>`)}
                </select>
              </label>
              <label class="field">
                <span>Duration (minutes)</span>
                <input type="number" name="duration_minutes" min="1" max="600" value="30" />
              </label>
            </div>
            <div class="grid-2">
              <label class="field">
                <span>Episode title</span>
                <input type="text" name="title" maxlength="200" required />
              </label>
              <label class="field">
                <span>Host name</span>
                <input type="text" name="host_name" maxlength="120" required />
              </label>
            </div>
            <label class="field">
              <span>Description</span>
              <textarea name="description" rows="3"></textarea>
            </label>
            <label class="field">
              <span>Audio file (mp3, wav, m4a, ogg, flac)</span>
              <input type="file" name="audio_file" accept="audio/*" required />
            </label>
            <label class="field">
              <span>Cover image (optional)</span>
              <input type="file" name="cover_file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">Upload & Publish</button>
          </form>
        </details>
      ` : ''}
    `,
  };
}

export async function renderPodcastSpacePage({ user, lang, params }) {
  const series = PODCAST_CATEGORY_MAP[params.categoryId];
  if (!series) {
    return {
      statusCode: 404,
      title: 'Series not found',
      body: html`<section class="card paper-sheet"><h1>Podcast series not found</h1><p><a class="text-link" href="/podcasts">All series</a></p></section>`,
    };
  }

  const episodes = await entity('Podcast').list({
    filter: { category: series.id },
    sort: '-created_date',
    limit: 100,
  });

  return {
    title: series.label,
    accent: series.accent,
    body: html`
      <p class="section-tight"><a class="text-link" href="/podcasts">← ${t(lang, 'podcasts.title')}</a></p>
      <section class="card paper-sheet genre-banner" style="--genre-accent: ${series.accent};">
        <p class="eyebrow">${series.tagline}</p>
        <h1 class="display-title">${series.label}</h1>
        <p class="muted">${series.desc}</p>
      </section>

      <section class="section">
        <h2>Episodes (${episodes.length})</h2>
        ${episodes.length ? html`
          <div class="stack-lg">
            ${episodes.map((episode) => html`
              <article class="card paper-sheet">
                <div class="meta-row">
                  <strong class="card-title">${episode.title}</strong>
                  <span class="muted text-xs ml-auto">${formatDate(episode.created_date, lang)}</span>
                </div>
                <p class="muted text-sm">${episode.host_name || ''}${episode.duration_minutes ? ` · ${episode.duration_minutes} min` : ''}</p>
                ${episode.description ? html`<p class="prose-sm">${episode.description}</p>` : ''}
                <div class="action-bar">
                  ${user ? html`
                    <button type="button" class="btn btn-secondary btn-sm" data-action="load-podcast-audio" data-podcast-id="${episode.id}">Play episode</button>
                    <div class="audio-slot" data-audio-slot="${episode.id}"></div>
                  ` : html`<a class="text-link text-sm" href="/login?next=${encodeURIComponent(`/podcasts/${series.id}`)}">Sign in to listen</a>`}
                </div>
              </article>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
