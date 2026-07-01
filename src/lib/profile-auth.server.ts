import { isValidDeviceKey, rateLimit } from "./security.server";

export type ResolvedProfile = {
  unique_id: string;
  device_key: string;
  name: string;
};

/** Resolve profile from device key — never trust client-supplied unique_id. */
export async function requireProfileFromDevice(
  deviceKey: string,
  opts?: { rateKey?: string; rateMax?: number },
): Promise<ResolvedProfile> {
  if (!isValidDeviceKey(deviceKey)) {
    throw new Error("Sign in to continue.");
  }

  if (opts?.rateKey) {
    rateLimit(opts.rateKey, opts.rateMax ?? 30, 60_000);
  }

  const { getDb } = await import("./db-access.server");
  const s = await getDb();
  if (!s) throw new Error("Service temporarily unavailable.");

  const rows = (await s`
    SELECT unique_id, device_key, name
    FROM profiles
    WHERE device_key = ${deviceKey}
    LIMIT 1
  `) as ResolvedProfile[];

  const profile = rows[0];
  if (!profile?.unique_id) {
    throw new Error("Create your Syncpedia profile first.");
  }

  return profile;
}

export async function tryProfileFromDevice(deviceKey: string): Promise<ResolvedProfile | null> {
  if (!isValidDeviceKey(deviceKey)) return null;
  try {
    return await requireProfileFromDevice(deviceKey);
  } catch {
    return null;
  }
}
