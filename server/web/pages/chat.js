import { entity } from '../../entities/repository.js';
import { chatDirectory } from '../../functions/_social.js';
import { chatIdFor, normalizeEmail, safeMemberName } from '../../shared/identity.js';
import { formatDate, html, safeUrl } from '../html.js';
import { t } from '../i18n.js';

export async function renderChatPage({ user, lang, query }) {
  const directory = await chatDirectory({ user });
  const peerEmail = normalizeEmail(query?.peer || query?.to || directory.conversations[0]?.peer_email || '');

  const [thread, incomingRequests] = await Promise.all([
    peerEmail
      ? entity('ChatMessage').list({ filter: { chat_id: chatIdFor(user.email, peerEmail) }, sort: 'created_date', limit: 200 })
      : Promise.resolve([]),
    entity('FriendRequest').list({ filter: { to_email: user.email, status: 'pending' }, sort: '-created_date', limit: 20 }),
  ]);

  const peerRecord = peerEmail
    ? (await entity('User').list({ filter: { email: peerEmail }, limit: 1 }))[0] || null
    : null;
  const peerDisplayName = peerRecord ? safeMemberName(peerRecord) : '';

  return {
    title: t(lang, 'chat.title'),
    body: html`
      <section class="page-head">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="page-title">${t(lang, 'chat.title')}</h1>
        <p class="muted">${t(lang, 'chat.subtitle')}</p>
      </section>

      ${incomingRequests.length ? html`
        <section class="card paper-sheet section-tight">
          <h2>Pending Friend Requests (${incomingRequests.length})</h2>
          <div class="stack">
            ${incomingRequests.map((req) => html`
              <div class="meta-row">
                <strong>${safeMemberName({ full_name: req.from_name })}</strong>
                ${req.message ? html`<span class="muted text-sm">— ${req.message}</span>` : ''}
                <div class="action-bar ml-auto">
                  <button type="button" class="btn btn-primary btn-xs" data-action="respond-friend" data-id="${req.id}" data-status="accepted">Accept</button>
                  <button type="button" class="btn btn-ghost btn-xs" data-action="respond-friend" data-id="${req.id}" data-status="declined">Decline</button>
                </div>
              </div>
            `)}
          </div>
        </section>
      ` : ''}

      <section class="chat-layout section">
        <aside class="card paper-sheet chat-sidebar">
          <h2>Find Member</h2>
          <form class="stack-sm" data-form="search-users">
            <input type="search" name="query" placeholder="Search by display name…" minlength="2" maxlength="100" required />
            <button type="submit" class="btn btn-secondary btn-xs">Search</button>
          </form>
          <ul class="plain-list" data-search-results></ul>

          <hr class="divider" />
          <h2>Conversations</h2>
          ${directory.conversations.length ? html`
            <ul class="plain-list">
              ${directory.conversations.map((conv) => html`
                <li>
                  <a class="chat-peer ${conv.peer_email === peerEmail ? 'is-active' : ''}" href="/chat?peer=${encodeURIComponent(conv.peer_email)}">
                    <strong>${safeMemberName({ full_name: conv.peer_name })}</strong>
                    ${conv.unread ? html`<span class="badge-count">new</span>` : ''}
                    <span class="muted text-xs block">${String(conv.last_message || '').slice(0, 60)}</span>
                  </a>
                </li>
              `)}
            </ul>
          ` : html`<p class="muted text-sm">No conversations yet.</p>`}

          <hr class="divider" />
          <h2>Members</h2>
          <ul class="plain-list">
            ${directory.nearby.map((member) => html`
              <li>
                <a class="chat-peer ${member.email === peerEmail ? 'is-active' : ''}" href="/chat?peer=${encodeURIComponent(member.email)}">
                  <span>${member.name}</span>
                  ${member.online ? html`<span class="dot-online" title="Recently active"></span>` : ''}
                </a>
              </li>
            `)}
          </ul>
        </aside>

        <div class="card paper-sheet chat-main">
          ${peerEmail && peerRecord ? html`
            <div class="chat-header">
              <h2><a href="/u/${encodeURIComponent(peerEmail)}">${peerDisplayName}</a></h2>
            </div>

            <div class="chat-messages">
              ${thread.length ? thread.map((msg) => {
                const mine = normalizeEmail(msg.sender_email) === normalizeEmail(user.email);
                const attachment = safeUrl(msg.attachment_url);
                return html`
                  <div class="bubble ${mine ? 'bubble-me' : 'bubble-peer'}">
                    <p>${msg.content}</p>
                    ${attachment ? html`<p><a class="text-link text-xs" href="${attachment}" target="_blank" rel="noopener noreferrer">${msg.attachment_name || 'Attachment'}</a></p>` : ''}
                    <span class="muted text-xs">${formatDate(msg.created_date, lang)}</span>
                  </div>
                `;
              }) : html`<p class="muted text-sm">Start the conversation below. Keep all contact in-app.</p>`}
            </div>

            <form class="stack" data-form="send-chat">
              <input type="hidden" name="peer_email" value="${peerEmail}" />
              <textarea name="content" rows="3" maxlength="2000" placeholder="Write a message… (no external contact handles)" required></textarea>
              <div class="action-bar">
                <input type="file" name="attachment_file" accept="image/png,image/jpeg,image/webp,application/pdf" />
                <button type="submit" class="btn btn-primary btn-sm ml-auto">Send</button>
              </div>
              <p class="form-error" data-error hidden></p>
            </form>
          ` : html`
            <p class="muted">Select a member from the list or search by display name to begin a private conversation.</p>
          `}
        </div>
      </section>
    `,
  };
}
