import { appParams, tokenStore } from '@/lib/app-params';

/**
 * @typedef {Object} RequestOptions
 * @property {string} [method]
 * @property {unknown} [body]
 * @property {Record<string, string>} [headers]
 * @property {RequestCredentials} [credentials]
 */

class ApiClientError extends Error {
  constructor(message, { status = 500, data = null, url = '' } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    this.url = url;
    // Preserve axios-like access for older catch blocks.
    this.response = { status, data };
  }
}

const API_ORIGIN = (appParams.apiBaseUrl || '').replace(/\/$/, '');

const toUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

const hasBinary = (value) => {
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasBinary);
  return Object.values(value).some(hasBinary);
};

const toFormData = (payload = {}) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof File !== 'undefined' && value instanceof File) {
      form.append(key, value);
      return;
    }
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      form.append(key, value);
      return;
    }
    if (Array.isArray(value) || typeof value === 'object') {
      form.append(key, JSON.stringify(value));
      return;
    }
    form.append(key, String(value));
  });
  return form;
};

const getAuthHeaders = () => {
  const headers = {};
  const token = tokenStore.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (appParams.appId) headers['X-App-Id'] = appParams.appId;
  return headers;
};

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * @param {string} path
 * @param {RequestOptions} [options]
 */
const request = async (path, { method = 'GET', body, headers = {}, credentials = 'include' } = {}) => {
  const resolvedHeaders = { ...getAuthHeaders(), ...headers };

  let payload;
  if (body !== undefined) {
    if (hasBinary(body)) {
      payload = toFormData(body);
    } else {
      payload = JSON.stringify(body);
      resolvedHeaders['Content-Type'] = resolvedHeaders['Content-Type'] || 'application/json';
    }
  }

  const response = await fetch(toUrl(path), {
    method,
    credentials,
    headers: resolvedHeaders,
    body: payload,
  });

  const data = await parseJsonSafely(response);
  if (!response.ok) {
    throw new ApiClientError(
      data?.message || data?.error || `Request failed (${response.status})`,
      { status: response.status, data, url: toUrl(path) },
    );
  }

  return data;
};

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizePagedResponse = (data) => {
  if (Array.isArray(data)) {
    return { items: data, has_more: false, next_cursor: undefined };
  }
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
      ? data.data
      : [];
  return {
    ...data,
    items,
    has_more: Boolean(data?.has_more),
    next_cursor: data?.next_cursor,
  };
};

/** @type {any} */
const entityClient = new Proxy({}, {
  get(_target, entityName) {
    if (typeof entityName !== 'string') return undefined;
    const basePath = `/api/entities/${encodeURIComponent(entityName)}`;

    return {
      async list(sort, limit, cursor) {
        const query = new URLSearchParams();
        if (sort) query.set('sort', sort);
        if (limit !== undefined) query.set('limit', String(limit));
        if (cursor !== undefined) query.set('cursor', String(cursor));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        const data = await request(`${basePath}${suffix}`);
        return normalizeListResponse(data);
      },

      async filter(filter = {}, sortOrOptions, limit, offset) {
        const hasOptionsObject = sortOrOptions && typeof sortOrOptions === 'object' && !Array.isArray(sortOrOptions);
        const payload = hasOptionsObject
          ? { filter, ...sortOrOptions }
          : { filter, sort: sortOrOptions, limit, offset };

        const data = await request(`${basePath}/filter`, {
          method: 'POST',
          body: payload,
        });

        return hasOptionsObject ? normalizePagedResponse(data) : normalizeListResponse(data);
      },

      async create(input) {
        return request(basePath, {
          method: 'POST',
          body: input,
        });
      },

      async update(id, input) {
        return request(`${basePath}/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: input,
        });
      },

      async delete(id) {
        return request(`${basePath}/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      },

      async aggregate(input) {
        return request(`${basePath}/aggregate`, {
          method: 'POST',
          body: input,
        });
      },

      // Polling fallback that preserves the old subscribe API shape.
      subscribe(callback, { intervalMs = 10000 } = {}) {
        if (typeof window === 'undefined') return () => {};

        let active = true;
        let timerId;

        const tick = async () => {
          if (!active) return;
          try {
            callback?.({
              type: 'sync',
              entity: entityName,
              data: null,
            });
          } catch {
            // Subscription callbacks should never crash the polling loop.
          } finally {
            if (active) timerId = window.setTimeout(tick, intervalMs);
          }
        };

        timerId = window.setTimeout(tick, intervalMs);
        return () => {
          active = false;
          if (timerId) window.clearTimeout(timerId);
        };
      },
    };
  },
});

const authClient = {
  async isAuthenticated() {
    try {
      await authClient.me();
      return true;
    } catch {
      return false;
    }
  },

  async me() {
    return request('/api/auth/me');
  },

  async updateMe(input) {
    return request('/api/auth/me', {
      method: 'PATCH',
      body: input,
    });
  },

  async logout(returnTo) {
    tokenStore.clearToken();
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Logout should still proceed client-side even if the API endpoint is absent.
    }

    if (typeof window !== 'undefined' && typeof returnTo === 'string' && returnTo.length > 0) {
      window.location.href = authClient.buildLoginUrl(returnTo);
    }
  },

  buildLoginUrl(returnTo = '') {
    if (typeof window === 'undefined') return '/login';
    const target = returnTo || `${window.location.pathname}${window.location.search}`;
    const loginBase = appParams.loginUrl || '/login';
    const separator = loginBase.includes('?') ? '&' : '?';
    return `${loginBase}${separator}returnTo=${encodeURIComponent(target)}`;
  },

  redirectToLogin(returnTo) {
    if (typeof window === 'undefined') return;
    window.location.href = authClient.buildLoginUrl(returnTo || `${window.location.pathname}${window.location.search}`);
  },
};

export const apiClient = {
  request,
  auth: authClient,
  entities: entityClient,
  functions: {
    async invoke(name, payload = {}) {
      const data = await request(`/api/functions/${encodeURIComponent(name)}`, {
        method: 'POST',
        body: payload,
      });
      return data && typeof data === 'object' && 'data' in data ? data : { data };
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const data = await request('/api/uploads/public', {
          method: 'POST',
          body: { file },
        });
        if (data?.file_url) return data;
        return { file_url: data?.url || '' };
      },
    },
  },
};
