import { createServerFn } from "@tanstack/react-start";
import {
  DEMO_COURSES,
  DEMO_EVENTS,
  DEMO_GIGS,
  DEMO_INTERNSHIP_POSTINGS,
  withDemoFallback,
} from "./demo-data";

async function adminOnly() {
  const { requireAdmin } = await import("./security.server");
  await requireAdmin();
}

export type DbCommunity = {
  id: string;
  slug: string;
  name: string;
  about: string;
  icon_key: string;
  image_url: string;
  status: "pending" | "approved";
  creator_name: string;
  creator_role: "admin" | "mentor" | "user";
  created_at: string;
  approved_at: string | null;
};

export type DbCourse = {
  id: string;
  community_slug: string;
  title: string;
  description: string;
  url: string;
  price: number;
  coins: number;
  image_url: string;
  created_at: string;
};

export type DbInternship = {
  id: string;
  applicant_name: string;
  email: string;
  role: string;
  community_slug: string | null;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type DbEvent = {
  id: string;
  community_slug: string | null;
  title: string;
  description: string;
  image_url: string;
  location: string;
  starts_at: string;
  price: number;
  coins: number;
  created_at: string;
};

export type DbGig = {
  id: string;
  community_slug: string | null;
  title: string;
  poster: string;
  description: string;
  image_url: string;
  location: string;
  duration: string;
  pay: number;
  coins: number;
  created_at: string;
};

export type DbInternshipPosting = {
  id: string;
  community_slug: string | null;
  role: string;
  company: string;
  description: string;
  image_url: string;
  location: string;
  mode: string;
  duration: string;
  stipend: number;
  coins: number;
  created_at: string;
};

const rid = (p: string) => `${p}_` + Math.random().toString(36).slice(2, 10);
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

async function db() {
  const { sql } = await import("./db.server");
  const { ensureSchema } = await import("./db-ensure.server");
  await ensureSchema();
  return sql();
}

// ---------------- Communities ----------------

export const listCommunities = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, slug, name, about, icon_key,
           COALESCE(image_url, '') AS image_url,
           status, creator_name, creator_role, created_at, approved_at
    FROM communities ORDER BY created_at DESC
  `) as DbCommunity[];
  return rows;
});

export const createCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: {
    name: string;
    about?: string;
    iconKey?: string;
    imageUrl?: string;
    creatorName?: string;
    creatorRole?: "admin" | "mentor" | "user";
  }) => {
    if (!d.name?.trim()) throw new Error("Name required");
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const id = rid("com");
    const slug = slugify(data.name);
    const role = data.creatorRole ?? "user";
    const status = role === "user" ? "pending" : "approved";
    const approved = status === "approved" ? new Date().toISOString() : null;
    await s`
      INSERT INTO communities (id, slug, name, about, icon_key, image_url, status, creator_name, creator_role, approved_at)
      VALUES (${id}, ${slug}, ${data.name.slice(0, 80)}, ${(data.about || "").slice(0, 280)},
        ${data.iconKey || "sparkles"}, ${(data.imageUrl || "").slice(0, 800)},
        ${status}, ${(data.creatorName || "Anonymous").slice(0, 80)},
        ${role}, ${approved})
    `;
    return { id, slug, status };
  });

export const updateCommunityStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: "approved" | "pending" }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const approved = data.status === "approved" ? new Date().toISOString() : null;
    await s`UPDATE communities SET status = ${data.status}, approved_at = ${approved} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const updateCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; name?: string; about?: string; iconKey?: string; imageUrl?: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`
      UPDATE communities SET
        name = COALESCE(${data.name ?? null}, name),
        about = COALESCE(${data.about ?? null}, about),
        icon_key = COALESCE(${data.iconKey ?? null}, icon_key),
        image_url = COALESCE(${data.imageUrl ?? null}, image_url)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`DELETE FROM communities WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------------- Courses ----------------

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, community_slug, title, description, url,
           COALESCE(price, 0)::float AS price,
           COALESCE(coins, 0)::int AS coins,
           COALESCE(image_url, '') AS image_url,
           created_at
    FROM courses ORDER BY created_at DESC
  `) as DbCourse[];
  return withDemoFallback(rows, DEMO_COURSES);
});

export const createCourse = createServerFn({ method: "POST" })
  .inputValidator((d: {
    communitySlug: string;
    title: string;
    description?: string;
    url?: string;
    price?: number;
    coins?: number;
    imageUrl?: string;
  }) => {
    if (!d.title?.trim()) throw new Error("Title required");
    if (!d.communitySlug?.trim()) throw new Error("Community required");
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const id = rid("crs");
    await s`
      INSERT INTO courses (id, community_slug, title, description, url, price, coins, image_url)
      VALUES (${id}, ${data.communitySlug}, ${data.title.slice(0, 200)},
        ${(data.description || "").slice(0, 2000)}, ${(data.url || "").slice(0, 500)},
        ${Math.max(0, Math.floor(Number(data.price) || 0))}, ${Math.max(0, Math.floor(Number(data.coins) || 0))},
        ${(data.imageUrl || "").slice(0, 800)})
    `;
    return { id };
  });

export const updateCourse = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id: string;
    title?: string;
    description?: string;
    url?: string;
    communitySlug?: string;
    price?: number;
    coins?: number;
    imageUrl?: string;
  }) => {
    if (d.price != null) d.price = Math.max(0, Math.floor(Number(d.price) || 0));
    if (d.coins != null) d.coins = Math.max(0, Math.floor(Number(d.coins) || 0));
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`
      UPDATE courses SET
        title = COALESCE(${data.title ?? null}, title),
        description = COALESCE(${data.description ?? null}, description),
        url = COALESCE(${data.url ?? null}, url),
        community_slug = COALESCE(${data.communitySlug ?? null}, community_slug),
        price = COALESCE(${data.price ?? null}, price),
        coins = COALESCE(${data.coins ?? null}, coins),
        image_url = COALESCE(${data.imageUrl ?? null}, image_url)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`DELETE FROM courses WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------------- Internship Applications ----------------

export const listInternships = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, applicant_name, email, role, community_slug, message, status, created_at
    FROM internship_applications ORDER BY created_at DESC
  `) as DbInternship[];
  return rows;
});

