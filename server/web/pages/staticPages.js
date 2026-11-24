import { html } from '../html.js';
import { t } from '../i18n.js';

export function renderAboutPage({ lang }) {
  return {
    title: t(lang, 'nav.about'),
    body: html`
      <section class="narrow">
        <p class="eyebrow">${t(lang, 'site.name')}</p>
        <h1 class="display-title">About Us</h1>
        <div class="rule-short"></div>
        <article class="card paper-sheet section-tight">
          <p class="prose">
            We are a group of students united by a genuine love for music. Across hallway conversations and late-night playlist sessions, we wanted a real home on the internet for people who truly appreciate music across all its forms — not just the mainstream charts.
            <strong>Echoes Between Notes</strong> is a space where every genre gets attention and respect, with honest reviews, podcasts, and direct conversation.
          </p>
        </article>
        <div class="grid-3 section-tight">
          <div class="card paper-sheet"><h3>Every Genre</h3><p class="muted text-sm">From classical to hardcore — no genre left behind.</p></div>
          <div class="card paper-sheet"><h3>Real Passion</h3><p class="muted text-sm">Built by music lovers, for music lovers.</p></div>
          <div class="card paper-sheet"><h3>Community First</h3><p class="muted text-sm">A calm place to share, discover, and connect.</p></div>
        </div>
      </section>
    `,
  };
}

export function renderPrivacyPage({ lang }) {
  return {
    title: t(lang, 'nav.privacy'),
    body: html`
      <section class="narrow">
        <p class="eyebrow">Legal</p>
        <h1 class="display-title">Privacy Policy</h1>
        <div class="rule-short"></div>
        <article class="card paper-sheet stack">
          <div>
            <h2>What we collect</h2>
            <p class="prose-sm">Your email and display name for your account; the profile details you choose to add (bio, music preferences, profile picture); and the reviews and messages you write.</p>
          </div>
          <div>
            <h2>Who can see your messages</h2>
            <p class="prose-sm">Direct messages are strictly between the two participants. No one else — not even administrators — can read your conversations.</p>
          </div>
          <div>
            <h2>Who can see your profile</h2>
            <p class="prose-sm">Your display name, badges, and approved reviews are visible to other members. Public pages do not display your email address as a nickname.</p>
          </div>
          <div>
            <h2>Reporting & safety</h2>
            <p class="prose-sm">Reports capture a snapshot of reported content so moderators can review it without opening private conversations.</p>
          </div>
        </article>
      </section>
    `,
  };
}

export function renderTermsPage({ lang }) {
  return {
    title: t(lang, 'nav.terms'),
    body: html`
      <section class="narrow">
        <p class="eyebrow">Legal</p>
        <h1 class="display-title">Terms of Service</h1>
        <div class="rule-short"></div>
        <article class="card paper-sheet stack">
          <div>
            <h2>Who may use Echoes Between Notes</h2>
            <p class="prose-sm">${t(lang, 'soulmate.safety')}</p>
          </div>
          <div>
            <h2>Be respectful</h2>
            <p class="prose-sm">Write honestly and kindly. Hate speech, harassment, and spam are not tolerated and may be removed.</p>
          </div>
          <div>
            <h2>Keep contact in-app</h2>
            <p class="prose-sm">For your safety, keep all communication inside the platform messaging. Do not share or request personal contact details from other members.</p>
          </div>
          <div>
            <h2>Content you post</h2>
            <p class="prose-sm">You own your reviews and messages, and grant the platform a license to display them within Echoes Between Notes. Inappropriate content may be moderated.</p>
          </div>
        </article>
      </section>
    `,
  };
}

export function renderErrorPage({ statusCode = 404, title = 'Page not found', message = 'The page you requested does not exist.' }) {
  return {
    statusCode,
    title,
    body: html`
      <section class="narrow card paper-sheet">
        <p class="eyebrow">HTTP ${statusCode}</p>
        <h1 class="page-title">${title}</h1>
        <p class="muted">${message}</p>
        <p><a class="text-link" href="/">Return home →</a></p>
      </section>
    `,
  };
}
