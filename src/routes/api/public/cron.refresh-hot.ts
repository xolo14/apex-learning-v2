import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/refresh-hot")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { refreshHotCache } = await import("@/lib/hot-refresh.server");
          const result = await refreshHotCache();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});