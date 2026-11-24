import { entity } from '../../entities/repository.js';
import { getGenre, GENRES } from '../../shared/genres.js';
import { isVisibleReview } from '../../shared/reviews.js';
import { safeMemberName } from '../../shared/identity.js';
import { formatDate, html, renderStars, safeUrl } from '../html.js';
import { t } from '../i18n.js';

export async function renderGenrePage({ user, lang, params }) {
  const genre = getGenre(params.genreId);
  if (!genre) {
    return {
      statusCode: 404,
      title: 'Genre not found',
      body: html`
        <section class="paper-sheet card">
          <h1>Genre not found</h1>
          <p class="muted">Choose one of the genres below.</p>
          <div class="genre-rail">
            ${GENRES.map((item) => html`<a class="genre-chip" href="/genre/${item.id}">${item.label}</a>`)}
          </div>
        </section>
      `,
    };
  }

  const allItems = await entity('Album').list({
    filter: { genre: genre.entityGenre },
    sort: '-created_date',
    limit: 200,
  });
  const albums = allItems.filter((item) => item.type !== 'single');
  const singles = allItems.filter((item) => item.type === 'single');
  const topRated = [...allItems]
    .filter((item) => Number(item.avg_rating || 0) > 0)
    .sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0))
    .slice(0, 5);

  const reviews = (await entity('Review').list({
    filter: { genre: genre.entityGenre },
    sort: '-created_date',
    limit: 24,
  })).filter((review) => isVisibleReview(review, user));

  return {
    title: genre.label,
    accent: genre.accent,
    body: html`
      <section class="paper-sheet card genre-banner" style="--genre-accent: ${genre.accent};">
        <p class="eyebrow">${genre.tagline}</p>
        <h1 class="display-title">${genre.label}</h1>
        <p class="muted">${genre.desc}</p>
      </section>

      ${user ? html`
        <details class="card disclosure section-tight">
          <summary class="disclosure-summary">Add a ${genre.label} release</summary>
          <form class="stack form-pad" data-form="create-album">
            <input type="hidden" name="genre" value="${genre.entityGenre}" />
            <div class="grid-3">
              <label class="field">
                <span>Title</span>
                <input type="text" name="title" required />
              </label>
              <label class="field">
                <span>Artist</span>
                <input type="text" name="artist" required />
              </label>
              <label class="field">
                <span>Format</span>
                <select name="type">
                  <option value="album">Album</option>
                  <option value="single">Single / EP</option>
                </select>
              </label>
            </div>
            <label class="field">
              <span>Cover image (optional)</span>
              <input type="file" name="cover_file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <label class="field">
              <span>Description</span>
              <textarea name="description" rows="3"></textarea>
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">Add to ${genre.label}</button>
          </form>
        </details>
      ` : ''}

      ${topRated.length ? html`
        <section class="section">
          <h2>Highest Rated</h2>
          <ol class="ranked-list card">
            ${topRated.map((item, idx) => html`
              <li class="ranked-row">
                <span class="rank-num">${idx + 1}</span>
                <a class="rank-title" href="/album/${encodeURIComponent(item.id)}">${item.title}</a>
                <span class="muted text-sm">${item.artist}</span>
                <span class="stars ml-auto">★ ${Number(item.avg_rating).toFixed(1)}</span>
              </li>
            `)}
          </ol>
        </section>
      ` : ''}

      <section class="section">
        <h2>Albums (${albums.length})</h2>
        ${albums.length ? html`
          <div class="grid-4">
            ${albums.map((album) => html`
              <a class="card link-card" href="/album/${encodeURIComponent(album.id)}">
                ${safeUrl(album.cover_url) ? html`<img class="thumb" src="${safeUrl(album.cover_url)}" alt="${album.title}" loading="lazy" />` : html`<div class="thumb thumb-placeholder">♪</div>`}
                <div class="card-body">
                  <h3 class="card-title">${album.title}</h3>
                  <p class="muted text-sm">${album.artist}</p>
                  <p class="muted text-xs">${album.avg_rating ? `★ ${Number(album.avg_rating).toFixed(1)}` : 'Unrated'} · ${album.review_count || 0}</p>
                </div>
              </a>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>

      ${singles.length ? html`
        <section class="section">
          <h2>Singles & EPs (${singles.length})</h2>
          <div class="grid-4">
            ${singles.map((single) => html`
              <a class="card link-card" href="/album/${encodeURIComponent(single.id)}">
                ${safeUrl(single.cover_url) ? html`<img class="thumb" src="${safeUrl(single.cover_url)}" alt="${single.title}" loading="lazy" />` : html`<div class="thumb thumb-placeholder">♪</div>`}
                <div class="card-body">
                  <h3 class="card-title">${single.title}</h3>
                  <p class="muted text-sm">${single.artist}</p>
                </div>
              </a>
            `)}
          </div>
        </section>
      ` : ''}

      <section class="section">
        <h2>Community Reviews</h2>
        ${reviews.length ? html`
          <div class="grid-2">
            ${reviews.map((review) => html`
              <article class="card">
                <div class="card-body">
                  <div class="meta-row">
                    ${review.rating ? html`<span class="stars">${renderStars(review.rating)}</span>` : ''}
                    <span class="muted text-xs ml-auto">${safeMemberName({ full_name: review.reviewer_name })} · ${formatDate(review.created_date, lang)}</span>
                  </div>
                  <h3 class="card-title"><a href="${review.album_id ? `/album/${encodeURIComponent(review.album_id)}` : '/reviews'}">${review.title || review.album_title || 'Review'}</a></h3>
                  <p class="excerpt">${String(review.content || '').slice(0, 220)}</p>
                </div>
              </article>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
