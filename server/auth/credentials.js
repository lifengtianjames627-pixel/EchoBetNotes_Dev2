const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function assertValidEmail(email) {
  const normalized = normalizeEmail(email);
  if (!EMAIL_PATTERN.test(normalized)) {
    throw Object.assign(new Error('A valid email is required'), { statusCode: 400, code: 'invalid_email' });
  }
  return normalized;
}

export function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
    throw Object.assign(new Error('Password must contain between 10 and 200 characters'), {
      statusCode: 400,
      code: 'invalid_password',
    });
  }
  return password;
}

export function parseRegistrationBody(body = {}) {
  const email = assertValidEmail(body.email);
  const password = assertValidPassword(body.password);
  const displayName = String(body.displayName ?? body.display_name ?? '').trim().slice(0, 120);
  return { email, password, displayName };
}

export function parseLoginBody(body = {}) {
  return {
    email: normalizeEmail(body.email),
    password: String(body.password || ''),
  };
}
