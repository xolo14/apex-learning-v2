import { createFileRoute } from "@tanstack/react-router";
import { getGoogleClientId } from "@/lib/public-config.server";

export const Route = createFileRoute("/api/public/app-config")({
  server: {
    handlers: {
      GET: () => {
        return Response.json({
          googleClientId: getGoogleClientId(),
        });
      },
    },
  },
});
