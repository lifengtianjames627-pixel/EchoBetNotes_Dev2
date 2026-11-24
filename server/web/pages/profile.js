import { entity } from '../../entities/repository.js';
import { BADGES, BADGE_MAP } from '../../shared/badgeIds.js';
import { GENRES } from '../../shared/genres.js';
import { normalizeEmail, safeMemberName } from '../../shared/identity.js';
import { isVisibleReview } from '../../shared/reviews.js';
import { formatDate, html, initialOf, renderStars, safeUrl } from '../html.js';
import { t } from '../i18n.js';

export async function renderProfilePage({ user, lang }) {
  const [reviews, earnedRows, subscriptions] = await Promise.all([
    entity('Review').list({ filter: { created_by_id: user.id }, sort: '-created_date', limit: 50 }),
    entity('UserBadge').list({ filter: { user_email: user.email }, limit: 100 }),
    entity('Subscription').list({ filter: { subscriber_email: user.email }, limit: 100 }),
  ]);
  const earnedIds = new Set(earnedRows.map((row) => row.badge_id));
  const equipped = new Set(user.equipped_badges || []);
  const avatar = safeUrl(user.profile_picture_url);
  const name = safeMemberName(user);
  const prefs = new Set((user.music_preferences || []).map((item) => String(item).toLowerCase()));

  return {
    title: t(lang, 'profile.title'),
    body: html`
      <section class="card paper-sheet profile-hero">
        ${avatar
          ? html`<img class="avatar-lg" src="${avatar}" alt="${name}" />`
          : html`<div class="avatar-lg avatar-monogram">${initialOf(name)}</div>`}
        <div class="stack">
          <p class="eyebrow">${user.role === 'admin' ? 'Administrator' : 'Member'}</p>
          <h1 class="page-title">${name}</h1>
          <p class="muted text-sm">${user.bio || 'No bio added yet.'}</p>
          <div class="meta-row">
            <span class="pill">${reviews.length} reviews</span>
            <span class="pill">${earnedIds.size} badges</span>
            <span class="pill">${subscriptions.length} following</span>
          </div>
        </div>
      </section>

      <div class="grid-2 section">
        <section class="card paper-sheet">
          <h2>Edit Profile</h2>
          <form class="stack" data-form="update-profile">
            <label class="field">
              <span>Display name</span>
              <input type="text" name="display_name" value="${user.display_name || user.full_name || ''}" maxlength="120" required />
            </label>
            <label class="field">
              <span>Bio</span>
              <textarea name="bio" rows="3" maxlength="500">${user.bio || ''}</textarea>
            </label>
            <fieldset class="field">
              <legend>Music preferences</legend>
              <div class="chip-grid">
                ${GENRES.map((genre) => html`
                  <label class="check-chip">
                    <input type="checkbox" name="music_preferences" value="${genre.entityGenre}" ${prefs.has(genre.entityGenre) ? 'checked' : ''} />
                    <span>${genre.label}</span>
                  </label>
                `)}
              </div>
            </fieldset>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">Save profile</button>
          </form>
        </section>

        <section class="card paper-sheet">
          <h2>Profile Picture</h2>
          <form class="stack" data-form="upload-avatar">
            <label class="field">
              <span>Upload image (PNG, JPG, WebP)</span>
              <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required />
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-secondary">Upload Avatar</button>
          </form>

          <hr class="divider" />
          <h2>Badges (${earnedIds.size} / ${BADGES.length})</h2>
          <p class="muted text-xs">Equip up to 4 earned badges to display alongside your name.</p>
          <div class="badge-grid">
            ${BADGES.filter((badge) => earnedIds.has(badge.id)).map((badge) => html`
              <button
                type="button"
                class="badge-tile ${equipped.has(badge.id) ? 'is-equipped' : ''}"
                data-action="toggle-badge"
                data-badge-id="${badge.id}"
                data-equipped="${[...equipped].join(',')}"
              >
                <strong>${badge.name}</strong>
                <span class="text-xs muted">${badge.desc}</span>
              </button>
            `)}
            ${earnedIds.size === 0 ? html`<p class="muted text-sm">Write reviews and join conversations to earn badges.</p>` : ''}
          </div>
        </section>
      </div>

      <section class="section">
        <h2>Your Reviews</h2>
        ${reviews.length ? html`
          <div class="grid-2">
            ${reviews.map((review) => html`
              <article class="card">
                <div class="card-body">
                  <div class="meta-row">
                    ${review.rating ? html`<span class="stars">${renderStars(review.rating)}</span>` : ''}
                    ${review.moderation_status && review.moderation_status !== 'approved' ? html`<span class="pill pill-warn">${review.moderation_status}</span>` : ''}
                    <span class="muted text-xs ml-auto">${formatDate(review.created_date, lang)}</span>
                  </div>
                  <h3 class="card-title"><a href="${review.album_id ? `/album/${encodeURIComponent(review.album_id)}` : '/reviews'}">${review.title || review.album_title || 'Review'}</a></h3>
                  <p class="excerpt">${String(review.content || '').slice(0, 180)}</p>
                </div>
              </article>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}

export async function renderProfileSetupPage({ user, lang }) {
  return renderProfilePage({ user, lang });
}

export async function renderMemberProfilePage({ user, lang, params }) {
  const targetEmail = normalizeEmail(decodeURIComponent(params.email || ''));
  const target = (await entity('User').list({ filter: { email: targetEmail }, limit: 1 }))[0] || null;
  if (!target) {
    return {
      statusCode: 404,
      title: 'Member not found',
      body: html`<section class="card paper-sheet"><h1>Member not found</h1><p><a class="text-link" href="/reviews">Back to Reviews</a></p></section>`,
    };
  }

  const [reviews, subscriptions] = await Promise.all([
    entity('Review').list({ filter: { reviewer_email: target.email }, sort: '-created_date', limit: 30 }),
    entity('Subscription').list({ filter: { subscriber_email: user.email, target_email: target.email }, limit: 1 }),
  ]);
  const visible = reviews.filter((review) => isVisibleReview(review, user));
  const isMe = target.id === user.id;
  const isFollowing = subscriptions.length > 0;
  const name = safeMemberName(target);
  const avatar = safeUrl(target.profile_picture_url);

  return {
    title: name,
    body: html`
      <section class="card paper-sheet profile-hero">
        ${avatar
          ? html`<img class="avatar-lg" src="${avatar}" alt="${name}" />`
          : html`<div class="avatar-lg avatar-monogram">${initialOf(name)}</div>`}
        <div class="stack">
          <h1 class="page-title">${name}</h1>
          ${target.bio ? html`<p class="muted text-sm">${target.bio}</p>` : ''}
          <div class="meta-row">
            ${(target.equipped_badges || []).map((id) => BADGE_MAP[id] ? html`<span class="pill">${BADGE_MAP[id].name}</span>` : '')}
          </div>
          ${!isMe ? html`
            <div class="action-bar">
              <a class="btn btn-primary btn-sm" href="/chat?peer=${encodeURIComponent(target.email)}">Message</a>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                data-action="toggle-follow"
                data-target-email="${target.email}"
                data-target-name="${name}"
                data-sub-id="${subscriptions[0]?.id || ''}"
              >${isFollowing ? 'Unfollow' : 'Follow'}</button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                data-action="send-friend-request"
                data-target-id="${target.id}"
              >Add Friend</button>
            </div>
          ` : html`<a class="text-link text-sm" href="/profile">Edit your profile →</a>`}
        </div>
      </section>

      <section class="section">
        <h2>Reviews by ${name} (${visible.length})</h2>
        ${visible.length ? html`
          <div class="grid-2">
            ${visible.map((review) => html`
              <article class="card">
                <div class="card-body">
                  <div class="meta-row">
                    ${review.rating ? html`<span class="stars">${renderStars(review.rating)}</span>` : ''}
                    <span class="muted text-xs ml-auto">${formatDate(review.created_date, lang)}</span>
                  </div>
                  <h3 class="card-title"><a href="${review.album_id ? `/album/${encodeURIComponent(review.album_id)}` : '/reviews'}">${review.title || review.album_title || 'Review'}</a></h3>
                  <p class="excerpt">${String(review.content || '').slice(0, 200)}</p>
                </div>
              </article>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
