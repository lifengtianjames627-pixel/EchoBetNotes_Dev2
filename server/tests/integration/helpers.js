export async function registerMember(app, suffix) {
  const unique = `${suffix}-${Math.random().toString(36).slice(2, 10)}`;
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      email: `${unique}@example.com`,
      password: 'correct-horse-battery',
      displayName: suffix,
    },
  });
  if (response.statusCode !== 200) {
    throw new Error(`register failed for ${suffix}: ${response.statusCode} ${response.body}`);
  }
  const body = response.json();
  return { token: body.access_token, user: body.user };
}

export function bearer(token) {
  return { authorization: `Bearer ${token}` };
}

export async function invokeFunction(app, token, name, payload) {
  return app.inject({
    method: 'POST',
    url: `/api/functions/${name}`,
    headers: bearer(token),
    payload,
  });
}
