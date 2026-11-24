import { config } from '../../config/env.js';
import { html, safeNextPath } from '../html.js';
import { t } from '../i18n.js';

export async function renderLoginPage({ lang, query }) {
  const next = safeNextPath(query?.next, '/');
  return {
    title: t(lang, 'login.title'),
    body: html`
      <section class="auth-layout">
        <div class="card paper-sheet auth-card">
          <p class="eyebrow">${t(lang, 'site.name')}</p>
          <h1 class="page-title">${t(lang, 'login.title')}</h1>
          <form class="stack" data-form="login" data-next="${next}">
            <label class="field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required />
            </label>
            <label class="field">
              <span>Password</span>
              <input type="password" name="password" autocomplete="current-password" required />
            </label>
            <p class="form-error" data-error hidden></p>
            <button type="submit" class="btn btn-primary">${t(lang, 'login.title')}</button>
          </form>
        </div>

        ${config.allowRegistration ? html`
          <div class="card paper-sheet auth-card">
            <p class="eyebrow">New member</p>
            <h2 class="page-title">${t(lang, 'login.register')}</h2>
            <form class="stack" data-form="register" data-next="${next}">
              <label class="field">
                <span>Display name</span>
                <input type="text" name="displayName" maxlength="120" required />
              </label>
              <label class="field">
                <span>Email</span>
                <input type="email" name="email" autocomplete="email" required />
              </label>
              <label class="field">
                <span>Password (10+ characters)</span>
                <input type="password" name="password" minlength="10" maxlength="200" autocomplete="new-password" required />
              </label>
              <p class="form-error" data-error hidden></p>
              <button type="submit" class="btn btn-secondary">${t(lang, 'login.register')}</button>
            </form>
          </div>
        ` : html`
          <div class="card paper-sheet auth-card">
            <p class="eyebrow">Membership</p>
            <h2>Registration is closed</h2>
            <p class="muted">New account registration is currently disabled by the site administrator.</p>
          </div>
        `}
      </section>
    `,
  };
}
