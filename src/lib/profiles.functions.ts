import { createServerFn } from "@tanstack/react-start";

export type DbProfile = {
  id: string;
  device_key: string;
  name: string;
  mobile: string;
  gmail: string;
  year: string | null;
  college: string | null;
  role: "student" | "professional";
  unique_id: string;
  company: string | null;
  experience: string | null;
  branch: string | null;
  department: string | null;
  created_at: string;
};

const rid = (p: string) => `${p}_` + Math.random().toString(36).slice(2, 10);

function genUniqueId() {
  // 6-char alphanumeric, unambiguous (no 0/O/1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `SP-${s}`;
}

export const getProfileByDevice = createServerFn({ method: "GET" })
  .inputValidator((d: { deviceKey: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    return rows[0] ?? null;
  });

export const createProfile = createServerFn({ method: "POST" })
  .inputValidator((d: {
    deviceKey: string;
    name: string;
    mobile: string;
    gmail: string;
    year?: string;
    college?: string;
    role: "student" | "professional";
    company?: string;
    branch?: string;
    department?: string;
  }) => {
    if (!d.deviceKey) throw new Error("Device key required");
    if (!d.name?.trim()) throw new Error("Name required");
    if (!/^\d{7,15}$/.test(d.mobile.replace(/\D/g, ""))) throw new Error("Valid mobile required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.gmail)) throw new Error("Valid email required");
    if (d.role !== "student" && d.role !== "professional") throw new Error("Invalid role");
    if (d.role === "student") {
      if (!d.year?.trim()) throw new Error("Year required");
      if (!d.college?.trim()) throw new Error("College required");
    } else {
      if (!d.company?.trim()) throw new Error("Company required");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");

    // If already onboarded on this device, return existing profile
    const existing = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    if (existing[0]) return existing[0];

    const id = rid("usr");
    // Every profile gets a unique id, regardless of role
    let uniqueId: string | null = null;
    for (let i = 0; i < 10; i++) {
      const candidate = genUniqueId();
      const hit = (await sql()`SELECT 1 FROM profiles WHERE unique_id = ${candidate} LIMIT 1`) as unknown[];
      if (hit.length === 0) {
        uniqueId = candidate;
        break;
      }
    }
    if (!uniqueId) throw new Error("Could not allocate unique id, please retry");

    const isPro = data.role === "professional";
    const company = isPro ? data.company!.trim().slice(0, 120) : null;
    const experience = null;
    const year = isPro ? null : data.year!.trim().slice(0, 20);
    const college = isPro ? null : data.college!.trim().slice(0, 120);
    const branch = isPro ? null : (data.branch?.trim().slice(0, 40) || null);
    const department = isPro ? null : (data.department?.trim().slice(0, 80) || null);

    await sql()`
      INSERT INTO profiles (id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department)
      VALUES (
        ${id}, ${data.deviceKey},
        ${data.name.trim().slice(0, 80)},
        ${data.mobile.trim().slice(0, 20)},
        ${data.gmail.trim().toLowerCase().slice(0, 120)},
        ${year},
        ${college},
        ${data.role},
        ${uniqueId},
        ${company},
        ${experience},
        ${branch},
        ${department}
      )
    `;

    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at
      FROM profiles WHERE id = ${id} LIMIT 1
    `) as DbProfile[];
    return rows[0]!;
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at
    FROM profiles ORDER BY created_at DESC
  `) as DbProfile[];
  return rows;
});

export type AdminAnalytics = {
  totals: {
    profiles: number;
    students: number;
    professionals: number;
    questions: number;
    comments: number;
    signups24h: number;
    signups7d: number;
    posts24h: number;
  };
  signupsByDay: { day: string; students: number; professionals: number }[];
  postsByDay: { day: string; posts: number }[];
  byBranch: { key: string; c: number }[];
  byYear: { key: string; c: number }[];
  byCollege: { key: string; c: number }[];
  recent: { unique_id: string; name: string; role: string; created_at: string }[];
};

export const adminAnalytics = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAnalytics> => {
    const { sql } = await import("./db.server");
    const [tot] = (await sql()`
      SELECT
        count(*)::int AS profiles,
        count(*) FILTER (WHERE role='student')::int AS students,
        count(*) FILTER (WHERE role='professional')::int AS professionals,
        count(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS signups24h,
        count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS signups7d
      FROM profiles
    `) as { profiles: number; students: number; professionals: number; signups24h: number; signups7d: number }[];
    const [q] = (await sql()`SELECT count(*)::int AS c FROM questions`) as { c: number }[];
    const [c] = (await sql()`SELECT count(*)::int AS c FROM comments`) as { c: number }[];
    const [p24] = (await sql()`SELECT count(*)::int AS c FROM questions WHERE created_at > now() - interval '24 hours'`) as { c: number }[];

    const signupsByDay = (await sql()`
      SELECT to_char(date_trunc('day', created_at), 'Mon DD') AS day,
        count(*) FILTER (WHERE role='student')::int AS students,
        count(*) FILTER (WHERE role='professional')::int AS professionals
      FROM profiles
      WHERE created_at > now() - interval '30 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    `) as { day: string; students: number; professionals: number }[];

    const postsByDay = (await sql()`
      SELECT to_char(date_trunc('day', created_at), 'Mon DD') AS day,
        count(*)::int AS posts
      FROM questions
      WHERE created_at > now() - interval '30 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    `) as { day: string; posts: number }[];

    const byBranch = (await sql()`
      SELECT COALESCE(NULLIF(branch,''), 'Unspecified') AS key, count(*)::int AS c
      FROM profiles WHERE role='student'
      GROUP BY key ORDER BY c DESC LIMIT 12
    `) as { key: string; c: number }[];

    const byYear = (await sql()`
      SELECT COALESCE(NULLIF(year,''), 'Unspecified') AS key, count(*)::int AS c
      FROM profiles WHERE role='student'
      GROUP BY key ORDER BY c DESC
    `) as { key: string; c: number }[];

    const byCollege = (await sql()`
      SELECT COALESCE(NULLIF(college,''), 'Unspecified') AS key, count(*)::int AS c
      FROM profiles WHERE role='student'
      GROUP BY key ORDER BY c DESC LIMIT 10
    `) as { key: string; c: number }[];

    const recent = (await sql()`
      SELECT unique_id, name, role, created_at
      FROM profiles ORDER BY created_at DESC LIMIT 12
    `) as { unique_id: string; name: string; role: string; created_at: string }[];

    return {
      totals: {
        profiles: tot.profiles,
        students: tot.students,
        professionals: tot.professionals,
        questions: q.c,
        comments: c.c,
        signups24h: tot.signups24h,
        signups7d: tot.signups7d,
        posts24h: p24.c,
      },
      signupsByDay,
      postsByDay,
      byBranch,
      byYear,
      byCollege,
      recent,
    };
  }
);

export const checkUniqueIdAvailable = createServerFn({ method: "POST" })
  .inputValidator((d: { uniqueId: string; deviceKey: string }) => d)
  .handler(async ({ data }) => {
    if (!/^SP-26[A-Z0-9]{6}$/.test(data.uniqueId)) {
      return { available: false, reason: "format" as const };
    }
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT device_key FROM profiles WHERE unique_id = ${data.uniqueId} LIMIT 1
    `) as { device_key: string }[];
    if (rows.length === 0) return { available: true, reason: null };
    if (rows[0].device_key === data.deviceKey)
      return { available: true, reason: "self" as const };
    return { available: false, reason: "taken" as const };
  });

export const updateUniqueId = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string; uniqueId: string }) => {
    if (!d.deviceKey) throw new Error("Device key required");
    if (!/^SP-26[A-Z0-9]{6}$/.test(d.uniqueId))
      throw new Error("ID must be SP-26 followed by 6 letters or digits");
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const existing = (await sql()`
      SELECT device_key FROM profiles WHERE unique_id = ${data.uniqueId} LIMIT 1
    `) as { device_key: string }[];
    if (existing[0] && existing[0].device_key !== data.deviceKey) {
      throw new Error("This ID is already used. Try a different one.");
    }
    await sql()`
      UPDATE profiles SET unique_id = ${data.uniqueId} WHERE device_key = ${data.deviceKey}
    `;
    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    return rows[0]!;
  });