import { createFileRoute } from "@tanstack/react-router";

const STATIC_PATHS = [
  "/",
  "/communities",
  "/courses",
  "/quizzes",
  "/coins",
  "/profile",
  "/ask",
  "/messages",
  "/settings",
];

export const Route = createFileRoute("/api/public/sitemap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const now = new Date().toISOString();
        let dynamic = "";
        try {
          const { sql } = await import("@/lib/db.server");
          const { ensureSchema } = await import("@/lib/db-ensure.server");
          await ensureSchema();
          const s = sql();
          const communities = (await s`SELECT slug FROM communities LIMIT 500`) as { slug: string }[];
          const events = (await s`SELECT id FROM events ORDER BY created_at DESC LIMIT 500`) as { id: string }[];
          const courses = (await s`SELECT id FROM courses ORDER BY created_at DESC LIMIT 500`) as { id: string }[];
          const internships = (await s`SELECT id FROM internship_postings ORDER BY created_at DESC LIMIT 500`) as { id: string }[];
          const gigs = (await s`SELECT id FROM gigs ORDER BY created_at DESC LIMIT 500`) as { id: string }[];
          const quizzes = (await s`SELECT id FROM quizzes ORDER BY created_at DESC LIMIT 500`) as { id: string }[];
          dynamic += communities.map((c) => `<url><loc>${base}/c/${c.slug}</loc></url>`).join("");
          dynamic += events.map((e) => `<url><loc>${base}/events/${e.id}</loc></url>`).join("");
          dynamic += courses.map((c) => `<url><loc>${base}/courses/${c.id}</loc></url>`).join("");
          dynamic += internships.map((i) => `<url><loc>${base}/internships/${i.id}</loc></url>`).join("");
          dynamic += gigs.map((g) => `<url><loc>${base}/gigs/${g.id}</loc></url>`).join("");
          dynamic += quizzes.map((q) => `<url><loc>${base}/quizzes/${q.id}</loc></url>`).join("");
        } catch {}
        const urls = STATIC_PATHS.map(
          (p) =>
            `<url><loc>${base}${p}</loc><lastmod>${now}</lastmod><changefreq>${p === "/" ? "hourly" : "daily"}</changefreq></url>`,
        ).join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}${dynamic}</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});