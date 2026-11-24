import { entity } from '../../entities/repository.js';
import { safeMemberName } from '../../shared/identity.js';
import { formatDate, html } from '../html.js';
import { t } from '../i18n.js';

export async function renderSoulmatePage({ user, lang }) {
  const posts = (await entity('RecruitPost').list({ sort: '-created_date', limit: 100 }))
    .filter((post) => post.created_by_id === user.id || user.role === 'admin' || (post.status === 'active' && (!post.moderation_status || post.moderation_status === 'approved')));

  return {
    title: t(lang, 'soulmate.title'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="page-title">${t(lang, 'soulmate.title')}</h1>
        <p class="muted">${t(lang, 'soulmate.subtitle')}</p>
      </section>

      <aside class="notice-box section-tight" role="note">
        <strong>Safety & Participation</strong>
        <p class="text-sm">${t(lang, 'soulmate.safety')}</p>
      </aside>

      <details class="card disclosure section-tight">
        <summary class="disclosure-summary">Post a recruitment notice</summary>
        <form class="stack form-pad" data-form="publish-recruit">
          <div class="grid-3">
            <label class="field">
              <span>Looking as</span>
              <select name="kind" required>
                <option value="band">Band seeking musician</option>
                <option value="musician">Musician seeking band</option>
              </select>
            </label>
            <label class="field">
              <span>City / Area</span>
              <input type="text" name="city" maxlength="100" />
            </label>
            <label class="field">
              <span>School / Scene</span>
              <input type="text" name="school" maxlength="100" />
            </label>
          </div>
          <label class="field">
            <span>Title</span>
            <input type="text" name="title" maxlength="200" required />
          </label>
          <label class="field">
            <span>Influences / Instruments</span>
            <input type="text" name="influences" maxlength="200" />
          </label>
          <label class="field">
            <span>Description (no phone numbers, social handles, or external links)</span>
            <textarea name="description" rows="4" required></textarea>
          </label>
          <label class="field">
            <span>Poster image (optional, triggers moderator review)</span>
            <input type="file" name="poster_file" accept="image/png,image/jpeg,image/webp" />
          </label>
          <label class="check-row">
            <input type="checkbox" name="agreed" value="true" required />
            <span class="text-xs">I have read the safety notice, will keep contact inside the app, and understand under-18 members need guardian consent before any in-person meeting.</span>
          </label>
          <p class="form-error" data-error hidden></p>
          <button type="submit" class="btn btn-primary">Submit notice</button>
        </form>
      </details>

      <section class="section">
        ${posts.length ? html`
          <div class="grid-2">
            ${posts.map((post) => html`
              <article class="card paper-sheet">
                <div class="meta-row">
                  <span class="pill">${post.kind === 'band' ? 'Band' : 'Musician'}</span>
                  ${post.city ? html`<span class="muted text-xs">${post.city}</span>` : ''}
                  ${post.moderation_status && post.moderation_status !== 'approved' ? html`<span class="pill pill-warn">${post.moderation_status}</span>` : ''}
                  <span class="muted text-xs ml-auto">${formatDate(post.created_date, lang)}</span>
                </div>
                <h2 class="card-title">${post.title}</h2>
                ${post.influences ? html`<p class="muted text-sm">${post.influences}</p>` : ''}
                <p class="prose-sm">${post.description || ''}</p>
                <div class="action-bar">
                  <span class="muted text-xs">${safeMemberName({ full_name: post.author_name })}</span>
                  ${post.poster_asset_id ? html`
                    <button type="button" class="btn btn-ghost btn-xs" data-action="load-poster" data-post-id="${post.id}">View poster</button>
                  ` : ''}
                  ${post.author_email && post.author_email !== user.email ? html`
                    <a class="btn btn-secondary btn-xs ml-auto" href="/chat?peer=${encodeURIComponent(post.author_email)}">Message in-app</a>
                    <button type="button" class="btn btn-ghost btn-xs btn-danger" data-action="report-post" data-id="${post.id}" data-title="${post.title}">Report</button>
                  ` : ''}
                </div>
                <div data-poster-slot="${post.id}"></div>
              </article>
            `)}
          </div>
        ` : html`<p class="muted">${t(lang, 'common.empty')}</p>`}
      </section>
    `,
  };
}
