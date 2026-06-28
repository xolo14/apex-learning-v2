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

const rid = (p: string) => `${p}_` + Math.random().toString(36).slice(2, 10);
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

// ---------------- Communities ----------------

export const listCommunities = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
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
    const { sql } = await import("./db.server");
    const id = rid("com");
    const slug = slugify(data.name);
    const role = data.creatorRole ?? "user";
    const status = role === "user" ? "pending" : "approved";
    const approved = status === "approved" ? new Date().toISOString() : null;
    await sql()`
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
    const { sql } = await import("./db.server");
    const approved = data.status === "approved" ? new Date().toISOString() : null;
    await sql()`UPDATE communities SET status = ${data.status}, approved_at = ${approved} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const updateCommunity = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; name?: string; about?: string; iconKey?: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`
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
    const { sql } = await import("./db.server");
    await sql()`DELETE FROM communities WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------------- Courses ----------------

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, community_slug, title, description, url, created_at
    FROM courses ORDER BY created_at DESC
  `) as DbCourse[];
  return rows;
});

export const createCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { communitySlug: string; title: string; description?: string; url?: string }) => {
    if (!d.title?.trim()) throw new Error("Title required");
    if (!d.communitySlug?.trim()) throw new Error("Community required");
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const id = rid("crs");
    await sql()`
      INSERT INTO courses (id, community_slug, title, description, url)
      VALUES (${id}, ${data.communitySlug}, ${data.title.slice(0, 200)},
        ${(data.description || "").slice(0, 2000)}, ${(data.url || "").slice(0, 500)})
    `;
    return { id };
  });

export const updateCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; title?: string; description?: string; url?: string; communitySlug?: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`
      UPDATE courses SET
        title = COALESCE(${data.title ?? null}, title),
        description = COALESCE(${data.description ?? null}, description),
        url = COALESCE(${data.url ?? null}, url),
        community_slug = COALESCE(${data.communitySlug ?? null}, community_slug)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`DELETE FROM courses WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------------- Internships ----------------

export const listInternships = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
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
    const { sql } = await import("./db.server");
    const id = rid("int");
    await sql()`
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
    const { sql } = await import("./db.server");
    await sql()`UPDATE internship_applications SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const deleteInternship = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`DELETE FROM internship_applications WHERE id = ${data.id}`;
    return { ok: true };
  });