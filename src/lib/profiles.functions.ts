import { createServerFn } from "@tanstack/react-start";

export type DbProfile = {
  id: string;
  device_key: string;
  name: string;
  mobile: string;
  gmail: string;
  year: string;
  college: string;
  role: "student" | "mentor";
  mentor_id: string | null;
  created_at: string;
};

const rid = (p: string) => `${p}_` + Math.random().toString(36).slice(2, 10);

function genMentorId() {
  // 6-char alphanumeric, unambiguous
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `MNT-${s}`;
}

export const getProfileByDevice = createServerFn({ method: "GET" })
  .inputValidator((d: { deviceKey: string }) => d)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, mentor_id, created_at
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
    year: string;
    college: string;
    role: "student" | "mentor";
  }) => {
    if (!d.deviceKey) throw new Error("Device key required");
    if (!d.name?.trim()) throw new Error("Name required");
    if (!/^\d{7,15}$/.test(d.mobile.replace(/\D/g, ""))) throw new Error("Valid mobile required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.gmail)) throw new Error("Valid email required");
    if (!d.year?.trim()) throw new Error("Year required");
    if (!d.college?.trim()) throw new Error("College required");
    if (d.role !== "student" && d.role !== "mentor") throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");

    // If already onboarded on this device, return existing profile
    const existing = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, mentor_id, created_at
      FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as DbProfile[];
    if (existing[0]) return existing[0];

    const id = rid("usr");
    let mentorId: string | null = null;

    if (data.role === "mentor") {
      // Generate unique mentor id — retry on collision
      for (let i = 0; i < 8; i++) {
        const candidate = genMentorId();
        const hit = (await sql()`SELECT 1 FROM profiles WHERE mentor_id = ${candidate} LIMIT 1`) as unknown[];
        if (hit.length === 0) {
          mentorId = candidate;
          break;
        }
      }
      if (!mentorId) throw new Error("Could not allocate mentor id, please retry");
    }

    await sql()`
      INSERT INTO profiles (id, device_key, name, mobile, gmail, year, college, role, mentor_id)
      VALUES (
        ${id}, ${data.deviceKey},
        ${data.name.trim().slice(0, 80)},
        ${data.mobile.trim().slice(0, 20)},
        ${data.gmail.trim().toLowerCase().slice(0, 120)},
        ${data.year.trim().slice(0, 20)},
        ${data.college.trim().slice(0, 120)},
        ${data.role},
        ${mentorId}
      )
    `;

    const rows = (await sql()`
      SELECT id, device_key, name, mobile, gmail, year, college, role, mentor_id, created_at
      FROM profiles WHERE id = ${id} LIMIT 1
    `) as DbProfile[];
    return rows[0]!;
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, device_key, name, mobile, gmail, year, college, role, mentor_id, created_at
    FROM profiles ORDER BY created_at DESC
  `) as DbProfile[];
  return rows;
});