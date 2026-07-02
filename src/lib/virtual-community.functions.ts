import { createServerFn } from "@tanstack/react-start";

export const syncVirtualCommunityFeed = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) return { synced: false };
    const { runDailyVirtualCommunity } = await import("./virtual-community.server");
    const { ensureLegacyPostComments } = await import("./comments.server");
    await runDailyVirtualCommunity(s);
    await ensureLegacyPostComments(s);
    return { synced: true };
  } catch {
    return { synced: false };
  }
});

export const getVirtualCommunityStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) {
      return {
        active: false,
        startedOn: "2026-06-29",
        today: new Date().toISOString().slice(0, 10),
        todayVirtualQuestions: 0,
        todayVirtualComments: 0,
        todayUserQuestions: 0,
        totalVirtualQuestions: 0,
        totalVirtualComments: 0,
        activeDays: 0,
        students: 20,
        postsPerStudent: 2,
        lastRunAt: null as string | null,
      };
    }
    const { getVirtualActivitySummary } = await import("./virtual-community.server");
    return await getVirtualActivitySummary(s);
  } catch {
    return {
      active: false,
      startedOn: "2026-06-29",
      today: new Date().toISOString().slice(0, 10),
      todayVirtualQuestions: 0,
      todayVirtualComments: 0,
      todayUserQuestions: 0,
      totalVirtualQuestions: 0,
      totalVirtualComments: 0,
      activeDays: 0,
      students: 20,
      postsPerStudent: 2,
      lastRunAt: null as string | null,
    };
  }
});
