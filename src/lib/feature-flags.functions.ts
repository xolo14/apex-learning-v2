import { createServerFn } from "@tanstack/react-start";

export type FeatureFlags = {
  earnings: boolean;
  withdraw: boolean;
};

export const DEFAULT_FLAGS: FeatureFlags = {
  earnings: true,
  withdraw: false,
};

const KNOWN_KEYS: (keyof FeatureFlags)[] = ["earnings", "withdraw"];

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeatureFlags> => {
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    const rows = (await sql()`SELECT key, enabled FROM feature_flags`) as {
      key: string;
      enabled: boolean;
    }[];
    const out: FeatureFlags = { ...DEFAULT_FLAGS };
    for (const r of rows) {
      if ((KNOWN_KEYS as string[]).includes(r.key)) {
        (out as Record<string, boolean>)[r.key] = !!r.enabled;
      }
    }
    return out;
  }
);

export const setFeatureFlag = createServerFn({ method: "POST" })
  .inputValidator((d: { key: keyof FeatureFlags; enabled: boolean }) => {
    if (!KNOWN_KEYS.includes(d.key)) throw new Error("Unknown flag");
    return { key: d.key, enabled: !!d.enabled };
  })
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./security.server");
    await requireAdmin();
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    await sql()`
      INSERT INTO feature_flags (key, enabled, updated_at)
      VALUES (${data.key}, ${data.enabled}, now())
      ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()
    `;
    return { ok: true };
  });