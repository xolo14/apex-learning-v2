import type { DbCourse, DbEvent, DbGig, DbInternshipPosting } from "./communities.functions";
import type { HotItem } from "./hot.functions";
import type { DbQuestion } from "./questions.functions";

/** When the database has no rows yet, show rich demo content on member-facing pages. */
export function withDemoFallback<T>(rows: T[], demo: readonly T[]): T[] {
  return rows.length > 0 ? rows : [...demo];
}

const AT = "2026-06-15T10:00:00.000Z";

const cert = (
  partial: Omit<DbCourse, "created_at"> & { created_at?: string },
): DbCourse => ({
  category: "",
  program_duration: "",
  subtitle: "",
  lectures_count: 0,
  hours_label: "",
  language: "English",
  level: "Beginner",
  projects_label: "",
  video_url: "",
  class_links: "",
  created_at: AT,
  ...partial,
});

export const DEMO_COURSES: DbCourse[] = [
  cert({
    id: "demo-crs-1",
    community_slug: "marketing",
    title: "Digital Marketing",
    subtitle: "Professional Certification",
    category: "MARKETING",
    program_duration: "2 Months Program",
    description:
      "Master SEO, social media marketing, and performance ads with expert mentorship and real-world projects. Earn an industry-recognized certificate.",
    url: "https://app.syncpedia.in",
    price: 4999,
    coins: 120,
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    video_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    lectures_count: 24,
    hours_label: "30+ Hours",
    language: "English",
    level: "Beginner",
    class_links: JSON.stringify([
      { title: "Introduction", url: "https://app.syncpedia.in" },
      { title: "Module 1 — SEO Basics", url: "https://app.syncpedia.in" },
    ]),
    projects_label: "2 Real Projects",
  }),
  cert({
    id: "demo-crs-2",
    community_slug: "programming",
    title: "Full-Stack TypeScript",
    subtitle: "Certification",
    category: "TECHNOLOGY",
    program_duration: "2 Months Program",
    description:
      "React, TanStack, Postgres, and deploy — project-first curriculum with a portfolio-ready capstone.",
    url: "https://app.syncpedia.in",
    price: 499,
    coins: 80,
    image_url: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
    lectures_count: 32,
    hours_label: "40+ Hours",
    level: "Intermediate",
    projects_label: "3 Real Projects",
  }),
  cert({
    id: "demo-crs-3",
    community_slug: "uiux",
    title: "Design Systems for Startups",
    subtitle: "Professional Certification",
    category: "DESIGN",
    program_duration: "2 Months Program",
    description:
      "Tokens, components, and handoff workflows that engineers actually use — ship a full design system as your capstone.",
    url: "https://app.syncpedia.in",
    price: 0,
    coins: 60,
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    lectures_count: 18,
    hours_label: "24+ Hours",
    projects_label: "2 Real Projects",
  }),
];

export const DEMO_INTERNSHIP_POSTINGS: DbInternshipPosting[] = [
  {
    id: "demo-int-1",
    community_slug: "startup",
    role: "Product Design Intern",
    company: "Syncpedia Labs",
    description: "Ship onboarding flows and community surfaces with a senior mentor.",
    image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    location: "Hyderabad",
    mode: "Hybrid",
    duration: "3 months",
    stipend: 15000,
    coins: 200,
    created_at: AT,
  },
  {
    id: "demo-int-2",
    community_slug: "data",
    role: "Data Analyst Intern",
    company: "Riverstone Analytics",
    description: "SQL, dashboards, and experiment readouts for a growth team.",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    location: "Bengaluru",
    mode: "Remote",
    duration: "6 months",
    stipend: 20000,
    coins: 250,
    created_at: AT,
  },
  {
    id: "demo-int-3",
    community_slug: "cybersec",
    role: "Security Engineering Intern",
    company: "ShieldGrid",
    description: "Threat modeling, log review, and purple-team exercises.",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    location: "Pune",
    mode: "On-site",
    duration: "4 months",
    stipend: 18000,
    coins: 180,
    created_at: AT,
  },
];

export const DEMO_EVENTS: DbEvent[] = [
  {
    id: "demo-ev-1",
    community_slug: "ai",
    title: "Build Night: RAG on a Budget",
    description: "Live build session — on-device embeddings, chunking strategies, and eval sets.",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    location: "HITEC City, Hyderabad",
    starts_at: "Sat, Jul 12 · 5:00 PM IST",
    price: 0,
    coins: 40,
    hosted_by: "Syncpedia",
    map_url: "",
    created_at: AT,
  },
  {
    id: "demo-ev-2",
    community_slug: "startup",
    title: "Founder Office Hours",
    description: "15-minute slots with operators who've raised seed in India.",
    image_url: "https://images.unsplash.com/photo-1515187024625-57bc888de439?w=800&q=80",
    location: "Online",
    starts_at: "Wed, Jul 9 · 7:30 PM IST",
    price: 0,
    coins: 25,
    hosted_by: "Syncpedia",
    map_url: "",
    created_at: AT,
  },
  {
    id: "demo-ev-3",
    community_slug: "programming",
    title: "Open Source Contribution Sprint",
    description: "Pair with maintainers on good-first issues across TS and Rust repos.",
    image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
    location: "IIIT Hyderabad",
    starts_at: "Sun, Jul 20 · 10:00 AM IST",
    price: 99,
    coins: 30,
    hosted_by: "Syncpedia",
    map_url: "",
    created_at: AT,
  },
];

