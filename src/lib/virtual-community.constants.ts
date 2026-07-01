/** Virtual community members — mirrors seed-production-data.mjs profiles. */

export const VIRTUAL_STUDENT_COUNT = 20;
export const VIRTUAL_PRO_COUNT = 10;
export const POSTS_PER_STUDENT_PER_DAY = 2;

export const VIRTUAL_COMMUNITY_START = "2026-06-29";

export const VIRTUAL_PRO_ROLES: Record<string, string> = {
  "SP-PRO01": "Cloud Solutions, Microsoft India",
  "SP-PRO02": "Product Management, Amazon",
  "SP-PRO03": "Consulting, Deloitte Hyderabad",
  "SP-PRO04": "Software Engineering, Google Hyderabad",
  "SP-PRO05": "Growth Marketing, Freshworks",
  "SP-PRO06": "Data Engineering, TCS Digital",
  "SP-PRO07": "UX Research, Phoenix Tech Park",
  "SP-PRO08": "Community Operations, Syncpedia",
  "SP-PRO09": "Cyber Security, Wipro",
  "SP-PRO10": "Venture Programs, Startup Hyderabad Hub",
};

export type QuestionTemplate = { slug: string; title: string; body: string };

export const VIRTUAL_QUESTION_POOL: QuestionTemplate[] = [
  { slug: "ai", title: "How do you evaluate LLM agents in production?", body: "Our team is shipping a support agent and I'm unsure what to log beyond accuracy. What metrics actually matter at scale?" },
  { slug: "ai", title: "RAG chunk size for Indian language docs?", body: "Building a Telugu+English knowledge base for campus FAQs. Smaller chunks help retrieval but answers feel fragmented." },
  { slug: "ai", title: "Fine-tuning vs prompting for classification?", body: "Need to tag 50k support tickets. Is fine-tuning worth it with only 2k labeled examples?" },
  { slug: "ml", title: "Feature stores for student projects?", body: "Capstone needs repeatable training pipelines. Is Feast overkill for a 3-person team?" },
  { slug: "ml", title: "Handling class imbalance in fraud detection?", body: "Dataset is 0.3% positive. SMOTE helped offline but production precision tanked." },
  { slug: "programming", title: "Rust vs Go for backend internships?", body: "Both teams I'm interviewing with use different stacks. Which is better to double down on this summer?" },
  { slug: "programming", title: "Is it normal to forget a language after 6 months?", body: "Haven't touched Python since last semester and feel slow in interviews. How do you stay sharp?" },
  { slug: "programming", title: "Monorepo tooling for TanStack + Nitro?", body: "Deploying a full-stack app to a VPS. Turborepo vs plain npm workspaces?" },
  { slug: "cloud", title: "Cheapest reliable stack for student demos?", body: "Need HTTPS, Postgres, and cron for a class project. Neon + VPS vs all-in-one PaaS?" },
  { slug: "cloud", title: "IAM least privilege for Lambda beginners?", body: "Professor wants us to explain IAM policies. What's a minimal safe role for S3 + Dynamo?" },
  { slug: "cybersec", title: "CTF prep for complete beginners?", body: "Any Hyderabad groups or weekly CTFs friendly to first-time players? I'm in 2nd year CSE." },
  { slug: "cybersec", title: "How to practice OWASP Top 10 safely?", body: "Want hands-on experience without breaking anything illegal. Recommended lab setups?" },
  { slug: "data", title: "SQL vs Python for exploratory analysis?", body: "Internship mentor says 'start in SQL'. When do you actually need pandas?" },
  { slug: "data", title: "Dashboard tools for non-technical stakeholders?", body: "Building weekly metrics for a college fest. Metabase vs Looker Studio?" },
  { slug: "startup", title: "Validating an idea before building?", body: "We have a campus marketplace concept. How many interviews is 'enough' before writing code?" },
  { slug: "startup", title: "Equity split with classmates?", body: "Three co-founders, equal effort so far. Is 33/33/33 naive for a student startup?" },
  { slug: "business", title: "MBA Tech vs pure CSE for product roles?", body: "Debating electives for product management track. Would love real experiences." },
  { slug: "finance", title: "Learning markets as a CS student?", body: "Interested in quant but don't know where to start beyond YouTube. Structured path?" },
  { slug: "design", title: "Figma auto-layout for mobile feeds?", body: "Building a Reddit-style feed for class. Auto-layout breaks on long titles." },
  { slug: "uiux", title: "Portfolio case studies — how much depth?", body: "Recruiters spend seconds on Behance. What structure actually converts?" },
  { slug: "marketing", title: "Growing a student community on Instagram?", body: "Running a tech club page. Reels vs carousels for workshop promos?" },
  { slug: "video", title: "DaVinci Resolve on MacBook Air 8GB?", body: "Editing 1080p event recaps for college fest. Is it viable or should I rent a PC?" },
  { slug: "robotics", title: "ROS2 vs Arduino for beginner competitions?", body: "First robotics club project. Team is split on complexity vs shipping fast." },
  { slug: "psychology", title: "Study techniques that actually stick?", body: "Re-reading notes isn't working for algorithms. What does evidence say works?" },
  { slug: "automation", title: "n8n vs custom scripts for ops tasks?", body: "Automating event RSVP reminders for our community. Low-code or Python?" },
  { slug: "photography", title: "Low-light event photography on a budget?", body: "Covering hackathon keynote with entry-level mirrorless. Settings advice?" },
  { slug: "ai", title: "Prompt injection in customer-facing bots?", body: "How are teams red-teaming chatbots before launch? Any lightweight checklist?" },
  { slug: "ml", title: "Kaggle vs real-world ML — what's the gap?", body: "How much of competition ML transfers to internships in product companies?" },
  { slug: "programming", title: "System design prep as a junior?", body: "Interview loop includes architecture round. Resources that aren't pure memorization?" },
  { slug: "cloud", title: "Docker compose for local full-stack dev?", body: "Postgres + app + redis locally. Best practices for env files on a team?" },
  { slug: "data", title: "dbt for small analytics teams?", body: "Only 2 analysts supporting 5 product squads. Is dbt worth the overhead?" },
  { slug: "startup", title: "First hire — intern or freelancer?", body: "MVP has traction on campus. Need design help but budget is tight." },
  { slug: "business", title: "Cold outreach that gets replies?", body: "Trying to land mentor calls for our BBA capstone. Templates feel spammy." },
  { slug: "finance", title: "Personal finance before first salary?", body: "Final year — want to understand SIPs, taxes, and emergency funds basics." },
  { slug: "design", title: "Design systems for solo developers?", body: "Shipping alone but want consistent UI. Start with tokens or components?" },
  { slug: "uiux", title: "Usability testing with 5 users — enough?", body: "Professor cited Nielsen but sample is all friends. Does it still count?" },
  { slug: "marketing", title: "SEO for a new community site?", body: "Launching a learning platform landing page. What matters in month one?" },
  { slug: "cybersec", title: "Bug bounty as a student — realistic?", body: "Seen hype on Twitter. Honest path for someone with basic web security?" },
  { slug: "robotics", title: "Sim-to-real for small teams?", body: "Is Gazebo simulation worth learning if we only have one physical bot?" },
  { slug: "psychology", title: "Burnout signs during placement season?", body: "Sleep schedule is wrecked. How do you know when to slow down?" },
  { slug: "automation", title: "Zapier costs at scale?", body: "Automating 500-member community workflows. When does self-hosting win?" },
  { slug: "photography", title: "Color grading for social clips?", body: "Short reels from workshop footage look flat. Beginner LUT workflow?" },
  { slug: "ai", title: "Local LLMs on student laptops?", body: "Ollama runs but slow on integrated graphics. Minimum specs that feel OK?" },
  { slug: "ml", title: "MLOps without a dedicated platform team?", body: "Model works in notebook. What's the smallest path to nightly retraining?" },
  { slug: "programming", title: "Git workflow for 4-person hackathon team?", body: "We always end up with merge hell in the last 6 hours. Better branching?" },
  { slug: "cloud", title: "Monitoring on a shoestring budget?", body: "VPS deploy for class. Uptime + logs without Datadog prices?" },
  { slug: "data", title: "A/B testing with small traffic?", body: "Campus app has ~800 DAU. Can we trust significance tests?" },
  { slug: "startup", title: "Pitch deck for college competition?", body: "10-slide limit. What do judges actually care about vs fluff?" },
];

