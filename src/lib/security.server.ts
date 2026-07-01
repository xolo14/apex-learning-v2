import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase().slice(0, 120);
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);

  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") {
    local = local.split("+")[0]!.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "").slice(0, 20);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidMobile(mobile: string): boolean {
  return /^\d{7,15}$/.test(normalizeMobile(mobile));
}

export function isValidDeviceKey(key: string): boolean {
  return /^dev_[a-z0-9]{8,40}$/i.test(key);
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function clientIp(): string {
  const req = getRequest();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown";
}

/** Simple in-memory rate limit per key (IP + action). */
export function rateLimit(key: string, max = 12, windowMs = 60_000): void {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw new Error("Too many attempts. Please wait a moment and try again.");
  }
}

export function rateLimitAuth(action: string): void {
  rateLimit(`${action}:${clientIp()}`, 10, 60_000);
}

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

export function applySecurityHeaders(headers: Headers): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
}

// --- Admin session (httpOnly cookie) ---

export const ADMIN_COOKIE = "syncpedia_admin";

function adminSecret(): string {
  const s = process.env.ADMIN_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("Admin access is not configured on this server.");
  }
  return s;
}

export function createAdminSessionToken(): string {
  const secret = adminSecret();
  return createHmac("sha256", secret).update("syncpedia-admin-v1").digest("hex");
}

export function readAdminCookie(): string | null {
  const header = getRequestHeader("cookie");
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === ADMIN_COOKIE) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

export function isAdminSessionValid(): boolean {
  try {
    const token = readAdminCookie();
    if (!token) return false;
    return safeEqual(token, createAdminSessionToken());
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!isAdminSessionValid()) {
    throw new Error("Unauthorized");
  }
}
