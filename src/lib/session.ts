/** Client session keys — keep in sync with onboarding + settings. */
export const DEVICE_KEY = "syncpedia_device_key";
export const PROFILE_CACHE = "syncpedia_profile";
export const IDENTITY_KEY = "syncpedia:identity";
export const INTERESTS_KEY = "syncpedia_interests";
export const SIGNED_OUT_KEY = "syncpedia_signed_out";

export function isSignedOut(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIGNED_OUT_KEY) === "1";
}

export function clearSignedOutFlag() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SIGNED_OUT_KEY);
}

export function getOrCreateDeviceKey(): string {
  if (typeof window === "undefined") return "";
  let k = localStorage.getItem(DEVICE_KEY);
  if (!k) {
    k = "dev_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    localStorage.setItem(DEVICE_KEY, k);
  }
  return k;
}

/** Wipe local sign-in state so onboarding can show again. */
export function clearLocalSession() {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIGNED_OUT_KEY, "1");
  localStorage.removeItem(PROFILE_CACHE);
  localStorage.removeItem(IDENTITY_KEY);
  localStorage.removeItem(DEVICE_KEY);
  localStorage.removeItem(INTERESTS_KEY);
  localStorage.removeItem("syncpedia_push_endpoint");
}

export const SIGNED_OUT_EVENT = "syncpedia:signed-out";

/** Instant client sign-out — dispatches event so UI updates without a full reload. */
export function signOutLocally() {
  clearLocalSession();
  window.dispatchEvent(new CustomEvent(SIGNED_OUT_EVENT));
}

function readCachedProfile(): import("./profiles.functions").DbProfile | null {
  if (typeof window === "undefined" || isSignedOut()) return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE);
    return raw ? (JSON.parse(raw) as import("./profiles.functions").DbProfile) : null;
  } catch {
    return null;
  }
}

export function hasCachedProfile(): boolean {
  return readCachedProfile() != null;
}

export { readCachedProfile };
