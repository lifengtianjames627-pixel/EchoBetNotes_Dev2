/// <reference types="vite/client" />

const isNode = typeof window === 'undefined';
const storage = isNode ? null : window.localStorage;

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

const KEY_PREFIX = 'echoes_';

const getStorageKey = (paramName, prefix = KEY_PREFIX) => `${prefix}${toSnakeCase(paramName)}`;

const readStoredValue = (paramName) => {
  if (!storage) return null;
  return storage.getItem(getStorageKey(paramName, KEY_PREFIX));
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) return defaultValue;

  const storageKey = getStorageKey(paramName, KEY_PREFIX);
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const nextUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  return readStoredValue(paramName);
};

const clearStoredTokens = () => {
  if (!storage) return;
  storage.removeItem(getStorageKey('access_token', KEY_PREFIX));
  storage.removeItem('token');
};

const getAppParams = () => {
  if (!isNode && getAppParamValue('clear_access_token') === 'true') {
    clearStoredTokens();
  }

  return {
    appId: getAppParamValue('app_id', {
      defaultValue: import.meta.env.VITE_APP_ID,
    }),
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getAppParamValue('from_url', {
      defaultValue: isNode ? undefined : window.location.href,
    }),
    functionsVersion: getAppParamValue('functions_version', {
      defaultValue: import.meta.env.VITE_FUNCTIONS_VERSION,
    }),
    apiBaseUrl: getAppParamValue('api_base_url', {
      defaultValue: import.meta.env.VITE_API_BASE_URL || '',
    }),
    loginUrl: getAppParamValue('login_url', {
      defaultValue: import.meta.env.VITE_LOGIN_URL || '/login',
    }),
  };
};

export const tokenStore = {
  getToken() {
    return getAppParamValue('access_token');
  },
  setToken(token) {
    if (isNode || !storage || !token) return;
    storage.setItem(getStorageKey('access_token', KEY_PREFIX), token);
  },
  clearToken: clearStoredTokens,
};

export const appParams = {
  ...getAppParams(),
};
