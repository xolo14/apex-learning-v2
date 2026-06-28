CREATE TABLE IF NOT EXISTS post_votes (
  post_id TEXT NOT NULL,
  device_key TEXT NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 0, 1)),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, device_key)
);
CREATE INDEX IF NOT EXISTS post_votes_post_idx ON post_votes(post_id);
