import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  isAdminSessionValid,
  rateLimitAuth,
  safeEqual,
} from "./security.server";

export const verifyAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  return { authenticated: isAdminSessionValid() };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => {
    if (!d.password?.trim()) throw new Error("Password required");
    return { password: d.password };
  })
  .handler(async ({ data }) => {
    rateLimitAuth("admin-login");
    const secret = process.env.ADMIN_SECRET?.trim();
    if (!secret || secret.length < 16) {
      throw new Error("Admin login is not configured. Set ADMIN_SECRET on the server.");
    }
    if (!safeEqual(data.password, secret)) {
      throw new Error("Invalid password");
    }
    const token = createAdminSessionToken();
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    setResponseHeader(
      "Set-Cookie",
      `${ADMIN_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure}`,
    );
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  setResponseHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  );
  return { ok: true as const };
});
