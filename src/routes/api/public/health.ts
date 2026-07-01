import { existsSync } from "node:fs";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/env.server";
import { isDatabaseConfigured } from "@/lib/db-access.server";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const envPath = join(process.cwd(), ".env");
        const envFileExists = existsSync(envPath);
        const hasUrl = isDatabaseConfigured();
        let dbOk = false;
        let dbError = "";

        if (!envFileExists) {
          dbError = ".env file missing on server — run: nano /var/www/syncpedia-community/.env";
        } else if (!hasUrl) {
          dbError = "DATABASE_URL missing or still set to .env.example placeholder";
        } else {
          try {
            const { sql } = await import("@/lib/db.server");
            await sql()`SELECT 1 AS ok`;
            dbOk = true;
          } catch (err) {
            dbError = err instanceof Error ? err.message : "connection failed";
          }
        }

        return Response.json({
          ok: dbOk,
          database: {
            configured: hasUrl,
            connected: dbOk,
            envFileExists,
            error: dbError || undefined,
          },
          googleSignIn: Boolean(getEnv("GOOGLE_CLIENT_ID") || getEnv("VITE_GOOGLE_CLIENT_ID")),
        });
      },
    },
  },
});
