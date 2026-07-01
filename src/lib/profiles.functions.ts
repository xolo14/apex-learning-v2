import { createServerFn } from "@tanstack/react-start";
import {
  isValidDeviceKey,
  isValidEmail,
  isValidMobile,
  normalizeEmail,
  normalizeMobile,
  rateLimitAuth,
  requireAdmin,
} from "./security.server";

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
  avatar_icon: string;
  avatar_color: string;
  google_sub: string;
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

/** One-time 50-coin signup bonus; safe to call on every login/load. */
async function ensureSignupBonus(sql: ReturnType<typeof import("./db.server").sql>, uniqueId: string) {
  const { SIGNUP_BONUS_COINS } = await import("./coin-rewards");
  await sql()`
    INSERT INTO coin_ledger (user_unique_id, action_key, amount)
    VALUES (${uniqueId}, 'signup', ${Math.max(0, Math.floor(SIGNUP_BONUS_COINS))})
    ON CONFLICT (user_unique_id, action_key) DO NOTHING
  `;
}

/** Unlink other profiles from this device, then attach the account. */
async function claimDeviceKey(
  sql: ReturnType<typeof import("./db.server").sql>,
  profileId: string,
  deviceKey: string,
) {
  const unlinked = `unlinked_${rid("dev")}`;
  await sql`
    UPDATE profiles SET device_key = ${unlinked}
    WHERE device_key = ${deviceKey} AND id <> ${profileId}
  `;
  await sql`
    UPDATE profiles SET device_key = ${deviceKey} WHERE id = ${profileId}
  `;
}

async function loadProfileById(
  sql: ReturnType<typeof import("./db.server").sql>,
  id: string,
): Promise<DbProfile | null> {
  const rows = (await sql()`
    SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
           COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color,
           COALESCE(google_sub, '') AS google_sub, created_at
    FROM profiles WHERE id = ${id} LIMIT 1
  `) as DbProfile[];
  return rows[0] ?? null;
}

async function findProfileForGoogle(
  sql: ReturnType<typeof import("./db.server").sql>,
  googleSub: string,
  emailNorm: string,
): Promise<DbProfile | null> {
  const bySub = (await sql()`
    SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
           COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color,
           COALESCE(google_sub, '') AS google_sub, created_at
    FROM profiles WHERE google_sub = ${googleSub} LIMIT 1
  `) as DbProfile[];
  if (bySub[0]) return bySub[0];

  const byEmail = (await sql()`
    SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
           COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color,
           COALESCE(google_sub, '') AS google_sub, created_at
    FROM profiles WHERE lower(gmail) = ${emailNorm} LIMIT 1
  `) as DbProfile[];
  return byEmail[0] ?? null;
}

export type CreateProfileResult =
  | { status: "created"; profile: DbProfile }
  | { status: "existing" };

export type GoogleAuthResult =
  | { status: "logged_in"; profile: DbProfile }
  | { status: "needs_onboarding"; gmail: string; name: string };

export const authWithGoogle = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string; credential: string }) => {
    if (!isValidDeviceKey(d.deviceKey)) throw new Error("Device key required");
    if (!d.credential?.trim()) throw new Error("Google credential required");
    return d;
  })
  .handler(async ({ data }): Promise<GoogleAuthResult> => {
    rateLimitAuth("google");
    const { verifyGoogleIdToken } = await import("./google-auth.server");
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();

    const claims = await verifyGoogleIdToken(data.credential);
    const emailNorm = normalizeEmail(claims.email);

    const found = await findProfileForGoogle(sql, claims.sub, emailNorm);

    if (found) {
      await claimDeviceKey(sql, found.id, data.deviceKey);
      await sql`
        UPDATE profiles
        SET google_sub = ${claims.sub}, gmail = ${emailNorm}
        WHERE id = ${found.id}
      `;
      if (!found.name?.trim() && claims.name) {
        await sql()`UPDATE profiles SET name = ${claims.name} WHERE id = ${found.id}`;
      }
      await ensureSignupBonus(sql, found.unique_id);
      const profile = await loadProfileById(sql, found.id);
      if (!profile) throw new Error("Could not load profile after sign-in.");
      return { status: "logged_in", profile };
    }

    return { status: "needs_onboarding", gmail: emailNorm, name: claims.name };
  });

