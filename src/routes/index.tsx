import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Bell,
  Users,
  Compass,
  MessageSquarePlus,
  GraduationCap,
  User,
  ArrowUpRight,
  Bookmark,
  MessageCircle,
  Eye,
  BadgeCheck,
  Sparkles,
  Brain,
  Bot,
  Shield,
  Video,
  Code2,
  Briefcase,
  LineChart,
  Palette,
  Cloud,
  Megaphone,
  Camera,
  Database,
  Rocket,
  PenTool,
  CircuitBoard,
  HeartPulse,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syncpedia — Where communities learn together" },
      { name: "description", content: "A premium community-first learning network. Learn from mentors. Grow with communities." },
      { property: "og:title", content: "Syncpedia — Where communities learn together" },
      { property: "og:description", content: "A premium community-first learning network. Learn from mentors. Grow with communities." },
    ],
  }),
  component: Index,
});

const communities = [
  { name: "Artificial Intelligence", icon: Sparkles, online: 2841, discussions: 124, mentors: 38 },
  { name: "Machine Learning", icon: Brain, online: 1932, discussions: 87, mentors: 24 },
  { name: "Robotics", icon: Bot, online: 612, discussions: 41, mentors: 12 },
  { name: "Psychology", icon: HeartPulse, online: 1204, discussions: 63, mentors: 19 },
  { name: "Video Editing", icon: Video, online: 894, discussions: 52, mentors: 16 },
  { name: "Cyber Security", icon: Shield, online: 1487, discussions: 71, mentors: 22 },
  { name: "Automation", icon: CircuitBoard, online: 738, discussions: 39, mentors: 11 },
  { name: "Programming", icon: Code2, online: 3104, discussions: 198, mentors: 47 },
  { name: "Business", icon: Briefcase, online: 1620, discussions: 84, mentors: 28 },
  { name: "Finance", icon: LineChart, online: 1342, discussions: 67, mentors: 21 },
  { name: "Graphic Design", icon: Palette, online: 1108, discussions: 58, mentors: 18 },
  { name: "Cloud Computing", icon: Cloud, online: 974, discussions: 49, mentors: 15 },
  { name: "UI UX", icon: PenTool, online: 2210, discussions: 112, mentors: 33 },
  { name: "Marketing", icon: Megaphone, online: 1456, discussions: 73, mentors: 23 },
  { name: "Photography", icon: Camera, online: 826, discussions: 44, mentors: 14 },
  { name: "Data Science", icon: Database, online: 1789, discussions: 91, mentors: 26 },
  { name: "Startup", icon: Rocket, online: 1058, discussions: 56, mentors: 17 },
];

const discussions = [
  {
    author: "Mira Okafor",
    role: "Mentor · Stanford NLP",
    community: "Artificial Intelligence",
    title: "How do you reason about evaluating LLM agents in production?",
    preview:
      "We moved past static benchmarks two quarters ago. The team now blends trace-level scoring with weekly human review on a stratified sample.",
    answer:
      "Start with a value-aligned eval set, then layer drift detection on top. Most teams skip the second step and pay for it later.",
    likes: 248,
    comments: 41,
    views: "3.2k",
  },
  {
    author: "Jonas Lindqvist",
    role: "Mentor · Lead Designer, Linear",
    community: "UI UX",
    title: "When does a product need a design system versus a component library?",
    preview:
      "A library is plumbing. A system is a point of view. Teams confuse the two and end up with neither.",
    answer:
      "If your designers can't explain the system in one paragraph, it isn't one yet — it's a Figma file.",
    likes: 186,
    comments: 28,
    views: "2.1k",
  },
  {
    author: "Anika Rao",
    role: "Mentor · Quant, Two Sigma",
    community: "Finance",
    title: "What does a healthy mental model for portfolio risk actually look like?",
    preview:
      "Stop staring at Sharpe. Start asking which assumption, if broken, would unwind the whole position.",
    answer:
      "Risk is the set of futures you haven't priced in yet. Everything else is bookkeeping.",
    likes: 312,
    comments: 57,
    views: "4.6k",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-[1240px] px-6 pb-40 pt-10 md:px-10 md:pt-16">
        <Hero />
        <SectionDivider label="Communities" caption="Seventeen worlds, one network" />
        <CommunitiesGrid />
        <SectionDivider label="Today" caption="Conversations worth your attention" />
        <DiscussionFeed />
      </main>
      <BottomNav />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-8 px-6 md:px-10">
        <a href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-[10px] bg-foreground text-background">
            <span className="text-[13px] font-semibold tracking-tight">S</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Syncpedia</span>
        </a>
        <nav className="hidden items-center gap-6 text-[13px] text-ink-muted md:flex">
          <a className="text-foreground" href="#">Community</a>
          <a className="transition-colors hover:text-foreground" href="#">Discover</a>
          <a className="transition-colors hover:text-foreground" href="#">Courses</a>
          <a className="transition-colors hover:text-foreground" href="#">Mentors</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Search strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Bell strokeWidth={1.75} className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange" />
          </button>
          <div className="ml-1 h-9 w-9 rounded-full bg-surface ring-1 ring-hairline">
            <div className="grid h-full w-full place-items-center text-[12px] font-medium text-foreground">
              AL
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-8 md:pt-20">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-ink-muted">
        <span className="h-px w-6 bg-foreground/40" />
        A community-first learning network
      </div>
      <h1 className="mt-6 max-w-[920px] font-serif text-[44px] leading-[1.02] tracking-tight text-foreground md:text-[88px]">
        What will you{" "}
        <span className="italic text-forest">learn</span> today?
      </h1>
      <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-muted">
        Learn from mentors. Grow with communities. Syncpedia is where serious learners meet the people who already know.
      </p>

      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="group flex h-[60px] flex-1 items-center gap-3 rounded-[18px] border border-hairline bg-background px-5 transition-colors focus-within:border-foreground/30">
          <Search strokeWidth={1.75} className="h-[18px] w-[18px] text-ink-muted" />
          <input
            placeholder="Search mentors, questions, communities…"
            className="h-full flex-1 bg-transparent text-[15px] text-foreground placeholder:text-ink-muted focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-hairline px-1.5 py-0.5 text-[11px] text-ink-muted md:inline">⌘K</kbd>
        </div>
        <button className="inline-flex h-[60px] items-center justify-center gap-2 rounded-[16px] bg-orange px-7 text-[14px] font-medium tracking-tight text-white transition-all hover:bg-orange-hover active:scale-[0.98]">
          Ask a question
          <ArrowUpRight strokeWidth={2} className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-ink-muted">
        <Stat value="184k" label="Learners" />
        <Divider />
        <Stat value="2,410" label="Mentors verified" />
        <Divider />
        <Stat value="17" label="Communities" />
        <Divider />
        <Stat value="98%" label="Answered within 24h" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[15px] font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-3 w-px bg-hairline md:inline-block" />;
}

function SectionDivider({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="mt-24 flex items-end justify-between gap-6 border-b border-hairline pb-5">
      <div>
        <div className="text-[12px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
        <h2 className="mt-2 font-serif text-[28px] tracking-tight text-foreground md:text-[34px]">
          {caption}
        </h2>
      </div>
      <a href="#" className="hidden items-center gap-1 text-[13px] text-ink-muted transition-colors hover:text-foreground md:inline-flex">
        Browse all
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
      </a>
    </div>
  );
}

function CommunitiesGrid() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
      {communities.map((c) => (
        <CommunityCard key={c.name} {...c} />
      ))}
    </div>
  );
}

