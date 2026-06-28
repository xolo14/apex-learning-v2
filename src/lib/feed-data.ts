import {
  Sparkles,
  Brain,
  Bot,
  HeartPulse,
  Video,
  Shield,
  CircuitBoard,
  Code2,
  Briefcase,
  LineChart,
  Palette,
  Cloud,
  PenTool,
  Megaphone,
  Camera,
  Database,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export type Community = {
  slug: string;
  name: string;
  icon: LucideIcon;
  members: string;
  online: number;
  about: string;
};

export const communities: Community[] = [
  { slug: "ai", name: "Artificial Intelligence", icon: Sparkles, members: "184k", online: 2841, about: "Frontier models, agents, eval, alignment." },
  { slug: "ml", name: "Machine Learning", icon: Brain, members: "121k", online: 1932, about: "Foundations, applied research, MLOps." },
  { slug: "robotics", name: "Robotics", icon: Bot, members: "38k", online: 612, about: "Manipulation, perception, sim-to-real." },
  { slug: "psychology", name: "Psychology", icon: HeartPulse, members: "72k", online: 1204, about: "Cognition, behavior, applied research." },
  { slug: "video", name: "Video Editing", icon: Video, members: "58k", online: 894, about: "Color, story, motion, post pipelines." },
  { slug: "cybersec", name: "Cyber Security", icon: Shield, members: "94k", online: 1487, about: "Offensive, defensive, threat intel." },
  { slug: "automation", name: "Automation", icon: CircuitBoard, members: "44k", online: 738, about: "Pipelines, RPA, agent workflows." },
  { slug: "programming", name: "Programming", icon: Code2, members: "212k", online: 3104, about: "Languages, systems, craft." },
  { slug: "business", name: "Business", icon: Briefcase, members: "102k", online: 1620, about: "Strategy, operations, leadership." },
  { slug: "finance", name: "Finance", icon: LineChart, members: "88k", online: 1342, about: "Markets, valuation, quant." },
  { slug: "design", name: "Graphic Design", icon: Palette, members: "76k", online: 1108, about: "Type, brand, editorial." },
  { slug: "cloud", name: "Cloud Computing", icon: Cloud, members: "63k", online: 974, about: "Architecture, infra, platform." },
  { slug: "uiux", name: "UI / UX", icon: PenTool, members: "147k", online: 2210, about: "Interaction, systems, craft." },
  { slug: "marketing", name: "Marketing", icon: Megaphone, members: "98k", online: 1456, about: "Growth, brand, storytelling." },
  { slug: "photography", name: "Photography", icon: Camera, members: "54k", online: 826, about: "Light, frame, narrative." },
  { slug: "data", name: "Data Science", icon: Database, members: "115k", online: 1789, about: "Analysis, modeling, decisions." },
  { slug: "startup", name: "Startup", icon: Rocket, members: "69k", online: 1058, about: "Building 0→1, fundraising, hiring." },
];

export type Post = {
  id: string;
  author: string;
  initials: string;
  unique_id: string;
  role: string;
  mentor: boolean;
  communitySlug: string;
  time: string;
  title: string;
  body: string;
  image?: string;
  votes: number;
  comments: number;
  tag?: string;
  kind: PostKind;
};

/**
 * Content philosophy — Syncpedia 70 / 20 / 10
 *   70% education: tutorial, project, mentor, discussion, question, resource, challenge
 *   20% signal:    news, case study, career, launch
 *   10% light:     meme, poll, quiz
 */
export type PostKind =
  | "tutorial"
  | "project"
  | "mentor"
  | "discussion"
  | "question"
  | "resource"
  | "challenge"
  | "news"
  | "case-study"
  | "career"
  | "launch"
  | "meme"
  | "poll"
  | "quiz";

export const KIND_BUCKET: Record<PostKind, "education" | "signal" | "light"> = {
  tutorial: "education",
  project: "education",
  mentor: "education",
  discussion: "education",
  question: "education",
  resource: "education",
  challenge: "education",
  news: "signal",
  "case-study": "signal",
  career: "signal",
  launch: "signal",
  meme: "light",
  poll: "light",
  quiz: "light",
};

export const KIND_LABEL: Record<PostKind, string> = {
  tutorial: "Tutorial",
  project: "Project",
  mentor: "Mentor note",
  discussion: "Discussion",
  question: "Question",
  resource: "Resource",
  challenge: "Challenge",
  news: "Industry news",
  "case-study": "Case study",
  career: "Career",
  launch: "Launch",
  meme: "Meme",
  poll: "Poll",
  quiz: "Quiz",
};

export const posts: Post[] = [
  {
    id: "p1",
    author: "Mira Okafor",
    initials: "MO",
    unique_id: SP-MIRA01,
    role: "Stanford NLP",
    mentor: true,
    communitySlug: "ai",
    time: "2h",
    title: "How do you actually evaluate LLM agents in production?",
    body: "Static benchmarks broke for us last quarter. We now blend trace-level scoring with weekly human review on a stratified sample. Curious what others are doing — especially around drift detection.",
    votes: 1248,
    comments: 184,
    tag: "Discussion",
    kind: "mentor",
  },
  {
    id: "p2",
    author: "Daniel Park",
    initials: "DP",
    unique_id: SP-DANP02,
    role: "Self-taught, year 2",
    mentor: false,
    communitySlug: "programming",
    time: "4h",
    title: "Is it normal to forget 70% of a language after not using it for 6 months?",
    body: "Came back to Rust after working in TypeScript for half a year and felt like a beginner again. Trying to figure out what to actually retain vs re-learn each time.",
    votes: 612,
    comments: 97,
    tag: "Question",
    kind: "question",
  },
  {
    id: "p3",
    author: "Jonas Lindqvist",
    initials: "JL",
    unique_id: SP-JONL03,
    role: "Lead Designer, Linear",
    mentor: true,
    communitySlug: "uiux",
    time: "6h",
    title: "A design system is a point of view. A component library is plumbing.",
    body: "Teams confuse the two and end up with neither. If your designers can't explain the system in one paragraph, it isn't one yet — it's a Figma file.",
    votes: 2104,
    comments: 312,
    tag: "Mentor Note",
    kind: "mentor",
  },
  {
    id: "p4",
    author: "Anika Rao",
    initials: "AR",
    unique_id: SP-ANIR04,
    role: "Quant, Two Sigma",
    mentor: true,
    communitySlug: "finance",
    time: "9h",
    title: "Stop staring at Sharpe. Start asking which assumption would unwind the position.",
    body: "Risk is the set of futures you haven't priced in. A healthy mental model isn't a metric, it's a list of things you'd be wrong about.",
    votes: 1842,
    comments: 241,
    tag: "Mentor Note",
    kind: "mentor",
  },
  {
    id: "p5",
    author: "Sara El-Sayed",
    initials: "SE",
    unique_id: SP-SARE05,
    role: "Senior Editor",
    mentor: false,
    communitySlug: "video",
    time: "11h",
    title: "What's the one cut you make that nobody ever notices?",
    body: "For me: trimming the first 4 frames of every dialogue clip. Pacing tightens immediately. Curious what your invisible cuts are.",
    votes: 487,
    comments: 156,
    tag: "Discussion",
    kind: "discussion",
  },
  {
    id: "p6",
    author: "Marcus Vidal",
    initials: "MV",
    unique_id: SP-MARV06,
    role: "Red team lead",
    mentor: true,
    communitySlug: "cybersec",
    time: "14h",
    title: "Most breaches I see start with a calendar invite, not an exploit.",
    body: "Phishing maturity hasn't moved in 5 years on the defender side. The offensive side ships a new variant every month.",
    votes: 1583,
    comments: 209,
    tag: "Mentor Note",
    kind: "mentor",
  },
  {
    id: "p7",
    author: "Liu Wen",
    initials: "LW",
    unique_id: SP-LIUW07,
    role: "PM, fintech",
    mentor: false,
    communitySlug: "business",
    time: "1d",
    title: "How do you decide when a feature is 'done enough' to ship?",
    body: "We keep getting stuck in 90% polish for 50% of the value. Looking for frameworks the mentors here actually use, not Medium articles.",
    votes: 734,
    comments: 128,
    tag: "Question",
    kind: "question",
  },
  {
    id: "p8",
    author: "Priya Shah",
    initials: "PS",
    unique_id: SP-PRIS08,
    role: "ML engineer",
    mentor: false,
    communitySlug: "ml",
    time: "3h",
    title: "Built a tiny RAG that runs entirely on-device — full write-up + repo",
    body: "8MB model, sub-200ms latency on an M1 Air, no API keys. Walkthrough of the embedding choice, the chunker, and the eval set I used to compare it against a hosted baseline.",
    votes: 968,
    comments: 142,
    tag: "Project",
    kind: "project",
  },
  {
    id: "p9",
    author: "Syncpedia Weekly",
    initials: "SW",
    unique_id: SP-SYNC09,
    role: "Editorial",
    mentor: false,
    communitySlug: "ai",
    time: "7h",
    title: "Anthropic's new model card quietly redefines how we should think about evals",
    body: "Three things changed: deprecation policy, behavioral spec versioning, and refusal calibration. Here's the 4-minute summary with the citations that matter.",
    votes: 1421,
    comments: 188,
    tag: "News",
    kind: "news",
  },
  {
    id: "p10",
    author: "Community Challenge",
    initials: "CC",
    unique_id: SP-COMM10,
    role: "Weekly build",
    mentor: false,
    communitySlug: "programming",
    time: "1d",
    title: "This week: ship a CLI that does one boring thing extraordinarily well",
    body: "Constraint: under 200 lines, zero runtime deps, must have a man page. Top 3 entries get a mentor review session. Submit by Sunday 23:59 UTC.",
    votes: 612,
    comments: 94,
    tag: "Challenge",
    kind: "challenge",
  },
  {
    id: "p11",
    author: "Hana Brennan",
    initials: "HB",
    unique_id: SP-HANB11,
    role: "Recruiter, Stripe",
    mentor: true,
    communitySlug: "business",
    time: "12h",
    title: "What 'I want impact' actually means to a hiring manager",
    body: "I read it 40 times a week. Here's how to translate it into one sentence that earns you a second round — and the two phrasings that quietly disqualify you.",
    votes: 1102,
    comments: 217,
    tag: "Career",
    kind: "career",
  },
  {
    id: "p12",
    author: "Theo Marchetti",
    initials: "TM",
    unique_id: SP-THEM12,
    role: "CS senior",
    mentor: false,
    communitySlug: "programming",
    time: "16h",
    title: "Me explaining to my rubber duck why the bug is definitely the compiler's fault",
    body: "Spoiler: it was a missing await. Three hours. I'm fine. I'm great. (Drop yours below — what bug humbled you this week?)",
    votes: 2890,
    comments: 421,
    tag: "Meme",
    kind: "meme",
  },
];

export function communityBySlug(slug: string) {
  return communities.find((c) => c.slug === slug);
}

/**
 * Order the feed so it always satisfies the 70 / 20 / 10 mix:
 * education content leads, signal threads in, light content is sprinkled
 * sparingly — never two light items in a row, never light in the top 3.
 */
export function balancedFeed(input: Post[] = posts): Post[] {
  const buckets = {
    education: [] as Post[],
    signal: [] as Post[],
    light: [] as Post[],
  };
  for (const p of input) buckets[KIND_BUCKET[p.kind]].push(p);

  const out: Post[] = [];
  let i = 0;
  while (buckets.education.length || buckets.signal.length || buckets.light.length) {
    const slot = i % 10;
    let pick: Post | undefined;
    if (slot === 9 && i >= 3) pick = buckets.light.shift();
    else if (slot === 3 || slot === 7) pick = buckets.signal.shift();
    pick = pick ?? buckets.education.shift() ?? buckets.signal.shift() ?? buckets.light.shift();
    if (!pick) break;
    out.push(pick);
    i++;
  }
  return out;
}