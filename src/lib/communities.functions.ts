import { createServerFn } from "@tanstack/react-start";

export type DbCommunity = {
  id: string;
  slug: string;
  name: string;
  about: string;
  icon_key: string;
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
    SELECT id, slug, name, about, icon_key, status, creator_name, creator_role, created_at, approved_at
    FROM communities ORDER BY created_at DESC
  `) as DbCommunity[];
  return rows;
});

export const createCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: {
    name: string;
    about?: string;
    iconKey?: string;
    creatorName?: string;
    creatorRole?: "admin" | "mentor" | "user";
  }) => {
    if (!d.name?.trim()) throw new Error("Name required");
    return d;
  })
  .handler(async ({ data }) => {
    const s = await db();
    const id = rid("com");
    const slug = slugify(data.name);
    const role = data.creatorRole ?? "user";
    const status = role === "user" ? "pending" : "approved";
    const approved = status === "approved" ? new Date().toISOString() : null;
    await s`
      INSERT INTO communities (id, slug, name, about, icon_key, status, creator_name, creator_role, approved_at)
      VALUES (${id}, ${slug}, ${data.name.slice(0, 80)}, ${(data.about || "").slice(0, 280)},
        ${data.iconKey || "sparkles"}, ${status}, ${(data.creatorName || "Anonymous").slice(0, 80)},
        ${role}, ${approved})
    `;
    return { id, slug, status };
  });

export const updateCommunityStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: "approved" | "pending" }) => d)
  .handler(async ({ data }) => {
    const s = await db();
    const approved = data.status === "approved" ? new Date().toISOString() : null;
    await s`UPDATE communities SET status = ${data.status}, approved_at = ${approved} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const updateCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; name?: string; about?: string; iconKey?: string }) => d)
  .handler(async ({ data }) => {
    const s = await db();
    await s`
      UPDATE communities SET
        name = COALESCE(${data.name ?? null}, name),
        about = COALESCE(${data.about ?? null}, about),
        icon_key = COALESCE(${data.iconKey ?? null}, icon_key)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
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
  return rows;
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
    const s = await db();
    await s`UPDATE internship_applications SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const deleteInternship = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
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
  return rows;
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
        url: "/communities?tab=events",
        tag: `evt-${id}`,
      });
    } catch {}
    return { id };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const s = await db();
    await s`DELETE FROM events WHERE id = ${data.id}`;
    return { ok: true };
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
  return rows;
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
  return rows;
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
    const s = await db();
    await s`DELETE FROM internship_postings WHERE id = ${data.id}`;
    return { ok: true };
  });
