import { entity } from '../../entities/repository.js';
import { normalizeEmail, safeMemberName } from '../../shared/identity.js';
import { isVisibleReview } from '../../shared/reviews.js';
import { formatDate, html, renderStars, safeUrl } from '../html.js';
import { t } from '../i18n.js';

export async function renderAlbumPage({ user, lang, params }) {
  const album = await entity('Album').find(params.id);
  if (!album) {
    return {
      statusCode: 404,
      title: 'Release not found',
      body: html`<section class="card paper-sheet"><h1>Release not found</h1><p><a class="text-link" href="/discover">Back to Discover</a></p></section>`,
    };
  }

  const reviews = (await entity('Review').list({
    filter: { album_id: album.id },
    sort: '-created_date',
    limit: 100,
  })).filter((review) => isVisibleReview(review, user));

  const reviewIds = reviews.map((review) => review.id);
  const allComments = reviewIds.length
    ? (await entity('Comment').list({ filter: { review_id: { $in: reviewIds } }, sort: 'created_date', limit: 300 }))
      .filter((comment) => !comment.moderation_status || comment.moderation_status === 'approved' || user?.role === 'admin' || comment.created_by_id === user?.id)
    : [];
  const commentsByReview = new Map();
  for (const comment of allComments) {
    const bucket = commentsByReview.get(comment.review_id) || [];
    bucket.push(comment);
    commentsByReview.set(comment.review_id, bucket);
  }

  const cover = safeUrl(album.cover_url);
  return {
    title: `${album.title} — ${album.artist}`,
    body: html`
      <p class="section-tight"><a class="text-link" href="/genre/${encodeURIComponent(album.genre || 'rock')}">← ${album.genre || 'Back'}</a></p>

      <section class="card paper-sheet album-header">
        ${cover ? html`<img class="album-cover" src="${cover}" alt="${album.title}" />` : html`<div class="album-cover thumb-placeholder">♪</div>`}
        <div class="stack">
          <div class="meta-row">
            <span class="pill">${album.genre || 'music'}</span>
            ${album.type ? html`<span class="pill">${album.type}</span>` : ''}
            ${album.release_year ? html`<span class="muted text-sm">${album.release_year}</span>` : ''}
          </div>
          <h1 class="page-title">${album.title}</h1>
          <p class="lead">${album.artist}</p>
          <p class="muted text-sm">
            ${album.avg_rating ? `★ ${Number(album.avg_rating).toFixed(1)} average` : 'No rating yet'}
            · ${album.review_count || reviews.length} reviews
          </p>
          ${album.description ? html`<p class="prose-sm">${album.description}</p>` : ''}
        </div>
      </section>

      ${user ? html`
        <section class="card paper-sheet section">
          <h2>Write a Review</h2>
          <form class="stack" data-form="create-review">
            <input type="hidden" name="album_id" value="${album.id}" />
            <input type="hidden" name="album_title" value="${album.title}" />
            <input type="hidden" name="album_artist" value="${album.artist}" />
            <input type="hidden" name="album_cover_url" value="${album.cover_url || ''}" />
            <input type="hidden" name="genre" value="${album.genre || ''}" />
            <div class="grid-2">
              <label class="field">
                <span>Title</span>
                <input type="text" name="title" maxlength="200" placeholder="Headline for your notes…" required />
              </label>
              <label class="field">
                <span>Rating (1–5)</span>
                <select name="rating" required>
                  <option value="5">5 — Essential</option>
                  <option value="4">4 — Strong</option>
                  <option value="3">3 — Solid</option>
                  <option value="2">2 — Mixed</option>
                  <option value="1">1 — Skip</option>
                </select>
              </label>
            </div>
            <label class="field">
              <span>Your review</span>
              <textarea name="content" rows="5" required></textarea>
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">Publish Review</button>
          </form>
        </section>
      ` : html`
        <p class="section muted"><a class="text-link" href="/login?next=${encodeURIComponent(`/album/${album.id}`)}">${t(lang, 'common.signInToAct')}</a></p>
      `}

      <section class="section">
        <h2>Reviews (${reviews.length})</h2>
        ${reviews.length ? html`
          <div class="stack-lg">
            ${reviews.map((review) => {
              const isAuthor = Boolean(user && (review.created_by_id === user.id || normalizeEmail(review.reviewer_email) === normalizeEmail(user.email)));
              const comments = commentsByReview.get(review.id) || [];
              return html`
                <article class="card paper-sheet" data-review-id="${review.id}">
                  <div class="meta-row">
                    <span class="stars">${renderStars(review.rating)}</span>
                    ${review.moderation_status && review.moderation_status !== 'approved' ? html`<span class="pill pill-warn">${review.moderation_status}</span>` : ''}
                    <span class="muted text-xs ml-auto">
                      ${user && review.reviewer_email
                        ? html`<a href="/u/${encodeURIComponent(review.reviewer_email)}">${safeMemberName({ full_name: review.reviewer_name })}</a>`
                        : safeMemberName({ full_name: review.reviewer_name })}
                      · ${formatDate(review.created_date, lang)}
                    </span>
                  </div>
                  ${review.title ? html`<h3 class="card-title">${review.title}</h3>` : ''}
                  <p class="prose" data-translatable>${review.content || ''}</p>
                  <div class="action-bar">
                    ${user ? html`
                      <button type="button" class="btn btn-ghost btn-xs" data-action="vote" data-review-id="${review.id}" data-vote="like">
                        ▲ <span data-like-count>${Number(review.likes_count || 0)}</span>
                      </button>
                      <button type="button" class="btn btn-ghost btn-xs" data-action="vote" data-review-id="${review.id}" data-vote="dislike">
                        ▼ <span data-dislike-count>${Number(review.dislikes_count || 0)}</span>
                      </button>
                    ` : html`<span class="muted text-xs">▲ ${Number(review.likes_count || 0)}</span>`}
                    <button type="button" class="btn btn-ghost btn-xs" data-action="translate" data-target-lang="${lang}">${t(lang, 'common.translate')}</button>
                    ${isAuthor || user?.role === 'admin' ? html`
                      <button type="button" class="btn btn-ghost btn-xs btn-danger ml-auto" data-action="delete-entity" data-entity="Review" data-id="${review.id}">Delete</button>
                    ` : ''}
                  </div>

                  ${isAuthor ? html`
                    <details class="disclosure-inline">
                      <summary class="text-xs text-link">Edit review</summary>
                      <form class="stack form-pad-sm" data-form="edit-review" data-id="${review.id}" data-expected-edit="${review.edited_at || ''}">
                        <div class="grid-2">
                          <label class="field">
                            <span>Title</span>
                            <input type="text" name="title" value="${review.title || ''}" />
                          </label>
                          <label class="field">
                            <span>Rating</span>
                            <input type="number" name="rating" min="1" max="5" value="${review.rating || 5}" />
                          </label>
                        </div>
                        <label class="field">
                          <span>Content</span>
                          <textarea name="content" rows="4" required>${review.content || ''}</textarea>
                        </label>
                        <p class="form-error" data-error hidden></p>
                        <button type="submit" class="btn btn-secondary btn-sm">Save changes</button>
                      </form>
                    </details>
                  ` : ''}

                  <div class="comments-block">
                    <p class="eyebrow">Comments (${comments.length})</p>
                    ${comments.map((comment) => html`
                      <div class="comment-row">
                        <div class="meta-row">
                          <strong class="text-xs">${safeMemberName({ full_name: comment.author_name })}</strong>
                          <span class="muted text-xs">${formatDate(comment.created_date, lang)}</span>
                          ${user && (user.role === 'admin' || comment.created_by_id === user.id) ? html`
                            <button type="button" class="btn btn-ghost btn-xs btn-danger ml-auto" data-action="delete-entity" data-entity="Comment" data-id="${comment.id}">Remove</button>
                          ` : ''}
                        </div>
                        <p class="text-sm">${comment.content}</p>
                      </div>
                    `)}
                    ${user ? html`
                      <form class="comment-form" data-form="create-comment">
                        <input type="hidden" name="review_id" value="${review.id}" />
                        <input type="text" name="content" placeholder="Add a comment…" required />
                        <button type="submit" class="btn btn-secondary btn-sm">Post</button>
                      </form>
                    ` : ''}
                  </div>
                </article>
              `;
            })}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
