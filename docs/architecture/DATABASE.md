# PostgreSQL Design

Status: target contract; not yet an executable migration  
Engine: PostgreSQL 16  
ORM/migrations: Drizzle ORM + `drizzle-kit`  

## 1. Principles

- UUID is the canonical identifier. Base44 IDs are retained only in nullable, unique legacy
  mapping columns during migration.
- Email is private mutable profile data, never a relationship key.
- PostgreSQL constraints enforce ownership-independent invariants.
- Services enforce actor authorization; repositories enforce bounded data access.
- Source records and relationship rows are authoritative. Cached counters are updated atomically
  in the same transaction or reconciled from source rows.
- All timestamps are `timestamptz` in UTC.
- User-originated text has explicit length limits at API and database boundaries.
- Hard delete versus soft delete is a per-domain decision. Private content defaults to restricted
  soft deletion followed by scheduled physical cleanup.

## 2. Baseline schema

The following block defines the intended relational shape. The implementation milestone must split
it into reviewed migrations and align names with the selected Auth.js Drizzle adapter.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE vote_value AS ENUM ('like', 'dislike');
CREATE TYPE asset_visibility AS ENUM ('private', 'public');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  email_verified_at timestamptz,
  role app_role NOT NULL DEFAULT 'user',
  legacy_base44_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE auth_accounts (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  type text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX auth_accounts_user_idx ON auth_accounts(user_id);

CREATE TABLE auth_sessions (
  session_token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expiry_idx ON auth_sessions(expires_at);

CREATE TABLE auth_verification_tokens (
  identifier citext NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar(80) NOT NULL,
  biography varchar(1000),
  profile_picture_asset_id uuid,
  music_preferences text[] NOT NULL DEFAULT '{}',
  equipped_badges text[] NOT NULL DEFAULT '{}',
  profile_completed boolean NOT NULL DEFAULT false,
  location_network_allowed boolean NOT NULL DEFAULT false,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT equipped_badges_limit CHECK (cardinality(equipped_badges) <= 4)
);

CREATE TABLE user_locations (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  consented_at timestamptz NOT NULL,
  latitude numeric(8,5) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(8,5) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  source varchar(20) NOT NULL CHECK (source IN ('device', 'manual')),
  accuracy_meters integer CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0),
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_base44_id text UNIQUE,
  title varchar(300) NOT NULL,
  artist varchar(200) NOT NULL,
  album_type varchar(30),
  genre varchar(80),
  tags text[] NOT NULL DEFAULT '{}',
  release_year smallint CHECK (release_year IS NULL OR release_year BETWEEN 1800 AND 2200),
  cover_url text,
  musicbrainz_id text,
  description varchar(4000),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  rating_sum numeric(12,2) NOT NULL DEFAULT 0 CHECK (rating_sum >= 0),
  click_count bigint NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX albums_created_idx ON albums(created_at DESC, id DESC);
CREATE INDEX albums_genre_created_idx ON albums(genre, created_at DESC, id DESC);
CREATE INDEX albums_title_artist_idx ON albums(lower(title), lower(artist));

CREATE TABLE podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_base44_id text UNIQUE,
  title varchar(300) NOT NULL,
  host_name varchar(160),
  category varchar(80),
  description varchar(4000),
  cover_url text,
  audio_url text NOT NULL,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX podcasts_category_created_idx ON podcasts(category, created_at DESC, id DESC);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_base44_id text UNIQUE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  album_id uuid REFERENCES albums(id) ON DELETE RESTRICT,
  kind varchar(30) NOT NULL CHECK (kind IN ('album_review', 'journey_story', 'genre_roundup')),
  title varchar(300),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 20000),
  rating numeric(3,1) CHECK (rating IS NULL OR rating BETWEEN 0 AND 10),
  genre varchar(80),
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  moderation_reason varchar(1000),
  like_count integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  dislike_count integer NOT NULL DEFAULT 0 CHECK (dislike_count >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT album_review_requires_album
    CHECK (kind <> 'album_review' OR album_id IS NOT NULL)
);
CREATE INDEX reviews_public_feed_idx
  ON reviews(moderation_status, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX reviews_author_idx ON reviews(author_id, created_at DESC, id DESC);
CREATE INDEX reviews_album_idx
  ON reviews(album_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE review_votes (
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value vote_value NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, voter_id)
);
CREATE INDEX review_votes_voter_idx ON review_votes(voter_id, updated_at DESC);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_base44_id text UNIQUE,
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content varchar(5000) NOT NULL,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX comments_review_idx
  ON comments(review_id, created_at ASC, id ASC)
  WHERE deleted_at IS NULL;

CREATE TABLE friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status friend_request_status NOT NULL DEFAULT 'pending',
  message varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (sender_id <> recipient_id)
);
CREATE UNIQUE INDEX friend_requests_one_pending_pair_idx
  ON friend_requests(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id))
  WHERE status = 'pending';
