import { createServerFn } from "@tanstack/react-start";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const runProductionSeed = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("./security.server");
  await requireAdmin();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured on the server.");
  }

  const script = resolve(process.cwd(), "scripts/seed-production-data.mjs");
  const mod = (await import(pathToFileURL(script).href)) as {
    runSeed: () => Promise<Record<string, number>>;
  };
  if (typeof mod.runSeed !== "function") {
    throw new Error("Seed script missing on server — run git pull on the VPS.");
  }

  const result = await mod.runSeed();
  return { ok: true as const, result, stdout: JSON.stringify(result, null, 2) };
});
