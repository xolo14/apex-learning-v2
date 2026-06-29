## Goal
Add real social features (follows + DM chat), push notifications for new content, and proper SEO — all backed by the existing Neon DB. Remove demo/fake data so empty states show until admins post real content.

## Scope

### 1. SEO on every page
- Add per-route `head()` with unique `title`, `description`, `og:title`, `og:description`, `og:url`, canonical.
- Brand: "Syncpedia — <page>". Root sets sitewide defaults + Organization JSON-LD.
- Create `src/routes/sitemap[.]xml.ts` (dynamic) and `public/robots.txt`.
- Routes covered: `/`, `/communities`, `/courses`, `/quizzes`, `/coins`, `/profile`, `/ask`, `/c/$slug`, `/p/$id`.

### 2. Remove fake data
- Audit `src/lib/feed-data.ts` and any seeded demo posts/events/gigs/courses/internships.
- Public pages render only DB rows. Empty state: "Nothing here yet — check back soon."
- Keep admin-created content as the only source.

### 3. Follow system (mutual-accept)
New Neon tables:
- `follow_requests(id, requester_id, target_id, status['pending'|'accepted'|'declined'], created_at)` unique(requester,target).
- `follows(follower_id, following_id, created_at)` — written only when accepted (both directions for "mutual").
Server fns: `sendFollowRequest`, `respondFollowRequest`, `listIncomingRequests`, `listFollowing`, `isMutualFollow`.
UI: Follow button on profiles, Requests inbox in `/profile`.

### 4. Direct chat (text only, mutual-follow gated)
Tables:
- `dm_threads(id, user_a, user_b, created_at)` unique pair.
- `dm_messages(id, thread_id, sender_id, body text, created_at)` — **text only, no attachments**.
Server fns guarded by `isMutualFollow` check; reject if not mutual.
New route `/messages` (thread list) and `/messages/$threadId`. Composer is a `<textarea>` — no file input.

### 5. Push notifications for new content
- Web Push (VAPID). New table `push_subscriptions(user_id, endpoint, p256dh, auth)`.
- Service worker `public/sw-push.js` (push + notificationclick only — separate from any app-shell SW, safe per PWA rules).
- On admin create of Event / Internship / Quiz / Gig: server fn fans out push to all subscribers with title + deep link.
- Settings toggle in `/profile` → "Enable notifications" (requests permission, subscribes).
- Secrets needed: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (I'll generate).

## Technical notes
- Backend = Neon via existing `src/lib/db.server.ts` and `createServerFn`. No Lovable Cloud needed.
- Schema applied through `src/lib/db-ensure.server.ts` (existing pattern).
- Identity = the existing `syncpedia:identity` uniqueId (already used as user id across the app).
- Web push uses the `web-push` npm package inside server fns.
- Service worker registered only in production (Lovable preview guard).

## Out of scope (ask if needed)
- Image/voice messages in DMs (explicitly excluded per request).
- Realtime delivery (chat will poll every few seconds; can upgrade to SSE later).
- Email notifications.

## Deliverable order
1. Schema + follow system + UI.
2. DM chat (mutual-only, text).
3. Push notifications + SW + admin fan-out.
4. SEO heads + sitemap/robots + remove fake data.