export const createInternship = createServerFn({ method: "POST" })
  .inputValidator((d: {
    applicantName: string;
    email: string;
    role: string;
    communitySlug?: string;
    message?: string;
  }) => {
    if (!d.applicantName?.trim()) throw new Error("Name required");
    if (!d.email?.trim()) throw new Error("Email required");
    if (!d.role?.trim()) throw new Error("Role required");
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const id = rid("int");
    await s`
      INSERT INTO internship_applications (id, applicant_name, email, role, community_slug, message)
      VALUES (${id}, ${data.applicantName.slice(0, 80)}, ${data.email.slice(0, 120)},
        ${data.role.slice(0, 80)}, ${data.communitySlug || null},
        ${(data.message || "").slice(0, 2000)})
    `;
    return { id };
  });

export const updateInternshipStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: "pending" | "accepted" | "rejected" }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`UPDATE internship_applications SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const deleteInternship = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`DELETE FROM internship_applications WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------------- Events ----------------

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, community_slug, title, description, image_url, location, starts_at,
           COALESCE(price, 0)::float AS price,
           COALESCE(coins, 0)::int AS coins, created_at
    FROM events ORDER BY created_at DESC
  `) as DbEvent[];
  return withDemoFallback(rows, DEMO_EVENTS);
});

export const createEvent = createServerFn({ method: "POST" })
  .inputValidator((d: {
    title: string;
    communitySlug?: string;
    description?: string;
    imageUrl?: string;
    location?: string;
    startsAt?: string;
    price?: number;
    coins?: number;
  }) => {
    if (!d.title?.trim()) throw new Error("Title required");
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const id = rid("evt");
    await s`
      INSERT INTO events (id, community_slug, title, description, image_url, location, starts_at, price, coins)
      VALUES (${id}, ${data.communitySlug || null}, ${data.title.slice(0, 200)},
        ${(data.description || "").slice(0, 2000)}, ${(data.imageUrl || "").slice(0, 800)},
        ${(data.location || "").slice(0, 200)}, ${(data.startsAt || "").slice(0, 100)},
        ${Math.max(0, Math.floor(Number(data.price) || 0))},
        ${Math.max(0, Math.floor(Number(data.coins) || 0))})
    `;
    try {
      const { sendPushToAll } = await import("./push.server");
      await sendPushToAll({
        title: "New event on Syncpedia",
        body: data.title.slice(0, 120),
        url: `/events/${id}`,
        tag: `evt-${id}`,
      });
    } catch {}
    return { id };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`DELETE FROM events WHERE id = ${data.id}`;
    return { ok: true };
  });

export const getEvent = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => {
    if (!d.id?.trim()) throw new Error("id required");
    return { id: d.id.trim().slice(0, 80) };
  })
  .handler(async ({ data }) => {
    const s = await db();
    const rows = (await s`
      SELECT id, community_slug, title, description, image_url, location, starts_at,
             COALESCE(price, 0)::float AS price,
             COALESCE(coins, 0)::int AS coins, created_at
      FROM events WHERE id = ${data.id} LIMIT 1
    `) as DbEvent[];
    if (rows[0]) return rows[0];
    const demo = DEMO_EVENTS.find((e) => e.id === data.id);
    return demo ?? null;
  });

export type EventRegistration = {
  id: string;
  event_id: string;
  user_unique_id: string;
  status: "confirmed" | "pending_payment";
  price_snapshot: number;
  coins_credited: number;
  created_at: string;
};

export const getMyEventRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: { eventId: string; deviceKey: string }) => d)
  .handler(async ({ data }) => {
    const { isValidDeviceKey } = await import("./security.server");
    if (!isValidDeviceKey(data.deviceKey)) return null;
    const s = await db();
    const profiles = (await s`
      SELECT unique_id FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as { unique_id: string }[];
    const uid = profiles[0]?.unique_id;
    if (!uid) return null;
    const rows = (await s`
      SELECT id, event_id, user_unique_id, status, price_snapshot, coins_credited, created_at
      FROM event_registrations
      WHERE event_id = ${data.eventId} AND user_unique_id = ${uid}
      LIMIT 1
    `) as EventRegistration[];
    return rows[0] ?? null;
  });

