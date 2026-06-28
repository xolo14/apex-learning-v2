import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Bell, Lock, Eye, HelpCircle, LogOut, Palette, Globe } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { useDensity } from "@/lib/density";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Syncpedia" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { density, setDensity } = useDensity();
  return (
    <MobileShell>
      <MobileHeader
        title="Settings"
        left={
          <Link
            to="/profile"
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground"
          >
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
      />
      <section className="px-5 pt-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Display</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline">
          <Row icon={Palette} label="Feed density">
            <div className="flex rounded-full bg-surface p-0.5 text-[12px]">
              {(["airy", "compact"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={
                    "rounded-full px-3 py-1 capitalize " +
                    (density === d ? "bg-foreground text-background" : "text-ink-muted")
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </Row>
        </div>

        <p className="mt-7 text-[11px] uppercase tracking-[0.18em] text-ink-muted">Account</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline">
          <Row icon={Bell} label="Notifications" hint="Push, email, mentions" />
          <Row icon={Lock} label="Privacy" hint="Who can DM and tag you" />
          <Row icon={Eye} label="Blocked accounts" hint="Manage your block list" />
          <Row icon={Globe} label="Language" hint="English (US)" />
        </div>

        <p className="mt-7 text-[11px] uppercase tracking-[0.18em] text-ink-muted">Support</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline">
          <Row icon={HelpCircle} label="Help center" hint="Guides and FAQs" />
          <Row icon={LogOut} label="Sign out" hint="End this session" danger />
        </div>

        <p className="mt-8 pb-10 text-center text-[11px] text-ink-muted">Syncpedia · v0.1</p>
      </section>
    </MobileShell>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  danger,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left last:border-b-0 active:bg-surface/60">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
        <Icon strokeWidth={1.75} className={"h-[18px] w-[18px] " + (danger ? "text-orange" : "text-foreground")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={"block text-[14px] font-medium " + (danger ? "text-orange" : "text-foreground")}>{label}</span>
        {hint ? <span className="block truncate text-[12px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </button>
  );
}