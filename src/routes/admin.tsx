import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import {
  ChartBarIcon,
  NewspaperIcon,
  UserGroupIcon,
  FireIcon,
  GlobeAltIcon,
  BookOpenIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/solid";
import type { ComponentType, SVGProps } from "react";
import syncpediaLogo from "@/assets/syncpedia-logo.jpg.asset.json";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Syncpedia" }] }),
  component: AdminLayout,
});

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const nav: { to: string; label: string; icon: IconType; exact?: boolean }[] = [
  { to: "/admin", label: "Overview", icon: ChartBarIcon, exact: true },
  { to: "/admin/posts", label: "Posts & comments", icon: NewspaperIcon },
  { to: "/admin/users", label: "Members directory", icon: UserGroupIcon },
  { to: "/admin/communities", label: "Communities", icon: GlobeAltIcon },
  { to: "/admin/courses", label: "Courses", icon: BookOpenIcon },
  { to: "/admin/internships", label: "Internships", icon: BriefcaseIcon },
  { to: "/admin/hot", label: "Hot feed curator", icon: FireIcon },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-hairline px-3 py-6 md:flex">
          <div className="flex items-center gap-2 px-3 pb-5">
            <img
              src={syncpediaLogo.url}
              alt="Syncpedia"
              className="h-9 w-9 rounded-[10px] object-cover ring-1 ring-hairline"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold tracking-tight">Syncpedia</span>
              <span className="text-[11px] text-ink-muted">Admin console</span>
            </div>
          </div>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as "/admin"}
                className={
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors " +
                  (active
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-surface")
                }
              >
                <item.icon strokeWidth={1.75} className="h-[16px] w-[16px]" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-auto px-3 pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-foreground"
            >
              View app <ExternalLink className="h-3 w-3" />
            </Link>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Neon · connected
            </p>
          </div>
        </aside>
        <main className="min-h-screen flex-1 px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}