export const registerForEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { eventId: string; deviceKey: string }) => {
    if (!d.eventId?.trim()) throw new Error("eventId required");
    return { eventId: d.eventId.trim().slice(0, 80), deviceKey: d.deviceKey };
  })
  .handler(async ({ data }) => {
    const { isValidDeviceKey, rateLimit } = await import("./security.server");
    if (!isValidDeviceKey(data.deviceKey)) throw new Error("Invalid session");
    rateLimit(`event-rsvp:${data.deviceKey}`, 8, 60_000);

    const s = await db();
    const profiles = (await s`
      SELECT unique_id, name FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as { unique_id: string; name: string }[];
    const profile = profiles[0];
    if (!profile) throw new Error("Create your Syncpedia profile before RSVPing.");

    const events = (await s`
      SELECT id, title, COALESCE(price, 0)::float AS price, COALESCE(coins, 0)::int AS coins
      FROM events WHERE id = ${data.eventId} LIMIT 1
    `) as { id: string; title: string; price: number; coins: number }[];
    const event = events[0];
    if (!event) throw new Error("Event not found.");

    const existing = (await s`
      SELECT id, status, price_snapshot, coins_credited, created_at
      FROM event_registrations
      WHERE event_id = ${data.eventId} AND user_unique_id = ${profile.unique_id}
      LIMIT 1
    `) as EventRegistration[];
    if (existing[0]) {
      return {
        alreadyRegistered: true as const,
        registration: existing[0],
        message: "You are already registered for this event.",
      };
    }

    const price = Math.max(0, Math.floor(Number(event.price) || 0));
    const coinReward = Math.min(Math.max(0, Math.floor(Number(event.coins) || 0)), 10_000);
    const regId = `evreg_${data.eventId.slice(0, 20)}_${profile.unique_id.replace(/[^A-Z0-9]/gi, "").slice(0, 12)}`;

    if (price > 0) {
      await s`
        INSERT INTO event_registrations (id, event_id, user_unique_id, device_key, price_snapshot, status, coins_credited)
        VALUES (${regId}, ${data.eventId}, ${profile.unique_id}, ${data.deviceKey}, ${price}, 'pending_payment', 0)
      `;
      return {
        alreadyRegistered: false as const,
        registration: {
          id: regId,
          event_id: data.eventId,
          user_unique_id: profile.unique_id,
          status: "pending_payment" as const,
          price_snapshot: price,
          coins_credited: 0,
          created_at: new Date().toISOString(),
        },
        message: `Spot reserved. Pay ₹${price.toLocaleString("en-IN")} to confirm your seat.`,
        coinsPending: coinReward > 0,
        coinReward,
      };
    }

    let coinsCredited = 0;
    if (coinReward > 0) {
      const actionKey = `event:${data.eventId}`;
      const inserted = (await s`
        INSERT INTO coin_ledger (user_unique_id, action_key, amount)
        VALUES (${profile.unique_id}, ${actionKey}, ${coinReward})
        ON CONFLICT (user_unique_id, action_key) DO NOTHING
        RETURNING amount
      `) as { amount: number }[];
      coinsCredited = inserted[0]?.amount ?? 0;
    }

    await s`
      INSERT INTO event_registrations (id, event_id, user_unique_id, device_key, price_snapshot, status, coins_credited)
      VALUES (${regId}, ${data.eventId}, ${profile.unique_id}, ${data.deviceKey}, 0, 'confirmed', ${coinsCredited})
    `;

    return {
      alreadyRegistered: false as const,
      registration: {
        id: regId,
        event_id: data.eventId,
        user_unique_id: profile.unique_id,
        status: "confirmed" as const,
        price_snapshot: 0,
        coins_credited: coinsCredited,
        created_at: new Date().toISOString(),
      },
      message:
        coinsCredited > 0
          ? `You're registered! +${coinsCredited} coins added to your wallet.`
          : "You're registered for this free event.",
      coinsPending: false,
      coinReward: coinsCredited,
    };
  });

