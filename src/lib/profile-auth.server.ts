import { isValidDeviceKey, normalizeEmail, rateLimit } from "./security.server";
import { isValidUniqueId } from "./profile-ids";

type Sql = ReturnType<(typeof import("./db.server"))["sql"]>;

export type ResolvedProfile = {
  unique_id: string;
  device_key: string;
  name: string;
};

export { isValidUniqueId } from "./profile-ids";

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Re-attach the active account to this browser device. */
export async function claimDeviceKeyForProfile(
  s: Sql,
  profileId: string,
  deviceKey: string,
) {
  const unlinked = `unlinked_${rid("dev")}`;
  await s`
    UPDATE profiles SET device_key = ${unlinked}
    WHERE device_key = ${deviceKey} AND id <> ${profileId}
  `;
  await s`
    UPDATE profiles SET device_key = ${deviceKey} WHERE id = ${profileId}
  `;
}

/**
 * Find profile for this device. If missing but uniqueIdHint matches an existing
 * account, re-link the device (same as resume session — one account per user).
 */
export async function resolveProfileForDevice(
  s: Sql,
  deviceKey: string,
  uniqueIdHint?: string,
  gmailHint?: string,
): Promise<ResolvedProfile | null> {
  if (!isValidDeviceKey(deviceKey)) return null;

  const byDevice = (await s`
    SELECT unique_id, device_key, name
    FROM profiles
    WHERE device_key = ${deviceKey}
      AND device_key NOT LIKE 'unlinked_%'
    LIMIT 1
  `) as ResolvedProfile[];
  if (byDevice[0]?.unique_id) return byDevice[0];

  const uid = uniqueIdHint?.trim().toUpperCase() ?? "";
  if (isValidUniqueId(uid)) {
    const byUid = (await s`
      SELECT id, unique_id, device_key, name
      FROM profiles
      WHERE unique_id = ${uid}
      LIMIT 1
    `) as { id: string; unique_id: string; device_key: string; name: string }[];
    if (byUid[0]) {
      await claimDeviceKeyForProfile(s, byUid[0].id, deviceKey);
      return {
        unique_id: byUid[0].unique_id,
        device_key: deviceKey,
        name: byUid[0].name,
      };
    }
  }

  const gmail = gmailHint ? normalizeEmail(gmailHint) : "";
  if (gmail) {
    const byGmail = (await s`
      SELECT id, unique_id, device_key, name
      FROM profiles
      WHERE lower(gmail) = ${gmail}
      LIMIT 1
    `) as { id: string; unique_id: string; device_key: string; name: string }[];
    if (byGmail[0]) {
      await claimDeviceKeyForProfile(s, byGmail[0].id, deviceKey);
      return {
        unique_id: byGmail[0].unique_id,
        device_key: deviceKey,
        name: byGmail[0].name,
      };
    }
  }

  return null;
}

/** Resolve profile from device key — re-links when uniqueIdHint is provided. */
export async function requireProfileFromDevice(
  deviceKey: string,
  opts?: { rateKey?: string; rateMax?: number; uniqueIdHint?: string },
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

  const profile = await resolveProfileForDevice(s, deviceKey, opts?.uniqueIdHint);
  if (!profile?.unique_id) {
    throw new Error("Create your Syncpedia profile first.");
  }

  return profile;
}

export async function tryProfileFromDevice(
  deviceKey: string,
  uniqueIdHint?: string,
): Promise<ResolvedProfile | null> {
  if (!isValidDeviceKey(deviceKey)) return null;
  try {
    return await requireProfileFromDevice(deviceKey, { uniqueIdHint });
  } catch {
    return null;
  }
}
