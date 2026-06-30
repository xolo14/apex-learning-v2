import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = new Set(["lmsclasses.com", "syncpedia.in", "app.syncpedia.in"]);

function isAllowedVideoUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.replace(/^www\./, "");
    if (!ALLOWED_HOSTS.has(host)) return null;
    if (!/\.(mp4|webm|ogg)(\?|#|$)/i.test(u.pathname + u.search)) return null;
    return u;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/class-video")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const src = new URL(request.url).searchParams.get("src");
        if (!src) return new Response("Missing src", { status: 400 });

        const target = isAllowedVideoUrl(src);
        if (!target) return new Response("URL not allowed", { status: 403 });

        const range = request.headers.get("range");
        const upstream = await fetch(target.toString(), {
          headers: range ? { Range: range } : undefined,
        });

        if (!upstream.ok && upstream.status !== 206) {
          return new Response("Upstream error", { status: upstream.status });
        }

        const headers = new Headers();
        const pass = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];
        for (const key of pass) {
          const val = upstream.headers.get(key);
          if (val) headers.set(key, val);
        }
        headers.set("cache-control", "public, max-age=3600");

        return new Response(upstream.body, {
          status: upstream.status,
          headers,
        });
      },
    },
  },
});
