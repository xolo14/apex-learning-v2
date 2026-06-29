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
  })().catch((e) => {
    _ready = null;
    throw e;
  });
  return _ready;
}
