import { getEnv } from "./env.server";

let _ready: Promise<void> | null = null;

export function ensureSchema() {
  if (!getEnv("DATABASE_URL")) return Promise.resolve();
  if (_ready) return _ready;
  _ready = (async () => {
    const { sql } = await import("./db.server");
    const s = sql();
    // Courses: add price/coins/image_url if missing
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS category text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_duration text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS lectures_count integer DEFAULT 0`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS hours_label text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS language text DEFAULT 'English'`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS level text DEFAULT 'Beginner'`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS projects_label text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url text DEFAULT ''`;
    await s`ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_links text DEFAULT ''`;

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
    await s`ALTER TABLE events ADD COLUMN IF NOT EXISTS hosted_by text DEFAULT ''`;
    await s`ALTER TABLE events ADD COLUMN IF NOT EXISTS map_url text DEFAULT ''`;

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
    await s`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS questions_json text DEFAULT '[]'`;

    await s`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id text PRIMARY KEY,
        quiz_id text NOT NULL,
        user_unique_id text NOT NULL,
        device_key text NOT NULL,
        score integer NOT NULL DEFAULT 0,
        max_score integer NOT NULL DEFAULT 0,
        answers_json text DEFAULT '{}',
        duration_sec integer DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        UNIQUE(quiz_id, user_unique_id)
      )
    `;
    await s`CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_idx ON quiz_attempts(quiz_id)`;
    await s`CREATE INDEX IF NOT EXISTS quiz_attempts_score_idx ON quiz_attempts(quiz_id, score DESC)`;

    try {
      const { seedQuizBank } = await import("./quiz.functions");
      await seedQuizBank(s);
    } catch (e) {
      console.error("quiz bank seed:", e);
    }

    // -------- Coin ledger (one row per (user, action_key); enforces one-time awards) --------
    await s`
      CREATE TABLE IF NOT EXISTS coin_ledger (
        user_unique_id text NOT NULL,
        action_key text NOT NULL,
        amount integer NOT NULL CHECK (amount >= 0),
        created_at timestamptz DEFAULT now(),
        PRIMARY KEY (user_unique_id, action_key)
      )
    `;
    await s`CREATE INDEX IF NOT EXISTS coin_ledger_user_idx ON coin_ledger(user_unique_id)`;

    // -------- Feature flags (admin-toggled globals) --------
    await s`
      CREATE TABLE IF NOT EXISTS feature_flags (
        key text PRIMARY KEY,
        enabled boolean NOT NULL DEFAULT true,
        updated_at timestamptz DEFAULT now()
      )
    `;

    // -------- Event RSVPs (server-validated; coins credited only here) --------
    await s`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id text PRIMARY KEY,
        event_id text NOT NULL,
        user_unique_id text NOT NULL,
        device_key text NOT NULL,
        price_snapshot numeric NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'confirmed',
        coins_credited integer NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        UNIQUE(event_id, user_unique_id)
      )
    `;
    await s`CREATE INDEX IF NOT EXISTS event_registrations_event_idx ON event_registrations(event_id)`;

    // -------- Course enrollments --------
    await s`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id text PRIMARY KEY,
        course_id text NOT NULL,
        user_unique_id text NOT NULL,
        device_key text NOT NULL,
        price_snapshot numeric NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'confirmed',
        coins_credited integer NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        UNIQUE(course_id, user_unique_id)
      )
    `;
    await s`CREATE INDEX IF NOT EXISTS course_enrollments_course_idx ON course_enrollments(course_id)`;

    // -------- Internship applications (student submissions) --------
    await s`
      CREATE TABLE IF NOT EXISTS internship_applications (
        id text PRIMARY KEY,
        posting_id text,
        applicant_name text NOT NULL,
        email text NOT NULL,
        phone text DEFAULT '',
        college text DEFAULT '',
        year text DEFAULT '',
        branch text DEFAULT '',
        linkedin text DEFAULT '',
        role text NOT NULL,
        community_slug text,
        message text DEFAULT '',
        resume_name text DEFAULT '',
        resume_data text DEFAULT '',
        user_unique_id text,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz DEFAULT now()
      )
    `;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS posting_id text`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS phone text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS college text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS year text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS branch text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS linkedin text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS resume_name text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS resume_data text DEFAULT ''`;
    await s`ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS user_unique_id text`;
    try {
      await s`CREATE UNIQUE INDEX IF NOT EXISTS internship_app_posting_user_uniq ON internship_applications (posting_id, user_unique_id) WHERE posting_id IS NOT NULL AND user_unique_id IS NOT NULL AND user_unique_id <> ''`;
    } catch {}

    // -------- One account per email and per mobile --------
    // Best-effort: ignore failure if duplicates already exist in legacy data.
    try {
      await s`CREATE UNIQUE INDEX IF NOT EXISTS profiles_gmail_uniq ON profiles (lower(gmail)) WHERE gmail IS NOT NULL AND gmail <> ''`;
    } catch {}
    try {
      await s`CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_uniq ON profiles (mobile) WHERE mobile IS NOT NULL AND mobile <> ''`;
    } catch {}

    // -------- Communities image_url column (legacy tables) --------
    try {
      await s`ALTER TABLE communities ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
    } catch {}

    try {
      await s`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_icon text DEFAULT ''`;
      await s`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT ''`;
      await s`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_sub text DEFAULT ''`;
    } catch {}
    try {
      await s`CREATE UNIQUE INDEX IF NOT EXISTS profiles_google_sub_uniq ON profiles (google_sub) WHERE google_sub IS NOT NULL AND google_sub <> ''`;
    } catch {}
  })().catch((e) => {
    _ready = null;
    throw e;
  });
  return _ready;
}
