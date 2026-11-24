import { entity } from '../../entities/repository.js';
import { GENRES } from '../../shared/genres.js';
import { html, safeUrl } from '../html.js';
import { t } from '../i18n.js';

export async function renderDiscoverPage({ user, lang, query }) {
  const search = String(query?.q || '').trim().toLowerCase();
  const genreFilter = String(query?.genre || '').trim().toLowerCase();
  const typeFilter = String(query?.type || '').trim().toLowerCase();

  const filter = {};
  if (genreFilter) filter.genre = genreFilter;
  if (typeFilter === 'album' || typeFilter === 'single') filter.type = typeFilter;

  const albums = (await entity('Album').list({ filter, sort: '-created_date', limit: 200 }))
    .filter((album) => {
      if (!search) return true;
      return `${album.title || ''} ${album.artist || ''}`.toLowerCase().includes(search);
    });

  return {
    title: t(lang, 'discover.title'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="page-title">${t(lang, 'discover.title')}</h1>
        <p class="muted">${t(lang, 'discover.subtitle')}</p>
      </section>

      <form class="filter-bar card" method="get" action="/discover">
        <input type="search" name="q" value="${query?.q || ''}" placeholder="Search title or artist…" />
        <select name="genre">
          <option value="">All genres</option>
          ${GENRES.map((genre) => html`<option value="${genre.entityGenre}" ${genreFilter === genre.entityGenre ? 'selected' : ''}>${genre.label}</option>`)}
        </select>
        <select name="type">
          <option value="">All formats</option>
          <option value="album" ${typeFilter === 'album' ? 'selected' : ''}>Albums</option>
          <option value="single" ${typeFilter === 'single' ? 'selected' : ''}>Singles</option>
        </select>
        <button type="submit" class="btn btn-primary btn-sm">Filter</button>
      </form>

      ${user ? html`
        <details class="card disclosure section-tight">
          <summary class="disclosure-summary">Add an album or single</summary>
          <form class="stack form-pad" data-form="create-album">
            <div class="grid-2">
              <label class="field">
                <span>Title</span>
                <input type="text" name="title" maxlength="200" required />
              </label>
              <label class="field">
                <span>Artist</span>
                <input type="text" name="artist" maxlength="200" required />
              </label>
            </div>
            <div class="grid-3">
              <label class="field">
                <span>Genre</span>
                <select name="genre">
                  ${GENRES.map((genre) => html`<option value="${genre.entityGenre}">${genre.label}</option>`)}
                </select>
              </label>
              <label class="field">
                <span>Format</span>
                <select name="type">
                  <option value="album">Album</option>
                  <option value="single">Single / EP</option>
                </select>
              </label>
              <label class="field">
                <span>Release year</span>
                <input type="number" name="release_year" min="1900" max="2100" />
              </label>
            </div>
            <label class="field">
              <span>Cover image (optional upload)</span>
              <input type="file" name="cover_file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <label class="field">
              <span>Description</span>
              <textarea name="description" rows="3"></textarea>
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">Add release</button>
          </form>
        </details>
      ` : ''}

      <section class="section">
        ${albums.length ? html`
          <div class="grid-4">
            ${albums.map((album) => html`
              <a class="card link-card" href="/album/${encodeURIComponent(album.id)}">
                ${safeUrl(album.cover_url) ? html`<img class="thumb" src="${safeUrl(album.cover_url)}" alt="${album.title}" loading="lazy" />` : html`<div class="thumb thumb-placeholder">♪</div>`}
                <div class="card-body">
                  <span class="pill">${album.genre || 'music'}</span>
                  <h3 class="card-title">${album.title}</h3>
                  <p class="muted text-sm">${album.artist}</p>
                  <p class="muted text-xs">${album.avg_rating ? `★ ${Number(album.avg_rating).toFixed(1)}` : 'No rating yet'} · ${album.review_count || 0} reviews</p>
                </div>
              </a>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
