import { entity } from '../../entities/repository.js';
import { safeMemberName } from '../../shared/identity.js';
import { formatDate, html } from '../html.js';
import { t } from '../i18n.js';

export async function renderModerationPage({ lang, query }) {
  const statusFilter = ['pending_review', 'blocked', 'approved', 'all'].includes(query?.status)
    ? query.status
    : 'pending_review';
  const filter = statusFilter === 'all' ? {} : { moderation_status: statusFilter };

  const [reviews, comments, recruits, reports] = await Promise.all([
    entity('Review').list({ filter, sort: '-created_date', limit: 100 }),
    entity('Comment').list({ filter, sort: '-created_date', limit: 100 }),
    entity('RecruitPost').list({ filter, sort: '-created_date', limit: 100 }),
    entity('Report').list({ sort: '-created_date', limit: 50 }),
  ]);

  return {
    title: t(lang, 'moderation.title'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">Administration</p>
        <h1 class="page-title">${t(lang, 'moderation.title')}</h1>
        <div class="action-bar">
          ${['pending_review', 'blocked', 'approved', 'all'].map((tab) => html`
            <a class="btn btn-sm ${statusFilter === tab ? 'btn-primary' : 'btn-ghost'}" href="/moderation?status=${tab}">${tab.replace('_', ' ')}</a>
          `)}
          <a class="text-link text-sm ml-auto" href="/moderation/stats">Site Stats →</a>
        </div>
      </section>

      <section class="section">
        <h2>Reviews (${reviews.length})</h2>
        <div class="stack">
          ${reviews.map((item) => html`
            <article class="card paper-sheet">
              <div class="meta-row">
                <strong>${item.title || item.album_title || 'Review'}</strong>
                <span class="pill">${item.moderation_status || 'approved'}</span>
                <span class="muted text-xs ml-auto">${safeMemberName({ full_name: item.reviewer_name })} · ${formatDate(item.created_date, lang)}</span>
              </div>
              <p class="prose-sm">${item.content || ''}</p>
              <div class="action-bar">
                <button type="button" class="btn btn-primary btn-xs" data-action="moderate-review" data-id="${item.id}" data-status="approved">Approve</button>
                <button type="button" class="btn btn-danger btn-xs" data-action="moderate-review" data-id="${item.id}" data-status="blocked">Block</button>
              </div>
            </article>
          `)}
          ${reviews.length === 0 ? html`<p class="muted">${t(lang, 'common.empty')}</p>` : ''}
        </div>
      </section>

      <section class="section">
        <h2>Comments (${comments.length})</h2>
        <div class="stack">
          ${comments.map((item) => html`
            <article class="card paper-sheet">
              <div class="meta-row">
                <strong>${safeMemberName({ full_name: item.author_name })}</strong>
                <span class="pill">${item.moderation_status || 'approved'}</span>
                <span class="muted text-xs ml-auto">${formatDate(item.created_date, lang)}</span>
              </div>
              <p class="prose-sm">${item.content || ''}</p>
              <div class="action-bar">
                <button type="button" class="btn btn-primary btn-xs" data-action="moderate-entity" data-entity="Comment" data-id="${item.id}" data-status="approved">Approve</button>
                <button type="button" class="btn btn-danger btn-xs" data-action="moderate-entity" data-entity="Comment" data-id="${item.id}" data-status="blocked">Block</button>
              </div>
            </article>
          `)}
          ${comments.length === 0 ? html`<p class="muted">${t(lang, 'common.empty')}</p>` : ''}
        </div>
      </section>

      <section class="section">
        <h2>Recruitment Notices (${recruits.length})</h2>
        <div class="stack">
          ${recruits.map((item) => html`
            <article class="card paper-sheet">
              <div class="meta-row">
                <strong>${item.title}</strong>
                <span class="pill">${item.moderation_status || 'pending_review'}</span>
                <span class="muted text-xs ml-auto">${safeMemberName({ full_name: item.author_name })}</span>
              </div>
              <p class="prose-sm">${item.description || ''}</p>
              <div class="action-bar">
                <button type="button" class="btn btn-primary btn-xs" data-action="moderate-entity" data-entity="RecruitPost" data-id="${item.id}" data-status="approved">Approve</button>
                <button type="button" class="btn btn-danger btn-xs" data-action="moderate-entity" data-entity="RecruitPost" data-id="${item.id}" data-status="blocked">Block</button>
              </div>
            </article>
          `)}
          ${recruits.length === 0 ? html`<p class="muted">${t(lang, 'common.empty')}</p>` : ''}
        </div>
      </section>

      <section class="section">
        <h2>Reports (${reports.length})</h2>
        <div class="stack">
          ${reports.map((report) => html`
            <article class="card paper-sheet">
              <div class="meta-row">
                <strong>${report.target_type || 'Report'}</strong>
                <span class="muted text-xs ml-auto">${formatDate(report.created_date, lang)}</span>
              </div>
              <p class="prose-sm">${report.reason || report.details || ''}</p>
            </article>
          `)}
          ${reports.length === 0 ? html`<p class="muted">${t(lang, 'common.empty')}</p>` : ''}
        </div>
      </section>
    `,
  };
}

export async function renderStatsPage({ lang }) {
  const [users, albums, reviews, podcasts] = await Promise.all([
    entity('User').list({ limit: 1000 }),
    entity('Album').list({ limit: 1000 }),
    entity('Review').list({ limit: 1000 }),
    entity('Podcast').list({ limit: 1000 }),
  ]);

  return {
    title: 'Site Statistics',
    body: html`
      <p class="section-tight"><a class="text-link" href="/moderation">← Moderation Queue</a></p>
      <section class="page-head">
        <p class="eyebrow">Administration</p>
        <h1 class="page-title">Site Statistics</h1>
      </section>
      <div class="grid-4 section">
        <div class="card paper-sheet stat-card"><span class="stat-num">${users.length}</span><span class="muted text-sm">Members</span></div>
        <div class="card paper-sheet stat-card"><span class="stat-num">${albums.length}</span><span class="muted text-sm">Releases</span></div>
        <div class="card paper-sheet stat-card"><span class="stat-num">${reviews.length}</span><span class="muted text-sm">Reviews</span></div>
        <div class="card paper-sheet stat-card"><span class="stat-num">${podcasts.length}</span><span class="muted text-sm">Podcasts</span></div>
      </div>
      <p class="muted text-xs">Totals reflect up to 1,000 records per collection. Private direct messages are never counted or inspected here.</p>
    `,
  };
}

export async function renderManagePage({ lang }) {
  const users = await entity('User').list({ sort: '-created_date', limit: 500 });

  return {
    title: t(lang, 'nav.manage'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">Administration</p>
        <h1 class="page-title">Members (${users.length})</h1>
      </section>
      <div class="card paper-sheet table-wrap section">
        <table class="data-table">
          <thead>
            <tr>
              <th>Display name</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((member) => html`
              <tr>
                <td><a class="text-link" href="/u/${encodeURIComponent(member.email)}">${safeMemberName(member)}</a></td>
                <td><span class="pill">${member.role || 'user'}</span></td>
                <td class="muted text-sm">${formatDate(member.created_date, lang)}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `,
  };
}