// ---------------- Gigs ----------------

export const listGigs = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, community_slug, title, poster, description, image_url, location, duration,
           COALESCE(pay, 0)::float AS pay,
           COALESCE(coins, 0)::int AS coins, created_at
    FROM gigs ORDER BY created_at DESC
  `) as DbGig[];
  return withDemoFallback(rows, DEMO_GIGS);
});

export const createGig = createServerFn({ method: "POST" })
  .inputValidator((d: {
    title: string;
    poster?: string;
    communitySlug?: string;
    description?: string;
    imageUrl?: string;
    location?: string;
    duration?: string;
    pay?: number;
    coins?: number;
  }) => {
    if (!d.title?.trim()) throw new Error("Title required");
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const id = rid("gig");
    await s`
      INSERT INTO gigs (id, community_slug, title, poster, description, image_url, location, duration, pay, coins)
      VALUES (${id}, ${data.communitySlug || null}, ${data.title.slice(0, 200)},
        ${(data.poster || "").slice(0, 120)}, ${(data.description || "").slice(0, 2000)},
        ${(data.imageUrl || "").slice(0, 800)}, ${(data.location || "").slice(0, 120)},
        ${(data.duration || "").slice(0, 80)},
        ${Math.max(0, Math.floor(Number(data.pay) || 0))}, ${Math.max(0, Math.floor(Number(data.coins) || 0))})
    `;
    try {
      const { sendPushToAll } = await import("./push.server");
      await sendPushToAll({
        title: "New earning opportunity",
        body: data.title.slice(0, 120),
        url: "/quizzes?tab=earnings",
        tag: `gig-${id}`,
      });
    } catch {}
    return { id };
  });

export const deleteGig = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`DELETE FROM gigs WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------------- Internship Postings ----------------

export const listInternshipPostings = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, community_slug, role, company, description, image_url, location, mode, duration,
           COALESCE(stipend, 0)::float AS stipend,
           COALESCE(coins, 0)::int AS coins, created_at
    FROM internship_postings ORDER BY created_at DESC
  `) as DbInternshipPosting[];
  return withDemoFallback(rows, DEMO_INTERNSHIP_POSTINGS);
});

export const createInternshipPosting = createServerFn({ method: "POST" })
  .inputValidator((d: {
    role: string;
    company?: string;
    communitySlug?: string;
    description?: string;
    imageUrl?: string;
    location?: string;
    mode?: string;
    duration?: string;
    stipend?: number;
    coins?: number;
  }) => {
    if (!d.role?.trim()) throw new Error("Role required");
    return d;
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    const id = rid("ipt");
    await s`
      INSERT INTO internship_postings (id, community_slug, role, company, description, image_url, location, mode, duration, stipend, coins)
      VALUES (${id}, ${data.communitySlug || null}, ${data.role.slice(0, 120)},
        ${(data.company || "").slice(0, 120)}, ${(data.description || "").slice(0, 2000)},
        ${(data.imageUrl || "").slice(0, 800)}, ${(data.location || "").slice(0, 120)},
        ${(data.mode || "Remote").slice(0, 30)}, ${(data.duration || "").slice(0, 80)},
        ${Math.max(0, Math.floor(Number(data.stipend) || 0))}, ${Math.max(0, Math.floor(Number(data.coins) || 0))})
    `;
    try {
      const { sendPushToAll } = await import("./push.server");
      await sendPushToAll({
        title: "New internship posted",
        body: `${data.role}${data.company ? " · " + data.company : ""}`.slice(0, 120),
        url: "/courses?tab=internships",
        tag: `ipt-${id}`,
      });
    } catch {}
    return { id };
  });

export const deleteInternshipPosting = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await adminOnly();
    const s = await db();
    await s`DELETE FROM internship_postings WHERE id = ${data.id}`;
    return { ok: true };
  });
