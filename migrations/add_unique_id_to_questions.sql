ALTER TABLE questions ADD COLUMN IF NOT EXISTS unique_id TEXT;

-- Backfill existing questions by matching author names to profiles.
UPDATE questions q
SET unique_id = p.unique_id
FROM profiles p
WHERE q.author = p.name;

-- Mark any remaining unmatched rows as Anonymous.
UPDATE questions SET unique_id = 'Anonymous' WHERE unique_id IS NULL;
