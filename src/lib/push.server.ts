import webpush from "web-push";

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || "mailto:notify@app.syncpedia.in";
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToAll(payload: PushPayload) {
  configure();
  const { sql } = await import("./db.server");
  const subs = (await sql()`SELECT endpoint, p256dh, auth FROM push_subscriptions`) as
    { endpoint: string; p256dh: string; auth: string }[];
  const data = JSON.stringify(payload);
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (err) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );
  if (dead.length) {
    await sql()`DELETE FROM push_subscriptions WHERE endpoint = ANY(${dead})`;
  }
  return { sent: subs.length - dead.length, removed: dead.length };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure();
  const { sql } = await import("./db.server");
  const subs = (await sql()`
    SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}
  `) as { endpoint: string; p256dh: string; auth: string }[];
  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        )
        .catch(() => undefined),
    ),
  );
  return { sent: subs.length };
}