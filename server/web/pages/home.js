import { homeFeed } from '../../functions/_content.js';
import { GENRES } from '../../shared/genres.js';
import { safeMemberName } from '../../shared/identity.js';
import { formatDate, html, renderStars, safeUrl } from '../html.js';
import { t } from '../i18n.js';

function reviewCard(review, lang) {
  const cover = safeUrl(review.album_cover_url || review.hero_image_url);
  const target = review.album_id ? `/album/${encodeURIComponent(review.album_id)}` : '/reviews';
  return html`
    <article class="card review-card">
      ${cover ? html`<img class="thumb" src="${cover}" alt="${review.album_title || review.title || 'Cover'}" loading="lazy" />` : ''}
      <div class="card-body">
        <div class="meta-row">
          ${review.genre ? html`<span class="pill">${review.genre}</span>` : ''}
          ${review.rating ? html`<span class="stars" aria-label="${review.rating} out of 5">${renderStars(review.rating)}</span>` : ''}
        </div>
        <h3 class="card-title"><a href="${target}">${review.title || review.album_title || 'Untitled review'}</a></h3>
        ${review.album_artist ? html`<p class="muted text-sm">${review.album_artist}</p>` : ''}
        <p class="excerpt">${String(review.content || '').slice(0, 180)}${String(review.content || '').length > 180 ? '…' : ''}</p>
        <div class="meta-row meta-footer">
          <span>${safeMemberName({ full_name: review.reviewer_name })}</span>
          <span>${formatDate(review.created_date, lang)}</span>
        </div>
      </div>
    </article>
  `;
}

export async function renderHomePage({ user, lang }) {
  const feed = await homeFeed({ user });
  return {
    title: t(lang, 'nav.home'),
    body: html`
      <section class="hero paper-sheet">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="display-title">${t(lang, 'site.tagline')}</h1>
        <div class="rule-short"></div>
        <div class="grid-3 hero-cards">
          <a class="card link-card" href="/reviews">
            <h2>${t(lang, 'home.reviews')}</h2>
            <p class="muted">${t(lang, 'home.reviewsDesc')}</p>
          </a>
          <a class="card link-card" href="/podcasts">
            <h2>${t(lang, 'home.podcasts')}</h2>
            <p class="muted">${t(lang, 'home.podcastsDesc')}</p>
          </a>
          <a class="card link-card" href="/soulmate">
            <h2>${t(lang, 'home.soulmate')}</h2>
            <p class="muted">${t(lang, 'home.soulmateDesc')}</p>
          </a>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>${t(lang, 'home.genres')}</h2>
          <a class="text-link" href="/discover">${t(lang, 'nav.discover')} →</a>
        </div>
        <div class="genre-rail">
          ${GENRES.map((genre) => html`
            <a class="genre-chip" style="--chip-accent: ${genre.accent};" href="/genre/${genre.id}">
              <span>${genre.label}</span>
            </a>
          `)}
        </div>
      </section>

      ${feed.forYou?.length ? html`
        <section class="section">
          <div class="section-head">
            <h2>${t(lang, 'home.forYou')}</h2>
            <span class="muted text-sm">${feed.tasteLabels}</span>
          </div>
          <div class="grid-3">
            ${feed.forYou.map((review) => reviewCard(review, lang))}
          </div>
        </section>
      ` : ''}

      <section class="section">
        <div class="section-head">
          <h2>${t(lang, 'home.recentReviews')}</h2>
          <a class="text-link" href="/reviews">${t(lang, 'nav.reviews')} →</a>
        </div>
        ${feed.recentReviews.length ? html`
          <div class="grid-3">
            ${feed.recentReviews.map((review) => reviewCard(review, lang))}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>

      <section class="section">
        <div class="section-head">
          <h2>${t(lang, 'home.recentPodcasts')}</h2>
          <a class="text-link" href="/podcasts">${t(lang, 'nav.podcasts')} →</a>
        </div>
        ${feed.recentPodcasts.length ? html`
          <div class="grid-2">
            ${feed.recentPodcasts.map((episode) => html`
              <article class="card">
                <div class="card-body">
                  <p class="eyebrow">${episode.category || 'Podcast'}</p>
                  <h3 class="card-title"><a href="/podcasts/${encodeURIComponent(episode.category || 'youth_ears_lab')}">${episode.title}</a></h3>
                  <p class="muted text-sm">${episode.host_name || ''}${episode.duration_minutes ? ` · ${episode.duration_minutes} min` : ''}</p>
                  <p class="excerpt">${String(episode.description || '').slice(0, 160)}</p>
                </div>
              </article>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
