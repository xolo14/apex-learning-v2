import { createServerFn } from "@tanstack/react-start";

export type CoinLedgerEntry = {
  action_key: string;
  amount: number;
  created_at: string;
};

function normUid(u: string) {
  return String(u || "").trim().toUpperCase();
}
function normKey(k: string) {
  return String(k || "").trim().toLowerCase().slice(0, 80);
}
function nnInt(n: unknown) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(v, 1_000_000); // hard cap to avoid runaway awards
}

export const getCoinBalance = createServerFn({ method: "GET" })
  .inputValidator((d: { deviceKey: string }) => ({ deviceKey: String(d.deviceKey ?? "").trim() }))
  .handler(async ({ data }) => {
    const { tryProfileFromDevice } = await import("./profile-auth.server");
    const { rateLimit } = await import("./security.server");
    if (!data.deviceKey) return { balance: 0, entries: [] as CoinLedgerEntry[] };
    rateLimit(`coins-balance:${data.deviceKey}`, 40, 60_000);

    const profile = await tryProfileFromDevice(data.deviceKey);
    const uid = profile?.unique_id ? normUid(profile.unique_id) : "";
    if (!uid) return { balance: 0, entries: [] as CoinLedgerEntry[] };
    try {
      const { getDb } = await import("./db-access.server");
      const s = await getDb();
      if (!s) return { balance: 0, entries: [] as CoinLedgerEntry[] };
      const rows = (await s`
        SELECT action_key, amount, created_at
        FROM coin_ledger WHERE user_unique_id = ${uid}
        ORDER BY created_at DESC
      `) as CoinLedgerEntry[];
      const balance = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return { balance, entries: rows };
    } catch {
      return { balance: 0, entries: [] as CoinLedgerEntry[] };
    }
  });

export const awardCoin = createServerFn({ method: "POST" })
  .inputValidator((d: { uniqueId: string; actionKey: string; amount: number }) => {
    const uid = normUid(d.uniqueId);
    const key = normKey(d.actionKey);
    const amt = nnInt(d.amount);
    if (!uid) throw new Error("uniqueId required");
    if (!key) throw new Error("actionKey required");
    return { uniqueId: uid, actionKey: key, amount: amt };
  })
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./security.server");
    await requireAdmin();
    if (data.amount === 0) return { credited: false, amount: 0 };
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    // ON CONFLICT DO NOTHING enforces one-time award per (user, action_key)
    const inserted = (await sql()`
      INSERT INTO coin_ledger (user_unique_id, action_key, amount)
      VALUES (${data.uniqueId}, ${data.actionKey}, ${data.amount})
      ON CONFLICT (user_unique_id, action_key) DO NOTHING
      RETURNING amount
    `) as { amount: number }[];
    return { credited: inserted.length > 0, amount: inserted[0]?.amount ?? 0 };
  });