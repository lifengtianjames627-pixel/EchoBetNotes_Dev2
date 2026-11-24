import { reviewsBoard } from '../../functions/_content.js';
import { GENRES } from '../../shared/genres.js';
import { safeMemberName } from '../../shared/identity.js';
import { formatDate, html, renderStars, safeUrl } from '../html.js';
import { t } from '../i18n.js';

function reviewItem(review, user, lang) {
  const cover = safeUrl(review.album_cover_url || review.hero_image_url);
  const albumHref = review.album_id ? `/album/${encodeURIComponent(review.album_id)}` : '';
  return html`
    <article class="card review-card" data-review-id="${review.id}">
      ${cover ? html`<img class="thumb" src="${cover}" alt="${review.album_title || review.title || 'Album cover'}" loading="lazy" />` : ''}
      <div class="card-body">
        <div class="meta-row">
          ${review.genre ? html`<span class="pill">${review.genre}</span>` : ''}
          ${review.rating ? html`<span class="stars">${renderStars(review.rating)}</span>` : ''}
        </div>
        <h3 class="card-title">
          ${albumHref ? html`<a href="${albumHref}">${review.title || review.album_title || 'Untitled review'}</a>` : (review.title || 'Untitled story')}
        </h3>
        ${review.album_artist ? html`<p class="muted text-sm">${review.album_title ? `${review.album_title} — ` : ''}${review.album_artist}</p>` : ''}
        <p class="prose-sm" data-translatable>${review.content || ''}</p>
        <div class="action-bar">
          ${user ? html`
            <button type="button" class="btn btn-ghost btn-xs" data-action="vote" data-review-id="${review.id}" data-vote="like">
              ▲ <span data-like-count>${Number(review.likes_count || 0)}</span>
            </button>
            <button type="button" class="btn btn-ghost btn-xs" data-action="vote" data-review-id="${review.id}" data-vote="dislike">
              ▼ <span data-dislike-count>${Number(review.dislikes_count || 0)}</span>
            </button>
          ` : html`<span class="muted text-xs">▲ ${Number(review.likes_count || 0)}</span>`}
          <button type="button" class="btn btn-ghost btn-xs" data-action="translate" data-target-lang="${lang}">
            ${t(lang, 'common.translate')}
          </button>
          <span class="muted text-xs ml-auto">
            ${user && review.reviewer_email
              ? html`<a href="/u/${encodeURIComponent(review.reviewer_email)}">${safeMemberName({ full_name: review.reviewer_name })}</a>`
              : safeMemberName({ full_name: review.reviewer_name })}
            · ${formatDate(review.created_date, lang)}
          </span>
        </div>
      </div>
    </article>
  `;
}

export async function renderReviewsPage({ user, lang }) {
  const board = await reviewsBoard();
  return {
    title: t(lang, 'reviews.title'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="page-title">${t(lang, 'reviews.title')}</h1>
        <p class="muted">${t(lang, 'reviews.subtitle')}</p>
      </section>

      <div class="genre-rail section-tight">
        ${GENRES.map((genre) => html`<a class="genre-chip" style="--chip-accent: ${genre.accent};" href="/genre/${genre.id}">${genre.label}</a>`)}
      </div>

      ${user ? html`
        <details class="card disclosure section-tight">
          <summary class="disclosure-summary">${t(lang, 'reviews.write')}</summary>
          <form class="stack form-pad" data-form="create-story">
            <div class="grid-2">
              <label class="field">
                <span>Kind</span>
                <select name="kind">
                  <option value="story">Essay / Story</option>
                  <option value="genre_roundup">Genre Roundup</option>
                </select>
              </label>
              <label class="field">
                <span>Genre</span>
                <select name="genre">
                  <option value="">Any genre</option>
                  ${GENRES.map((genre) => html`<option value="${genre.entityGenre}">${genre.label}</option>`)}
                </select>
              </label>
            </div>
            <label class="field">
              <span>Title</span>
              <input type="text" name="title" maxlength="200" required />
            </label>
            <label class="field">
              <span>Content</span>
              <textarea name="content" rows="5" required></textarea>
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">Publish</button>
          </form>
        </details>
      ` : ''}

      ${board.editorsPicks.length ? html`
        <section class="section">
          <h2>${t(lang, 'reviews.editorsPicks')}</h2>
          <div class="grid-3">
            ${board.editorsPicks.map((review) => reviewItem(review, user, lang))}
          </div>
        </section>
      ` : ''}

      ${board.popularAlbums.length ? html`
        <section class="section">
          <h2>${t(lang, 'reviews.popularAlbums')}</h2>
          <div class="grid-3">
            ${board.popularAlbums.map((album) => html`
              <a class="card link-card" href="/album/${encodeURIComponent(album.id)}">
                ${safeUrl(album.cover_url) ? html`<img class="thumb" src="${safeUrl(album.cover_url)}" alt="${album.title}" loading="lazy" />` : ''}
                <div class="card-body">
                  <span class="pill">${album.genre || 'music'}</span>
                  <h3 class="card-title">${album.title}</h3>
                  <p class="muted text-sm">${album.artist}</p>
                  <p class="muted text-xs">${album.avg_rating ? `★ ${Number(album.avg_rating).toFixed(1)}` : 'Unrated'} · ${album.review_count || 0} reviews</p>
                </div>
              </a>
            `)}
          </div>
        </section>
      ` : ''}

      <section class="section">
        <h2>${t(lang, 'reviews.recent')}</h2>
        ${board.recentReviews.length ? html`
          <div class="grid-2">
            ${board.recentReviews.map((review) => reviewItem(review, user, lang))}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
