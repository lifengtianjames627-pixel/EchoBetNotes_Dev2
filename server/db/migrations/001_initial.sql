CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_records (
  entity_name text NOT NULL,
  id char(24) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id char(24),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_name, id)
);

CREATE INDEX IF NOT EXISTS entity_records_entity_created_idx
  ON entity_records (entity_name, created_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS entity_records_data_idx
  ON entity_records USING gin (data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS entity_records_owner_idx
  ON entity_records (entity_name, owner_id);

CREATE TABLE IF NOT EXISTS auth_accounts (
  user_id char(24) PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id char(24) PRIMARY KEY,
  user_id char(24) NOT NULL REFERENCES auth_accounts(user_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id, expires_at);

CREATE TABLE IF NOT EXISTS upload_parts (
  session_id char(24) NOT NULL,
  part_number integer NOT NULL,
  etag text,
  size_bytes bigint NOT NULL,
  storage_key text NOT NULL,
  PRIMARY KEY (session_id, part_number)
);