CREATE INDEX friend_requests_recipient_idx
  ON friend_requests(recipient_id, status, created_at DESC);

CREATE TABLE subscriptions (
  subscriber_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, target_id),
  CHECK (subscriber_id <> target_id)
);
CREATE INDEX subscriptions_target_idx ON subscriptions(target_id, created_at DESC);

CREATE TABLE pinned_peers (
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, peer_id),
  CHECK (owner_id <> peer_id)
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind varchar(20) NOT NULL DEFAULT 'direct' CHECK (kind IN ('direct', 'group')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX conversation_members_user_idx
  ON conversation_members(user_id, conversation_id);

CREATE TABLE direct_conversation_pairs (
  conversation_id uuid PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  user_low_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CHECK (user_low_id < user_high_id),
  UNIQUE (user_low_id, user_high_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_base44_id text UNIQUE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content varchar(10000),
  attachment_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (content IS NOT NULL OR attachment_asset_id IS NOT NULL)
);
CREATE INDEX messages_conversation_cursor_idx
  ON messages(conversation_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type varchar(50) NOT NULL,
  title varchar(200) NOT NULL,
  body varchar(1000),
  link_path text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notifications_dedupe_idx
  ON notifications(owner_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX notifications_owner_cursor_idx
  ON notifications(owner_id, created_at DESC, id DESC);
CREATE INDEX notifications_owner_unread_idx
  ON notifications(owner_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  object_key text NOT NULL UNIQUE,
  original_name varchar(255),
  media_type varchar(100) NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  checksum_sha256 char(64) NOT NULL,
  visibility asset_visibility NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  storage_deleted_at timestamptz
);
CREATE INDEX assets_owner_idx ON assets(owner_id, created_at DESC);

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_picture_fk
  FOREIGN KEY (profile_picture_asset_id) REFERENCES assets(id) ON DELETE SET NULL;

ALTER TABLE messages
  ADD CONSTRAINT messages_attachment_fk
  FOREIGN KEY (attachment_asset_id) REFERENCES assets(id) ON DELETE SET NULL;

CREATE TABLE recruit_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_base44_id text UNIQUE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title varchar(200) NOT NULL,
  band_name varchar(160),
  city varchar(160),
  looking_for text[] NOT NULL DEFAULT '{}',
  i_play text[] NOT NULL DEFAULT '{}',
  genre_tags text[] NOT NULL DEFAULT '{}',
  influences varchar(1000),
  commitment varchar(100),
  description varchar(5000) NOT NULL,
  poster_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  moderation_reason varchar(1000),
  report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX recruit_posts_public_idx
  ON recruit_posts(moderation_status, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX recruit_posts_author_idx
  ON recruit_posts(author_id, created_at DESC, id DESC);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_type varchar(30) NOT NULL,
  target_id uuid NOT NULL,
  reason varchar(100) NOT NULL,
  details varchar(2000),
  status varchar(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX reports_queue_idx ON reports(status, created_at ASC, id ASC);

CREATE TABLE user_badges (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id varchar(100) NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE genre_tallies (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre varchar(80) NOT NULL,
  count bigint NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, genre)
);

CREATE TABLE daily_visit_keys (
  visit_date date NOT NULL,
  visitor_key char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visit_date, visitor_key)
);

CREATE TABLE daily_stats (
  visit_date date PRIMARY KEY,
  visitor_count bigint NOT NULL DEFAULT 0 CHECK (visitor_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## 3. Required transactions

### Review vote

One transaction must:

1. lock or upsert `(review_id, voter_id)`;
2. calculate old-to-new vote delta;
3. insert, update, or delete the vote;
4. atomically update review counters;
5. return authoritative state.

Nightly or administrative reconciliation MUST be able to recompute counters from
`review_votes`.

### Review create/update/delete

The review row and affected album aggregates change in one transaction. Optimistic concurrency
uses the `version` column:

```sql
UPDATE reviews
SET content = $1, version = version + 1, updated_at = now()
WHERE id = $2 AND author_id = $3 AND version = $4
RETURNING *;
```

No returned row means a `409 CONFLICT`, not a blind overwrite.

### Friend request response

Lock the request; verify caller is the recipient; allow only `pending -> accepted|declined`;
create any resulting relationship in the same transaction.

### Direct conversation creation

Sort the two user UUIDs and upsert `direct_conversation_pairs`. Concurrent attempts MUST resolve
to one conversation.

### Visit counting

Insert `(visit_date, visitor_key)` with `ON CONFLICT DO NOTHING`. Increment `daily_stats` only when
the insert succeeds.

### Asset lifecycle

Database deletion state and object deletion cannot be one ACID transaction. Use an outbox/job:
mark pending deletion transactionally, retry object deletion idempotently, then record
`storage_deleted_at`.

## 4. Pagination and indexes

Offset pagination is prohibited for high-growth feeds. Use a stable cursor containing the ordered
columns, normally `(created_at, id)`.

Example:

```sql
SELECT id, title, created_at
FROM reviews
WHERE moderation_status = 'approved'
  AND deleted_at IS NULL
  AND (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT $3;
```

`$3` must be server-capped. The default target is 20; hard maximum is 100 unless a documented
endpoint justifies less.

## 5. Authorization boundary

Repository methods always receive an actor or an already authorized scope. Examples:

```text
getPublicReview(reviewId)
getReviewForOwner(reviewId, ownerId)
listConversationMessages(conversationId, memberId, cursor, limit)
markNotificationRead(notificationId, ownerId)
```

Methods such as `getAnyNotification(id)` must not be exposed to ordinary services. PostgreSQL Row
Level Security may be added as defense in depth, but it does not replace service authorization.

## 6. Base44 data migration

The migration pipeline must be restartable:

```text
extract -> normalize -> validate -> load staging tables
        -> map legacy IDs to UUIDs -> load target tables
        -> reconcile -> cutover
```

Required controls:

- preserve a unique legacy ID mapping;
- normalize email with `citext` while retaining original display casing only if needed;
- create user IDs before loading relationships;
- reject dangling references into a quarantine report;
- deduplicate review votes, subscriptions, pinned peers, and pending friend requests;
- recompute counters from source rows;
- copy private files before changing asset references;
- compare source/target counts and domain invariants;
- record migration run ID and per-table checksums/counts;
- never mutate source records during rehearsal;
- rehearse against an export and a disposable database before cutover.

## 7. Environment separation

```text
local       -> Docker Compose PostgreSQL, mock integrations
test        -> disposable database/schema per test run
preview     -> isolated pooled PostgreSQL branch, synthetic users only
production  -> production pooled PostgreSQL, no automated load tests
```

Migration commands require an explicit environment and must refuse ambiguous or production-like
URLs by default. Application startup MUST NOT run migrations.

## 8. Open implementation decisions

These are decided during their milestone, without changing the architectural invariants:

- production PostgreSQL vendor;
- initial Auth.js identity provider(s);
- object storage provider;
- managed realtime provider, if polling becomes insufficient;
- retention windows for messages, location, logs, deleted accounts, and orphaned assets;
- whether selected defense-in-depth PostgreSQL RLS policies are enabled.

