import { sql } from "./db.server";

let _ready: Promise<void> | null = null;

export function ensureSchema() {
  if (_ready) return _ready;
  _ready = (async () => {
    const s = sql();
    // Courses: add price/coins/image_url if missing
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;

    // Events
    await s`
      CREATE TABLE IF NOT EXISTS events (
        id text PRIMARY KEY,
        community_slug text,
        title text NOT NULL,
        description text DEFAULT '',
        image_url text DEFAULT '',
        location text DEFAULT '',
        starts_at text DEFAULT '',
        coins integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      )
    `;
    await s`ALTER TABLE events ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0`;

    // Gigs
    await s`
      CREATE TABLE IF NOT EXISTS gigs (
        id text PRIMARY KEY,
        community_slug text,
        title text NOT NULL,
        poster text DEFAULT '',
        description text DEFAULT '',
        image_url text DEFAULT '',
        location text DEFAULT '',
        duration text DEFAULT '',
        pay numeric DEFAULT 0,
        coins integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      )
    `;

    // Internship postings (separate from internship_applications)
    await s`
      CREATE TABLE IF NOT EXISTS internship_postings (
        id text PRIMARY KEY,
        community_slug text,
        role text NOT NULL,
        company text DEFAULT '',
        description text DEFAULT '',
        image_url text DEFAULT '',
        location text DEFAULT '',
        mode text DEFAULT 'Remote',
        duration text DEFAULT '',
        stipend numeric DEFAULT 0,
        coins integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      )
    `;

    // -------- Follow requests + mutual follows --------
    await s`
      CREATE TABLE IF NOT EXISTS follow_requests (
        id text PRIMARY KEY,
        requester_id text NOT NULL,
        target_id text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz DEFAULT now(),
        UNIQUE(requester_id, target_id)
      )
    `;
    await s`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id text NOT NULL,
        following_id text NOT NULL,
        created_at timestamptz DEFAULT now(),
        PRIMARY KEY (follower_id, following_id)
      )
    `;

    // -------- Direct messages (text-only) --------
    await s`
      CREATE TABLE IF NOT EXISTS dm_threads (
        id text PRIMARY KEY,
        user_a text NOT NULL,
        user_b text NOT NULL,
        last_message_at timestamptz DEFAULT now(),
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_a, user_b)
      )
    `;
    await s`
      CREATE TABLE IF NOT EXISTS dm_messages (
        id text PRIMARY KEY,
        thread_id text NOT NULL,
        sender_id text NOT NULL,
        body text NOT NULL,
        created_at timestamptz DEFAULT now()
      )
    `;
    await s`CREATE INDEX IF NOT EXISTS dm_messages_thread_idx ON dm_messages(thread_id, created_at)`;

    // -------- Push subscriptions --------
    await s`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint text PRIMARY KEY,
        user_id text,
        p256dh text NOT NULL,
        auth text NOT NULL,
        created_at timestamptz DEFAULT now()
      )
    `;

    // -------- Quizzes (admin-created) --------
    await s`
      CREATE TABLE IF NOT EXISTS quizzes (
        id text PRIMARY KEY,
        community_slug text,
        title text NOT NULL,
        description text DEFAULT '',
        questions_count integer DEFAULT 0,
        minutes integer DEFAULT 0,
        coins integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      )
    `;
  })().catch((e) => {
    _ready = null;
    throw e;
  });
  return _ready;
}