export const DEMO_GIGS: DbGig[] = [
  {
    id: "demo-gig-1",
    community_slug: "design",
    title: "Redesign a landing page",
    poster: "SP-MIRA01",
    description: "Figma delivery for a B2B SaaS hero + pricing section. 3-day turnaround.",
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    location: "Remote",
    duration: "3 days",
    pay: 2500,
    coins: 150,
    created_at: AT,
  },
  {
    id: "demo-gig-2",
    community_slug: "programming",
    title: "Fix flaky CI pipeline",
    poster: "SP-DANP02",
    description: "GitHub Actions + Vitest — stabilize PR checks for a 12-person team.",
    image_url: "https://images.unsplash.com/photo-1618477388954-7852f7256503?w=800&q=80",
    location: "Remote",
    duration: "1 week",
    pay: 4000,
    coins: 200,
    created_at: AT,
  },
  {
    id: "demo-gig-3",
    community_slug: "marketing",
    title: "Write 5 LinkedIn carousels",
    poster: "SP-ANIR04",
    description: "Ed-tech brand voice. Hooks + design notes included.",
    image_url: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80",
    location: "Remote",
    duration: "5 days",
    pay: 1800,
    coins: 90,
    created_at: AT,
  },
];

export const DEMO_THREADS = [
  {
    id: "demo-thread-1",
    otherId: "SP-MIRA01",
    lastMessageAt: "2026-06-28T14:22:00.000Z",
    preview: "Your RAG write-up was super helpful — mind if I ask one follow-up?",
  },
  {
    id: "demo-thread-2",
    otherId: "SP-DANP02",
    lastMessageAt: "2026-06-27T09:10:00.000Z",
    preview: "Thanks for the intro to the Rust study group!",
  },
];

export const DEMO_FOLLOW_REQUESTS = [
  { id: "demo-req-1", requesterId: "SP-JONL03", createdAt: "2026-06-29T08:00:00.000Z" },
];

export const DEMO_MESSAGE_THREADS: Record<
  string,
  { otherId: string; messages: { id: string; senderId: string; body: string; createdAt: string }[] }
> = {
  "demo-thread-1": {
    otherId: "SP-MIRA01",
    messages: [
      {
        id: "demo-m1",
        senderId: "SP-MIRA01",
        body: "Hey! Loved your question on evals — are you building agents at work or for a side project?",
        createdAt: "2026-06-28T14:18:00.000Z",
      },
      {
        id: "demo-m2",
        senderId: "SP-YOU",
        body: "Side project for now — trying to ship a community app with real users.",
        createdAt: "2026-06-28T14:20:00.000Z",
      },
      {
        id: "demo-m3",
        senderId: "SP-MIRA01",
        body: "Your RAG write-up was super helpful — mind if I ask one follow-up?",
        createdAt: "2026-06-28T14:22:00.000Z",
      },
    ],
  },
  "demo-thread-2": {
    otherId: "SP-DANP02",
    messages: [
      {
        id: "demo-m4",
        senderId: "SP-DANP02",
        body: "Thanks for the intro to the Rust study group!",
        createdAt: "2026-06-27T09:10:00.000Z",
      },
    ],
  },
};

export function demoProfileQuestions(uniqueId: string): DbQuestion[] {
  return [
    {
      id: "demo-pq-1",
      author: uniqueId,
      initials: uniqueId.slice(-2),
      unique_id: uniqueId,
      community_slug: "programming",
      title: "Best way to learn system design as a student?",
      body: "Second year B.Tech — finished DSA basics. What would you do for the next 90 days?",
      tag: "Question",
      votes: 24,
      comments: 8,
      created_at: "2026-06-20T11:00:00.000Z",
      hidden: false,
    },
    {
      id: "demo-pq-2",
      author: uniqueId,
      initials: uniqueId.slice(-2),
      unique_id: uniqueId,
      community_slug: "startup",
      title: "Looking for a co-founder for an ed-tech idea",
      body: "Community + coins for students. DM if you've shipped before.",
      tag: "Discussion",
      votes: 41,
      comments: 12,
      created_at: "2026-06-10T16:30:00.000Z",
      hidden: false,
    },
  ];
}

export const DEMO_HOT: HotItem[] = [
  {
    id: "demo-hot-1",
    title: "India's AI startups are hiring faster than they can onboard mentors",
    url: "https://app.syncpedia.in",
    source: "Syncpedia Editorial",
    bucket: "tech",
    score: 842,
    comments: 56,
    thumbnail: "https://images.unsplash.com/photo-1677440866019-21743ecad50a?w=400&q=80",
    summary: "Campus communities are becoming the top funnel for early-career roles.",
    pinned: true,
    createdAt: Date.now() - 3600_000,
  },
  {
    id: "demo-hot-2",
    title: "How students are using micro-gigs to fund exam prep",
    url: "https://app.syncpedia.in",
    source: "Community Signal",
    bucket: "education",
    score: 612,
    comments: 34,
    thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80",
    summary: "Coins, quizzes, and weekend gigs — a new campus economy pattern.",
    pinned: false,
    createdAt: Date.now() - 7200_000,
  },
  {
    id: "demo-hot-3",
    title: "The meme cycle of 'I'll start LeetCode tomorrow'",
    url: "https://app.syncpedia.in",
    source: "r/programminghumor",
    bucket: "memes",
    score: 1204,
    comments: 89,
    thumbnail: null,
    pinned: false,
    createdAt: Date.now() - 10_800_000,
  },
];

export function isDemoThreadId(threadId: string) {
  return threadId.startsWith("demo-thread-");
}