export const VIRTUAL_ANSWER_BODIES: string[] = [
  "Start with one measurable outcome, then work backward to what you'd log in production. Most teams skip that step and drown in trace noise.",
  "We see this a lot with Hyderabad students — keep scope tiny, ship weekly, and write down what broke. That alone puts you ahead of most interns.",
  "Static benchmarks are a sanity check, not a verdict. The moment you ship, your eval set is yesterday's distribution — plan for drift early.",
  "Happy to review your approach if you share stack + constraints. A one-page architecture diagram is usually enough for useful feedback.",
  "For internships, clarity of thought beats toolchain depth. Pick one path, document tradeoffs, and show a small working demo.",
  "I'd prototype the simplest thing that could work in a weekend, then measure whether users actually care before optimizing.",
  "This is a common early-career trap — you're not forgetting, you're out of reps. Two small projects beat passive review.",
  "Security labs locally (DVWA, WebGoat) plus writeups taught me more than theory slides. Stay on legal targets only.",
  "For product roles, show how you prioritized with incomplete information. That's the job, not perfect slides.",
  "Cloud free tiers are great for demos; add health checks and backups before you call it 'production' for class.",
];

export function virtualStudentId(index: number): string {
  return `SP-HYD${String(index + 1).padStart(2, "0")}`;
}

export function virtualProId(index: number): string {
  return `SP-PRO${String(index + 1).padStart(2, "0")}`;
}

export function hashPick(seed: string, max: number): number {
  if (max <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % max;
}
