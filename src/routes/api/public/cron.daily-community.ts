import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/daily-community")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getDb } = await import("@/lib/db-access.server");
          const s = await getDb();
          if (!s) {
            return Response.json({ ok: false, error: "Database unavailable" }, { status: 503 });
          }
          const { runDailyVirtualCommunity } = await import("@/lib/virtual-community.server");
          const { ensureLegacyPostComments } = await import("@/lib/comments.server");
          const result = await runDailyVirtualCommunity(s);
          await ensureLegacyPostComments(s);
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
