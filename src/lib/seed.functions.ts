import { createServerFn } from "@tanstack/react-start";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const runProductionSeed = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("./security.server");
  await requireAdmin();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured on the server.");
  }

  const script = resolve(process.cwd(), "scripts/seed-production-data.mjs");
  const { stdout, stderr } = await execFileAsync("node", [script], {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return { ok: true as const, stdout: stdout.trim(), stderr: stderr.trim() };
});
