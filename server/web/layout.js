import { safeMemberName } from '../shared/identity.js';
import { html, renderHtml } from './html.js';
import { LANGUAGES, t } from './i18n.js';

export function renderPage({
  title,
  lang = 'en',
  user = null,
  currentPath = '/',
  unreadCount = 0,
  body,
  accent = '#bf7a35',
}) {
  const navItems = [
    { href: '/', label: t(lang, 'nav.home') },
    { href: '/reviews', label: t(lang, 'nav.reviews') },
    { href: '/discover', label: t(lang, 'nav.discover') },
    { href: '/podcasts', label: t(lang, 'nav.podcasts') },
    { href: '/soulmate', label: t(lang, 'nav.soulmate') },
    { href: '/about', label: t(lang, 'nav.about') },
  ];

  const isActive = (href) => (href === '/' ? currentPath === '/' : currentPath.startsWith(href));
  const fullTitle = title ? `${title} — ${t(lang, 'site.name')}` : t(lang, 'site.name');

  const doc = html`<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fullTitle}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles/paper.css" />
</head>
<body style="--page-accent: ${accent};" data-lang="${lang}">
  <header class="topbar">
    <div class="topbar-inner container">
      <a class="brand" href="/">
        <span class="brand-mark" aria-hidden="true">♪</span>
        <span class="brand-name">${t(lang, 'site.name')}</span>
      </a>

      <nav class="nav-links" aria-label="Main navigation">
        ${navItems.map((item) => html`<a class="nav-link ${isActive(item.href) ? 'is-active' : ''}" href="${item.href}">${item.label}</a>`)}
      </nav>

      <div class="topbar-actions">
        <form class="lang-picker" method="get" action="/lang">
          <input type="hidden" name="next" value="${currentPath}" />
          <label class="sr-only" for="site-lang">Language</label>
          <select id="site-lang" name="code" class="select-compact" onchange="this.form.submit()">
            ${LANGUAGES.map((item) => html`<option value="${item.code}" ${item.code === lang ? 'selected' : ''}>${item.label}</option>`)}
          </select>
        </form>

        ${user ? html`
          <a class="nav-pill ${isActive('/chat') ? 'is-active' : ''}" href="/chat">
            ${t(lang, 'nav.messages')}${unreadCount > 0 ? html` <span class="badge-count">${unreadCount}</span>` : ''}
          </a>
          ${user.role === 'admin' ? html`
            <a class="nav-pill ${isActive('/moderation') ? 'is-active' : ''}" href="/moderation">${t(lang, 'nav.moderation')}</a>
            <a class="nav-pill ${isActive('/manage') ? 'is-active' : ''}" href="/manage">${t(lang, 'nav.manage')}</a>
          ` : ''}
          <a class="nav-pill ${isActive('/profile') ? 'is-active' : ''}" href="/profile">${safeMemberName(user)}</a>
          <button type="button" class="btn btn-ghost btn-sm" data-action="logout">${t(lang, 'nav.logout')}</button>
        ` : html`
          <a class="btn btn-primary btn-sm" href="/login?next=${encodeURIComponent(currentPath)}">${t(lang, 'nav.login')}</a>
        `}
      </div>
    </div>
    <div class="staff-rule" aria-hidden="true"></div>
  </header>

  <main class="main container">
    <div id="toast-region" class="toast-region" aria-live="polite"></div>
    ${body}
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <p class="footer-brand">${t(lang, 'site.name')} — ${t(lang, 'site.tagline')}</p>
      <div class="footer-links">
        <a href="/about">${t(lang, 'nav.about')}</a>
        <a href="/privacy">${t(lang, 'nav.privacy')}</a>
        <a href="/terms">${t(lang, 'nav.terms')}</a>
      </div>
    </div>
  </footer>

  <script type="module" src="/js/app.js"></script>
</body>
</html>`;

  return renderHtml(doc);
}
