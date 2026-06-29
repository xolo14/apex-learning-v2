import { getVapidPublicKey, savePushSubscription, deletePushSubscription } from "./social.functions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePushNotifications(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return { ok: false, reason: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };
  const reg = await navigator.serviceWorker.register("/sw-push.js");
  await navigator.serviceWorker.ready;
  const { publicKey } = await getVapidPublicKey();
  if (!publicKey) return { ok: false, reason: "no-vapid" };
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  await savePushSubscription({
    data: {
      userId,
      endpoint: json.endpoint || sub.endpoint,
      p256dh: json.keys?.p256dh || "",
      auth: json.keys?.auth || "",
    },
  });
  try {
    localStorage.setItem("syncpedia_push_endpoint", json.endpoint || sub.endpoint);
  } catch (_e) {}
  return { ok: true };
}

export async function disablePushNotifications(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => undefined);
    await deletePushSubscription({ data: { endpoint } }).catch(() => undefined);
  }
  try {
    localStorage.removeItem("syncpedia_push_endpoint");
  } catch (_e) {}
}

export function isPushEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem("syncpedia_push_endpoint");
  } catch {
    return false;
  }
}