export const checkContactExists = createServerFn({ method: "POST" })
  .inputValidator((d: { gmail?: string; mobile?: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    const emailNorm = data.gmail ? normalizeEmail(data.gmail) : "";
    const mobileNorm = data.mobile ? normalizeMobile(data.mobile) : "";
    if (emailNorm) {
      const byEmail = (await sql()`
        SELECT 1 FROM profiles WHERE lower(gmail) = ${emailNorm} LIMIT 1
      `) as unknown[];
      if (byEmail.length) return { exists: true as const };
    }
    if (mobileNorm) {
      const byMobile = (await sql()`
        SELECT 1 FROM profiles WHERE mobile = ${mobileNorm} LIMIT 1
      `) as unknown[];
      if (byMobile.length) return { exists: true as const };
    }
    return { exists: false as const };
  });

export const getProfileByDevice = createServerFn({ method: "GET" })
  .inputValidator((d: { deviceKey: string }) => {
    if (!isValidDeviceKey(d.deviceKey)) throw new Error("Invalid device key");
    return d;
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) return null;
    const rows = (await s`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
             COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color,
             COALESCE(google_sub, '') AS google_sub, created_at
      FROM profiles
      WHERE device_key = ${data.deviceKey} AND device_key NOT LIKE 'unlinked_%'
      ORDER BY created_at DESC
      LIMIT 1
    `) as DbProfile[];
    if (rows[0]) await ensureSignupBonus(s, rows[0].unique_id);
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
    if (!d.deviceKey || !isValidDeviceKey(d.deviceKey)) throw new Error("Device key required");
    if (!d.name?.trim()) throw new Error("Name required");
    if (!isValidMobile(d.mobile)) throw new Error("Valid mobile required");
    if (!isValidEmail(d.gmail)) throw new Error("Valid email required");
    if (d.role !== "student" && d.role !== "professional") throw new Error("Invalid role");
    if (d.role === "student") {
      if (!d.year?.trim()) throw new Error("Year required");
      if (!d.college?.trim()) throw new Error("College required");
    } else {
      if (!d.company?.trim()) throw new Error("Company required");
    }
    return d;
  })
  .handler(async ({ data }): Promise<CreateProfileResult | DbProfile> => {
    rateLimitAuth("signup");
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();

    const emailNorm = normalizeEmail(data.gmail);
    const mobileNorm = normalizeMobile(data.mobile);

    // If already onboarded on this device, return existing profile
    const existing = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
             COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    if (existing[0]) return existing[0];

    // One account per email/mobile — don't create duplicates; client redirects to login.
    const byEmail = (await sql()`
      SELECT id FROM profiles WHERE lower(gmail) = ${emailNorm} LIMIT 1
    `) as { id: string }[];
    const byMobile = (await sql()`
      SELECT id FROM profiles WHERE mobile = ${mobileNorm} LIMIT 1
    `) as { id: string }[];
    if (byEmail[0] || byMobile[0]) {
      return { status: "existing" };
    }

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
        ${mobileNorm},
        ${emailNorm},
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

    // One-time signup bonus: 50 coins per account (enforced by coin_ledger PK).
    await ensureSignupBonus(sql, uniqueId);

    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
             COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color, created_at
      FROM profiles WHERE id = ${id} LIMIT 1
    `) as DbProfile[];
    return { status: "created", profile: rows[0]! };
  });

export const loginProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string; mobile: string; gmail: string }) => {
    if (!isValidDeviceKey(d.deviceKey)) throw new Error("Device key required");
    if (!isValidMobile(d.mobile)) throw new Error("Valid mobile required");
    if (!isValidEmail(d.gmail)) throw new Error("Valid email required");
    return d;
  })
  .handler(async ({ data }) => {
    rateLimitAuth("login");
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();

    const emailNorm = normalizeEmail(data.gmail);
    const mobileNorm = normalizeMobile(data.mobile);

    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
             COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color, created_at
      FROM profiles
      WHERE lower(gmail) = ${emailNorm} AND mobile = ${mobileNorm}
      LIMIT 1
    `) as DbProfile[];
    if (!rows[0]) {
      throw new Error("We couldn't find a matching account. Check your email and mobile, or create a new account.");
    }

    await claimDeviceKey(sql, rows[0].id, data.deviceKey);
    await sql()`UPDATE profiles SET gmail = ${emailNorm} WHERE id = ${rows[0].id}`;
    await ensureSignupBonus(sql, rows[0].unique_id);
    const profile = await loadProfileById(sql, rows[0].id);
    if (!profile) throw new Error("Could not load profile after sign-in.");
    return profile;
  });

/** Sign out on this device — unlinks device_key so auto-login cannot restore the session. */
export const logoutDevice = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string }) => {
    if (!isValidDeviceKey(d.deviceKey)) throw new Error("Device key required");
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    const unlinked = `unlinked_${rid("dev")}`;
    await sql()`
      UPDATE profiles SET device_key = ${unlinked}
      WHERE device_key = ${data.deviceKey}
    `;
    return { ok: true as const };
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
           COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color, created_at
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
    await requireAdmin();
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
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
             COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    return rows[0]!;
  });

const AVATAR_ICON_RE = /^[a-z]+-\d+$/;

export const updateAvatarPreferences = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string; icon: string; color: string }) => {
    if (!isValidDeviceKey(d.deviceKey)) throw new Error("Device key required");
    if (!d.color.startsWith("#") || d.color.length < 4) throw new Error("Invalid color");
    if (!AVATAR_ICON_RE.test(d.icon)) throw new Error("Invalid avatar");
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    await sql()`
      UPDATE profiles
      SET avatar_icon = ${data.icon.slice(0, 20)}, avatar_color = ${data.color.slice(0, 20)}
      WHERE device_key = ${data.deviceKey}
    `;
    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department,
             COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    if (!rows[0]) throw new Error("Profile not found");
    return rows[0];
  });

export const getPublicAvatar = createServerFn({ method: "GET" })
  .inputValidator((d: { uniqueId: string }) => {
    if (!d.uniqueId?.trim()) throw new Error("uniqueId required");
    return { uniqueId: d.uniqueId.trim().slice(0, 24) };
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    const rows = (await sql()`
      SELECT COALESCE(avatar_icon, '') AS avatar_icon, COALESCE(avatar_color, '') AS avatar_color
      FROM profiles WHERE unique_id = ${data.uniqueId} LIMIT 1
    `) as { avatar_icon: string; avatar_color: string }[];
    return rows[0] ?? { avatar_icon: "", avatar_color: "" };
  });