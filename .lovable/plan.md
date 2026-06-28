## Goal
Hide every profile's real name from other people. Only the generated Syncpedia ID (`SP-XXXXXX`) should be visible publicly; the profile owner still sees their own name during onboarding.

## Scope of changes

### Database
- Add `unique_id TEXT` column to the `questions` table.
- Backfill existing rows by matching `questions.author` to `profiles.name` where possible; set unmatched rows to `NULL` (displayed as "Anonymous").

### Server functions (`src/lib/questions.functions.ts`)
- Add `unique_id` to `DbQuestion` type.
- Return `unique_id` from `listNewQuestions` and `listAllQuestions`.
- Change `createQuestion` to accept the device key, look up the profile's `unique_id`, and store it in the new column.
- Update `updateQuestion` so the admin can edit `unique_id` alongside other fields.

### Ask page (`src/routes/ask.tsx`)
- Read the device key from localStorage and send it when creating a post.
- Remove the manual author name input; use the profile's unique ID as the public identifier.

### Public display components
- `src/components/post-card.tsx` — show `unique_id` instead of `author`.
- `src/routes/index.tsx` — show `unique_id` in the feed.
- `src/routes/p.$id.tsx` — show `unique_id` for posts and replies.

### Admin pages
- `src/routes/admin.users.tsx` — replace the "Name" column with "Unique ID" in the profiles table; show unique IDs for active members.
- `src/routes/admin.posts.tsx` — show `unique_id` instead of `author` in the posts table.
- `src/routes/admin.index.tsx` — show `unique_id` in the recent posts list.

### Onboarding (`src/components/onboarding-gate.tsx`)
- Keep showing the user's own first name on the success screen (owner-only view).

## SQL migration (to run against Neon)
```sql
ALTER TABLE questions ADD COLUMN unique_id TEXT;

UPDATE questions q
SET unique_id = p.unique_id
FROM profiles p
WHERE q.author = p.name;

UPDATE questions SET unique_id = 'Anonymous' WHERE unique_id IS NULL;
```

## Verification
- Run `bunx tsgo --noEmit` to confirm type-check passes.