import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfileByDevice, resumeProfileSession } from "@/lib/profiles.functions";
import { useResolvedUniqueId } from "@/lib/identity";
import { DEVICE_KEY, readCachedProfile } from "@/lib/session";
import { isValidUniqueId } from "@/lib/profile-ids";

export type ProfileHints = {
  uniqueId?: string;
  gmail?: string;
};

export function readCachedProfileHints(): ProfileHints {
  const cached = readCachedProfile();
  if (!cached) return {};
  const uniqueId = cached.unique_id?.trim().toUpperCase();
  const gmail = cached.gmail?.trim();
  return {
    uniqueId: uniqueId && isValidUniqueId(uniqueId) ? uniqueId : undefined,
    gmail: gmail || undefined,
  };
}

/** Loads server profile and auto re-links this device to an existing account. */
export function useServerProfile() {
  const uidFromContext = useResolvedUniqueId();
  const hints = readCachedProfileHints();
  const uid = uidFromContext ?? hints.uniqueId ?? null;
  const deviceKey =
    typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
  const fetchProfile = useServerFn(getProfileByDevice);
  const resumeProfile = useServerFn(resumeProfileSession);

  return useQuery({
    queryKey: ["server-profile", deviceKey, uid ?? "", hints.gmail ?? ""],
    queryFn: async () => {
      const h = readCachedProfileHints();
      const uniqueId = uid ?? h.uniqueId;
      const profile = await fetchProfile({
        data: { deviceKey, uniqueId, gmail: h.gmail },
      });
      if (profile) return profile;

      if (uniqueId && isValidUniqueId(uniqueId)) {
        const resumed = await resumeProfile({ data: { deviceKey, uniqueId } });
        if (resumed) return resumed;
      }

      return null;
    },
    enabled: !!deviceKey,
    staleTime: 30_000,
    retry: 1,
  });
}

/** Call before enroll/RSVP when the device may have drifted from the saved profile. */
export async function ensureDeviceProfileLinked(
  deviceKey: string,
  uniqueId: string | null | undefined,
  fetchProfile: (input: {
    data: { deviceKey: string; uniqueId?: string; gmail?: string };
  }) => Promise<unknown>,
  resumeProfile: (input: { data: { deviceKey: string; uniqueId: string } }) => Promise<unknown>,
) {
  const h = readCachedProfileHints();
  const uid = (uniqueId ?? h.uniqueId)?.trim().toUpperCase();
  const existing = await fetchProfile({
    data: { deviceKey, uniqueId: uid, gmail: h.gmail },
  });
  if (existing) return existing;
  if (uid && isValidUniqueId(uid)) {
    return resumeProfile({ data: { deviceKey, uniqueId: uid } });
  }
  return null;
}
