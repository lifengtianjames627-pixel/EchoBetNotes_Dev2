const boolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const csv = (value, fallback = []) =>
  value ? value.split(',').map((item) => item.trim()).filter(Boolean) : fallback;

export function loadConfig(overrides = {}) {
  const source = { ...process.env, ...overrides };
  const production = source.NODE_ENV === 'production';
  const jwtSecret = source.JWT_SECRET || (production ? '' : 'development-only-change-this-secret-32');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  if (production && !source.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }

  return {
    nodeEnv: source.NODE_ENV || 'development',
    production,
    host: source.HOST || '0.0.0.0',
    port: number(source.PORT, 3000),
    databaseUrl: source.DATABASE_URL || 'postgres://echoes:echoes@localhost:5432/echoes',
    databaseSsl: boolean(source.DATABASE_SSL, production),
    jwtSecret,
    jwtIssuer: source.JWT_ISSUER || 'echoes-between-notes',
    accessTokenTtl: source.ACCESS_TOKEN_TTL || '2h',
    sessionDays: number(source.SESSION_DAYS, 30),
    cookieSecure: boolean(source.COOKIE_SECURE, production),
    allowedOrigins: csv(source.ALLOWED_ORIGINS, ['http://localhost:5173', 'http://localhost:3000']),
    allowRegistration: boolean(source.ALLOW_REGISTRATION, !production),
    bootstrapAdminEmail: source.BOOTSTRAP_ADMIN_EMAIL || '',
    storageDriver: source.STORAGE_DRIVER || 'local',
    uploadDirectory: source.UPLOAD_DIRECTORY || 'var/uploads',
    publicBaseUrl: source.PUBLIC_BASE_URL || '',
    s3: {
      endpoint: source.S3_ENDPOINT || '',
      region: source.S3_REGION || 'auto',
      bucket: source.S3_BUCKET || '',
      accessKeyId: source.S3_ACCESS_KEY_ID || '',
      secretAccessKey: source.S3_SECRET_ACCESS_KEY || '',
      forcePathStyle: boolean(source.S3_FORCE_PATH_STYLE, false),
    },
    llm: {
      apiUrl: source.LLM_API_URL || '',
      apiKey: source.LLM_API_KEY || '',
      model: source.LLM_MODEL || '',
    },
  };
}

export const config = loadConfig();
