import { createFileRoute } from "@tanstack/react-router";
import { Settings, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { posts } from "@/lib/feed-data";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Syncpedia" }] }),
  component: ProfilePage,
});

const tabs = ["Posts", "Replies", "Bookmarks", "Communities"] as const;

function ProfilePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  return (
    <MobileShell>
      <MobileHeader
        title="Profile"
        right={
          <button aria-label="Settings" className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground">
            <Settings strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
        }
      />
      <section className="px-5 pt-5">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-forest text-[18px] font-medium text-white">
            AL
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-semibold tracking-tight text-foreground">
                Ava Lindgren
              </span>
              <BadgeCheck strokeWidth={2} className="h-4 w-4 text-forest" />
            </div>
            <div className="text-[12px] text-ink-muted">Joined March 2026 · Berlin</div>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-[1.55] text-foreground">
          Designer turned founder. Learning ML in public. Mentor in c/uiux.
        </p>
        <div className="mt-5 flex items-center gap-6 text-[13px]">
          <Stat n="1.4k" l="Karma" />
          <Stat n="38" l="Posts" />
          <Stat n="412" l="Replies" />
          <Stat n="9" l="Communities" />
        </div>
      </section>

      <div className="sticky top-[64px] z-30 mt-6 border-y border-hairline bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-1 overflow-x-auto px-4">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "relative shrink-0 px-3 py-3 text-[13px] tracking-tight transition-colors " +
                  (active ? "text-foreground" : "text-ink-muted")
                }
              >
                {t}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {posts.slice(0, 3).map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </MobileShell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[15px] font-semibold text-foreground">{n}</span>
      <span className="text-ink-muted">{l}</span>
    </div>
  );
}