function CommunityCard({
  name,
  icon: Icon,
  online,
  discussions,
  mentors,
}: {
  name: string;
  icon: typeof Sparkles;
  online: number;
  discussions: number;
  mentors: number;
}) {
  return (
    <a
      href="#"
      className="group relative flex h-[220px] flex-col justify-between bg-background p-6 transition-all duration-300 hover:bg-surface"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] border border-hairline bg-background text-foreground transition-colors group-hover:border-foreground/20">
          <Icon strokeWidth={1.5} className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          {online.toLocaleString()} online
        </div>
      </div>

      <div>
        <h3 className="text-[18px] font-medium tracking-tight text-foreground">{name}</h3>
        <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-muted">
          <span>{discussions} today</span>
          <span className="h-1 w-1 rounded-full bg-hairline" />
          <span>{mentors} mentors</span>
        </div>
        <div className="mt-5 inline-flex items-center gap-1 text-[12px] text-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Enter community
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      </div>
    </a>
  );
}

function DiscussionFeed() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {discussions.map((d) => (
        <DiscussionCard key={d.title} {...d} />
      ))}
    </div>
  );
}

function DiscussionCard({
  author,
  role,
  community,
  title,
  preview,
  answer,
  likes,
  comments,
  views,
}: (typeof discussions)[number]) {
  const initials = author
    .split(" ")
    .map((s) => s[0])
    .join("");
  return (
    <article className="group flex flex-col rounded-[22px] border border-hairline bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15">
      <header className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-[11px] font-medium text-foreground ring-1 ring-hairline">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-foreground">{author}</span>
            <BadgeCheck strokeWidth={1.75} className="h-3.5 w-3.5 text-forest" />
          </div>
          <div className="truncate text-[11px] text-ink-muted">{role}</div>
        </div>
        <span className="rounded-full border border-hairline px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          {community}
        </span>
      </header>

      <h3 className="mt-5 font-serif text-[22px] leading-[1.2] tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.55] text-ink-muted">{preview}</p>

      <div className="mt-5 rounded-[14px] bg-surface p-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Mentor reply</div>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-foreground">{answer}</p>
      </div>

      <footer className="mt-6 flex items-center justify-between border-t border-hairline pt-4 text-[12px] text-ink-muted">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle strokeWidth={1.75} className="h-3.5 w-3.5" />
            {comments}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye strokeWidth={1.75} className="h-3.5 w-3.5" />
            {views}
          </span>
          <span>{likes} likes</span>
        </div>
        <button aria-label="Bookmark" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-foreground">
          <Bookmark strokeWidth={1.75} className="h-4 w-4" />
        </button>
      </footer>
    </article>
  );
}

function BottomNav() {
  const items = [
    { icon: Users, label: "Community", active: true },
    { icon: Compass, label: "Discover" },
    { icon: MessageSquarePlus, label: "Ask", primary: true },
    { icon: GraduationCap, label: "Courses" },
    { icon: User, label: "Profile" },
  ];
  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-[28px] border border-hairline bg-background/85 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {items.map(({ icon: Icon, label, active, primary }) => (
          <button
            key={label}
            aria-label={label}
            className={
              primary
                ? "grid h-11 w-11 place-items-center rounded-full bg-orange text-white transition-all hover:bg-orange-hover active:scale-[0.96]"
                : active
                ? "grid h-11 w-11 place-items-center rounded-full bg-surface text-foreground"
                : "grid h-11 w-11 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-foreground"
            }
          >
            <Icon strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
        ))}
      </div>
    </nav>
  );
}
