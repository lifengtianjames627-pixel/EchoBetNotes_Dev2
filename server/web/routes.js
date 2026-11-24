import { config } from '../config/env.js';
import { messageUnread } from '../functions/_social.js';
import { safeNextPath } from './html.js';
import { langFromRequest, normalizeLang } from './i18n.js';
import { renderPage } from './layout.js';
import { renderAlbumPage } from './pages/album.js';
import { renderChatPage } from './pages/chat.js';
import { renderDiscoverPage } from './pages/discover.js';
import { renderGenrePage } from './pages/genres.js';
import { renderHomePage } from './pages/home.js';
import { renderLoginPage } from './pages/login.js';
import { renderManagePage, renderModerationPage, renderStatsPage } from './pages/moderation.js';
import { renderPodcastSpacePage, renderPodcastsPage } from './pages/podcasts.js';
import { renderMemberProfilePage, renderProfilePage, renderProfileSetupPage } from './pages/profile.js';
import { renderReviewsPage } from './pages/reviews.js';
import { renderSoulmatePage } from './pages/soulmate.js';
import { renderAboutPage, renderErrorPage, renderPrivacyPage, renderTermsPage } from './pages/staticPages.js';

async function sendPage(request, reply, handler, { requireAuth = false, requireAdmin = false } = {}) {
  const lang = langFromRequest(request);
  const currentPath = request.url || '/';

  if ((requireAuth || requireAdmin) && !request.user) {
    return reply.redirect(`/login?next=${encodeURIComponent(safeNextPath(currentPath, '/'))}`);
  }
  if (requireAdmin && request.user.role !== 'admin') {
    const view = renderErrorPage({
      statusCode: 403,
      title: 'Administrator access required',
      message: 'This section is restricted to site administrators.',
    });
    return reply
      .code(403)
      .type('text/html; charset=utf-8')
      .send(renderPage({ ...view, lang, user: request.user, currentPath }));
  }

  let unreadCount = 0;
  if (request.user) {
    try {
      const counts = await messageUnread({ user: request.user });
      unreadCount = Number(counts.unread || 0);
    } catch {
      unreadCount = 0;
    }
  }

  const view = await handler({
    user: request.user,
    lang,
    params: request.params || {},
    query: request.query || {},
  });

  return reply
    .code(view.statusCode || 200)
    .type('text/html; charset=utf-8')
    .send(renderPage({
      ...view,
      lang,
      user: request.user,
      currentPath,
      unreadCount,
    }));
}

export async function webRoutes(app) {
  app.get('/lang', async (request, reply) => {
    const code = normalizeLang(request.query?.code);
    const next = safeNextPath(request.query?.next, '/');
    reply.setCookie('lang', code, {
      path: '/',
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: 365 * 86_400,
    });
    return reply.redirect(next);
  });

  app.get('/', (request, reply) => sendPage(request, reply, renderHomePage));
  app.get('/login', (request, reply) => sendPage(request, reply, renderLoginPage));
  app.get('/reviews', (request, reply) => sendPage(request, reply, renderReviewsPage));
  app.get('/discover', (request, reply) => sendPage(request, reply, renderDiscoverPage));
  app.get('/podcasts', (request, reply) => sendPage(request, reply, renderPodcastsPage));
  app.get('/podcasts/:categoryId', (request, reply) => sendPage(request, reply, renderPodcastSpacePage));
  app.get('/genre/:genreId', (request, reply) => sendPage(request, reply, renderGenrePage));
  app.get('/album/:id', (request, reply) => sendPage(request, reply, renderAlbumPage));
  app.get('/about', (request, reply) => sendPage(request, reply, renderAboutPage));
  app.get('/privacy', (request, reply) => sendPage(request, reply, renderPrivacyPage));
  app.get('/terms', (request, reply) => sendPage(request, reply, renderTermsPage));

  app.get('/profile', (request, reply) => sendPage(request, reply, renderProfilePage, { requireAuth: true }));
  app.get('/profile/setup', (request, reply) => sendPage(request, reply, renderProfileSetupPage, { requireAuth: true }));
  app.get('/u/:email', (request, reply) => sendPage(request, reply, renderMemberProfilePage, { requireAuth: true }));
  app.get('/chat', (request, reply) => sendPage(request, reply, renderChatPage, { requireAuth: true }));
  app.get('/soulmate', (request, reply) => sendPage(request, reply, renderSoulmatePage, { requireAuth: true }));

  app.get('/moderation', (request, reply) => sendPage(request, reply, renderModerationPage, { requireAdmin: true }));
  app.get('/moderation/stats', (request, reply) => sendPage(request, reply, renderStatsPage, { requireAdmin: true }));
  app.get('/manage', (request, reply) => sendPage(request, reply, renderManagePage, { requireAdmin: true }));

  app.get('/band-dashboard', async (_request, reply) => reply.redirect('/soulmate'));
  app.get('/bands', async (_request, reply) => reply.redirect('/soulmate'));
  app.get('/band/:id', async (_request, reply) => reply.redirect('/soulmate'));
}

export function renderNotFoundHtml(request) {
  const lang = langFromRequest(request);
  const view = renderErrorPage({ statusCode: 404 });
  return renderPage({
    ...view,
    lang,
    user: request.user || null,
    currentPath: request.url || '/',
  });
}
