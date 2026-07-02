import { createFileRoute } from "@tanstack/react-router";
import { getGoogleClientId } from "@/lib/public-config.server";
import { getFeatureFlags } from "@/lib/feature-flags.functions";

export const Route = createFileRoute("/api/public/app-config")({
  server: {
    handlers: {
      GET: async () => {
        const flags = await getFeatureFlags();
        return Response.json({
          googleClientId: getGoogleClientId(),
          earningsEnabled: flags.earnings,
        });
      },
    },
  },
});
