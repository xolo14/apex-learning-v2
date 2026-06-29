/**
 * Syncpedia — single production domain: app.syncpedia.in
 */

export const SITE_NAME = "Syncpedia";

export const APP_SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://app.syncpedia.in";

export const SUPPORT_EMAIL = "support@app.syncpedia.in";
export const NOTIFY_EMAIL = "notify@app.syncpedia.in";

export function appOrigin(): string {
  return String(APP_SITE_URL).replace(/\/$/, "");
}

export const BRAND = {
  themeColor: "#1a3a34",
  ogImage: `${appOrigin()}/og-image.png`,
  logo: `${appOrigin()}/syncpedia-logo.svg`,
  favicon: `${appOrigin()}/favicon.png`,
  twitter: "@Syncpedia",
  tagline: "Learn, earn and connect with your community",
  orgDescription:
    "Community network for students and professionals — events, internships, gigs, quizzes, and Syncpedia coins.",
} as const;
