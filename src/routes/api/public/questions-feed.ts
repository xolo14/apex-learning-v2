import { createFileRoute } from "@tanstack/react-router";
import { queryRecentQuestions } from "@/lib/questions-feed.server";

export const Route = createFileRoute("/api/public/questions-feed")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await queryRecentQuestions(50);
        return Response.json(rows, {
          headers: {
            "Cache-Control": "public, max-age=15, stale-while-revalidate=120",
          },
        });
      },
    },
  },
});
