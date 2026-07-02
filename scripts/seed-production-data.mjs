#!/usr/bin/env node
/**
 * Seeds Syncpedia production data into Neon Postgres.
 * Idempotent: re-run safely — upserts rows with seed_* ids.
 *
 * Usage: npm run seed:production
 * Requires DATABASE_URL in .env or environment.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env or export it.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const NOW = new Date().toISOString();
const ADMIN = "Syncpedia Admin";

const COMMUNITIES = [
  { id: "seed_com_ai", slug: "ai", name: "Artificial Intelligence", icon_key: "atom", about: "Frontier models, agents, eval, alignment." },
  { id: "seed_com_ml", slug: "ml", name: "Machine Learning", icon_key: "network", about: "Foundations, applied research, MLOps." },
  { id: "seed_com_robotics", slug: "robotics", name: "Robotics", icon_key: "cpu", about: "Manipulation, perception, sim-to-real." },
  { id: "seed_com_psychology", slug: "psychology", name: "Psychology", icon_key: "lightbulb", about: "Cognition, behavior, applied research." },
  { id: "seed_com_video", slug: "video", name: "Video Editing", icon_key: "film", about: "Color, story, motion, post pipelines." },
  { id: "seed_com_cybersec", slug: "cybersec", name: "Cyber Security", icon_key: "shield", about: "Offensive, defensive, threat intel." },
  { id: "seed_com_automation", slug: "automation", name: "Automation", icon_key: "workflow", about: "Pipelines, RPA, agent workflows." },
  { id: "seed_com_programming", slug: "programming", name: "Programming", icon_key: "terminal", about: "Languages, systems, craft." },
  { id: "seed_com_business", slug: "business", name: "Business", icon_key: "building", about: "Strategy, operations, leadership." },
  { id: "seed_com_finance", slug: "finance", name: "Finance", icon_key: "trending", about: "Markets, valuation, quant." },
  { id: "seed_com_design", slug: "design", name: "Graphic Design", icon_key: "layers", about: "Type, brand, editorial." },
  { id: "seed_com_cloud", slug: "cloud", name: "Cloud Computing", icon_key: "cloud", about: "Architecture, infra, platform." },
  { id: "seed_com_uiux", slug: "uiux", name: "UI / UX", icon_key: "cursor", about: "Interaction, systems, craft." },
  { id: "seed_com_marketing", slug: "marketing", name: "Marketing", icon_key: "radio", about: "Growth, brand, storytelling." },
  { id: "seed_com_photography", slug: "photography", name: "Photography", icon_key: "aperture", about: "Light, frame, narrative." },
  { id: "seed_com_data", slug: "data", name: "Data Science", icon_key: "chart", about: "Analysis, modeling, decisions." },
  { id: "seed_com_startup", slug: "startup", name: "Startup", icon_key: "flame", about: "Building 0→1, fundraising, hiring." },
];

const STUDENTS = [
  { name: "Aarav Sharma", college: "IIIT Hyderabad", year: "3rd Year", branch: "CSE", department: "Computer Science" },
  { name: "Priya Reddy", college: "JNTUH", year: "2nd Year", branch: "ECE", department: "Electronics" },
  { name: "Rohan Kumar", college: "Osmania University", year: "4th Year", branch: "IT", department: "Information Technology" },
  { name: "Ananya Desai", college: "BITS Pilani Hyderabad", year: "1st Year", branch: "CSE", department: "Computer Science" },
  { name: "Karthik Rao", college: "CBIT", year: "3rd Year", branch: "CSE", department: "Computer Science" },
  { name: "Sneha Gupta", college: "VNR VJIET", year: "2nd Year", branch: "AI & DS", department: "Artificial Intelligence" },
  { name: "Vikram Singh", college: "MGIT", year: "4th Year", branch: "ECE", department: "Electronics" },
  { name: "Meera Nair", college: "IIIT Hyderabad", year: "2nd Year", branch: "CSD", department: "Computer Science" },
  { name: "Arjun Patel", college: "JNTUH", year: "3rd Year", branch: "Mechanical", department: "Mechanical Engineering" },
  { name: "Divya K", college: "St. Francis College", year: "2nd Year", branch: "BBA", department: "Business Administration" },
  { name: "Harshith Varma", college: "GITAM Hyderabad", year: "1st Year", branch: "CSE", department: "Computer Science" },
  { name: "Lakshmi Iyer", college: "CBIT", year: "4th Year", branch: "IT", department: "Information Technology" },
  { name: "Nikhil Choudhary", college: "Vasavi College", year: "3rd Year", branch: "CSE", department: "Computer Science" },
  { name: "Pooja Menon", college: "Osmania University", year: "2nd Year", branch: "Statistics", department: "Mathematics" },
  { name: "Rahul Thomas", college: "IIIT Hyderabad", year: "4th Year", branch: "ECE", department: "Electronics" },
  { name: "Sravani B", college: "JNTUH", year: "1st Year", branch: "CSE", department: "Computer Science" },
  { name: "Tarun Agarwal", college: "BITS Pilani Hyderabad", year: "3rd Year", branch: "EEE", department: "Electrical Engineering" },
  { name: "Uma Shankar", college: "MGIT", year: "2nd Year", branch: "Civil", department: "Civil Engineering" },
  { name: "Varun Reddy", college: "VNR VJIET", year: "4th Year", branch: "CSE", department: "Computer Science" },
  { name: "Yashika Jain", college: "GITAM Hyderabad", year: "3rd Year", branch: "MBA Tech", department: "Business" },
];

const PROFESSIONALS = [
  { name: "Aditya Menon", company: "Microsoft India", experience: "6 years", department: "Cloud Solutions" },
  { name: "Bhavana Sri", company: "Amazon Development Centre", experience: "4 years", department: "Product Management" },
  { name: "Chaitanya G", company: "Deloitte Hyderabad", experience: "8 years", department: "Consulting" },
  { name: "Deepika N", company: "Google Hyderabad", experience: "5 years", department: "Software Engineering" },
  { name: "Eshwar K", company: "Freshworks", experience: "3 years", department: "Growth Marketing" },
  { name: "Farhan Ali", company: "TCS Digital", experience: "7 years", department: "Data Engineering" },
  { name: "Gayatri Rao", company: "Phoenix Tech Park", experience: "9 years", department: "UX Research" },
  { name: "Hemanth S", company: "Syncpedia", experience: "2 years", department: "Community Operations" },
  { name: "Isha Malhotra", company: "Wipro", experience: "5 years", department: "Cyber Security" },
  { name: "Jatin Mehta", company: "Startup Hyderabad Hub", experience: "4 years", department: "Venture Programs" },
];

const HYDERABAD_EVENTS = [
  {
    id: "seed_evt_01",
    title: "Syncpedia Hyderabad Launch Meetup",
    community_slug: "startup",
    description: "Meet founders, students, and mentors building on Syncpedia. Demos, networking, and coin rewards.",
    location: "T-Hub 2.0, Raidurg, Hyderabad",
    starts_at: "Sat, Jul 5 · 4:00 PM IST",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    price: 0,
    coins: 50,
  },
  {
    id: "seed_evt_02",
    title: "AI Builders Night — RAG in Production",
    community_slug: "ai",
    description: "Hands-on session on chunking, embeddings, and evals for Indian language datasets.",
    location: "Microsoft Reactor, Gachibowli",
    starts_at: "Wed, Jul 9 · 6:30 PM IST",
    image_url: "https://images.unsplash.com/photo-1677440866019-21743ecad50a?w=800&q=80",
    price: 0,
    coins: 40,
  },
  {
    id: "seed_evt_03",
    title: "Full-Stack TypeScript Sprint",
    community_slug: "programming",
    description: "Pair-programming on TanStack Start + Neon. Bring your laptop.",
    location: "IIIT Hyderabad, Gachibowli",
    starts_at: "Sun, Jul 13 · 10:00 AM IST",
    image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
    price: 99,
    coins: 35,
  },
  {
    id: "seed_evt_04",
    title: "UI/UX Portfolio Review — Hyderabad",
    community_slug: "uiux",
    description: "Senior designers review student portfolios. Limited slots.",
    location: "WeWork Krishe Emerald, Kondapur",
    starts_at: "Fri, Jul 18 · 5:00 PM IST",
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    price: 0,
    coins: 30,
  },
  {
    id: "seed_evt_05",
    title: "Cybersecurity War Room",
    community_slug: "cybersec",
    description: "Blue-team exercises and incident response drills for students.",
    location: "Cyber Towers, HITEC City",
    starts_at: "Sat, Jul 19 · 2:00 PM IST",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    price: 149,
    coins: 45,
  },
  {
    id: "seed_evt_06",
    title: "Data Science Case Study Jam",
    community_slug: "data",
    description: "Solve a real growth analytics problem from a Hyderabad startup.",
    location: "Inorbit Mall Co-working, Madhapur",
    starts_at: "Thu, Jul 24 · 6:00 PM IST",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    price: 0,
    coins: 40,
  },
  {
    id: "seed_evt_07",
    title: "Marketing for Student Founders",
    community_slug: "marketing",
    description: "Storytelling, reels, and LinkedIn growth for campus startups.",
    location: "91Springboard, HITEC City",
    starts_at: "Tue, Jul 29 · 7:00 PM IST",
    image_url: "https://images.unsplash.com/photo-1515187024625-57bc888de439?w=800&q=80",
    price: 0,
    coins: 25,
  },
  {
    id: "seed_evt_08",
    title: "Startup Pitch Practice — Seed Stage",
    community_slug: "startup",
    description: "Practice your 3-minute pitch with operators who've raised in India.",
    location: "Banjara Hills Business Centre",
    starts_at: "Sat, Aug 2 · 11:00 AM IST",
    image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    price: 0,
    coins: 35,
  },
  {
    id: "seed_evt_09",
    title: "Cloud Architecture Office Hours",
    community_slug: "cloud",
    description: "AWS/Azure cost optimization and serverless patterns for student projects.",
    location: "Amazon Office, Nanakramguda",
    starts_at: "Wed, Aug 6 · 5:30 PM IST",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    price: 0,
    coins: 30,
  },
  {
    id: "seed_evt_10",
    title: "Syncpedia Community Awards Night",
    community_slug: "startup",
    description: "Celebrate top contributors, gig completers, and quiz winners in Hyderabad.",
    location: "Hyderabad Convention Centre, Madhapur",
    starts_at: "Sat, Aug 16 · 6:00 PM IST",
    image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    price: 0,
    coins: 60,
  },
];

const GIGS = [
  {
    id: "seed_gig_01",
    title: "Syncpedia Story Promotion — Instagram Reels",
    poster: "Syncpedia",
    community_slug: "marketing",
    description:
      "Create a 30–60s Instagram Reel or Story explaining how Syncpedia helps students learn and earn coins. Tag @syncpedia.in and include #SyncpediaHyderabad. Submit link + screenshot.",
    location: "Hyderabad / Remote",
    duration: "3 days",
    pay: 1500,
    coins: 120,
    image_url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80",
  },
  {
    id: "seed_gig_02",
    title: "LinkedIn Certificate & Profile Promotion — Syncpedia",
    poster: "Syncpedia",
    community_slug: "marketing",
    description:
      "Share your Syncpedia course certificate on LinkedIn with a 150-word post on what you learned. Add Syncpedia to Licenses & Certifications. Submit post URL.",
    location: "Remote",
    duration: "2 days",
    pay: 800,
    coins: 80,
    image_url: "https://images.unsplash.com/photo-1611946873355-22e9c0d0e4b0?w=800&q=80",
  },
];

const INTERNSHIPS = [
  {
    id: "seed_ipt_01",
    role: "Business Growth Specialist",
    company: "Syncpedia",
    community_slug: "business",
    description: "Drive community growth in Hyderabad colleges. Run campus activations, track funnel metrics, and coordinate with student ambassadors.",
    location: "Hyderabad",
    mode: "Hybrid",
    duration: "6 months",
    stipend: 18000,
    coins: 250,
    image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  },
  {
    id: "seed_ipt_02",
    role: "Business Development Associate (BDA)",
    company: "Syncpedia",
    community_slug: "startup",
    description: "Outreach to colleges and training partners. Schedule demos, onboard mentors, and maintain CRM hygiene.",
    location: "Hyderabad",
    mode: "On-site",
    duration: "4 months",
    stipend: 12000,
    coins: 200,
    image_url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
  },
  {
    id: "seed_ipt_03",
    role: "Business Development Executive (BDE)",
    company: "Syncpedia",
    community_slug: "business",
    description: "Close partnerships with ed-tech vendors and event sponsors. Own revenue pipeline for Syncpedia Hyderabad.",
    location: "Hyderabad",
    mode: "Hybrid",
    duration: "6 months",
    stipend: 20000,
    coins: 300,
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  },
  {
    id: "seed_ipt_04",
    role: "Content & Video Editor",
    company: "Syncpedia",
    community_slug: "video",
    description: "Edit short-form community highlights, event recaps, and course trailers. Proficiency in Premiere Pro or DaVinci Resolve required.",
    location: "Hyderabad",
    mode: "Remote",
    duration: "3 months",
    stipend: 15000,
    coins: 180,
    image_url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
  },
];

const COURSES = [
  {
    id: "seed_crs_01",
    community_slug: "startup",
    title: "Syncpedia Community Onboarding",
    description: "Learn how communities, coins, gigs, and events work on Syncpedia — start earning from day one.",
    url: "https://app.syncpedia.in/communities",
    price: 0,
    coins: 50,
    image_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  },
  {
    id: "seed_crs_02",
    community_slug: "marketing",
    title: "How to Earn Coins on Syncpedia",
    description: "Quizzes, gigs, events, and referrals — a practical guide to maximizing your Syncpedia wallet.",
    url: "https://app.syncpedia.in/quizzes",
    price: 0,
    coins: 40,
    image_url: "https://images.unsplash.com/photo-1621761190628-f3d2b3e7e6b0?w=800&q=80",
  },
  {
    id: "seed_crs_03",
    community_slug: "marketing",
    title: "Digital Marketing",
    subtitle: "Professional Certification",
    category: "MARKETING",
    program_duration: "3 Months Program",
    description:
      "Master SEO, social media marketing, and performance ads with expert mentorship and real-world projects. Earn an industry-recognized certificate.",
    url: "https://app.syncpedia.in/courses/seed_crs_03",
    price: 4999,
    coins: 80,
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    video_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    lectures_count: 24,
    hours_label: "30+ Hours",
    language: "English",
    level: "Beginner",
    projects_label: "2 Real Projects",
  },
  {
    id: "seed_crs_04",
    community_slug: "ai",
    title: "Prompt Engineering Fundamentals",
    description: "Structured prompting, eval loops, and safety basics for builders using modern LLMs.",
    url: "https://app.syncpedia.in/courses",
    price: 0,
    coins: 100,
    image_url: "https://images.unsplash.com/photo-1677440866019-21743ecad50a?w=800&q=80",
  },
  {
    id: "seed_crs_05",
    community_slug: "programming",
    title: "Full-Stack TypeScript with TanStack",
    description: "Router, Start, Query, and server functions — ship a production community app.",
    url: "https://app.syncpedia.in/courses",
    price: 499,
    coins: 120,
    image_url: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
  },
  {
    id: "seed_crs_06",
    community_slug: "uiux",
    title: "Mobile-First UI for Community Apps",
    description: "Design patterns for feeds, onboarding, and coin economies on small screens.",
    url: "https://app.syncpedia.in/courses",
    price: 0,
    coins: 60,
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  },
];

// Quizzes: see src/lib/quiz-bank.ts (10 real tech quizzes, synced via seedQuizBank on app start).

const SAMPLE_POSTS = [
  { student: 0, slug: "ai", title: "Best free resources to start with LLMs in 2026?", body: "I'm a 3rd year CSE student at IIIT-H. What courses or repos would you recommend before attempting a RAG project?" },
  { student: 1, slug: "programming", title: "TanStack Start vs Next.js for a campus project?", body: "Our team is building a community app. Is TanStack Start mature enough for production?" },
  { student: 2, slug: "startup", title: "How to validate a B2B idea in Hyderabad?", body: "We have a rough MVP for college placement analytics. Where do Hyderabad founders usually get first users?" },
  { student: 3, slug: "uiux", title: "Portfolio review before internship season", body: "Sharing my Behance link — would love feedback on mobile case studies." },
  { student: 4, slug: "data", title: "SQL practice datasets with Indian context?", body: "Looking for datasets similar to real startup metrics (DAU, retention) for a class project." },
  { student: 5, slug: "marketing", title: "Reels ideas for a student tech club", body: "We're promoting a hackathon. What hooks work for Instagram Reels in Hyderabad colleges?" },
  { student: 6, slug: "cybersec", title: "CTF prep for beginners", body: "Any Hyderabad groups or weekly CTFs friendly to first-time players?" },
  { student: 7, slug: "ml", title: "Kaggle vs real-world ML — gap?", body: "How much of competition ML transfers to internships in product companies?" },
  { student: 8, slug: "business", title: "MBA Tech vs pure CSE for product roles?", body: "Debating electives for product management track. Experiences welcome." },
  { student: 9, slug: "design", title: "Figma auto-layout tips for feed cards", body: "Building a Reddit-style mobile feed for class. Auto-layout keeps breaking on long titles." },
  { student: 10, slug: "cloud", title: "Free tier for student deployments", body: "What's the most reliable free stack to host a TanStack app for demos?" },
  { student: 11, slug: "video", title: "DaVinci Resolve on MacBook Air — viable?", body: "Editing 1080p event recaps for college fest. Will 8GB RAM suffice?" },
  { pro: 0, slug: "ai", title: "Mentor office hours — production RAG patterns", body: "Happy to review architecture diagrams from students building retrieval pipelines. Drop your stack below.", mentor: true },
  { pro: 1, slug: "startup", title: "What we look for in student founders", body: "Clarity of problem, speed of iteration, and thoughtful metrics — not pitch deck polish.", mentor: true },
  { pro: 3, slug: "programming", title: "TypeScript tips from a Google Hyderabad engineer", body: "Prefer narrow types at boundaries, keep server functions thin, and test with real Neon branches.", mentor: true },
];

async function ensureSchema() {
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS category text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_duration text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS lectures_count integer DEFAULT 0`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS hours_label text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS language text DEFAULT 'English'`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS level text DEFAULT 'Beginner'`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS projects_label text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url text DEFAULT ''`;
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_links text DEFAULT ''`;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id text PRIMARY KEY,
      community_slug text,
      title text NOT NULL,
      description text DEFAULT '',
      image_url text DEFAULT '',
      location text DEFAULT '',
      starts_at text DEFAULT '',
      coins integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  `;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0`;
  await sql`
    CREATE TABLE IF NOT EXISTS gigs (
      id text PRIMARY KEY,
      community_slug text,
      title text NOT NULL,
      poster text DEFAULT '',
      description text DEFAULT '',
      image_url text DEFAULT '',
      location text DEFAULT '',
      duration text DEFAULT '',
      pay numeric DEFAULT 0,
      coins integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS internship_postings (
      id text PRIMARY KEY,
      community_slug text,
      role text NOT NULL,
      company text DEFAULT '',
      description text DEFAULT '',
      image_url text DEFAULT '',
      location text DEFAULT '',
      mode text DEFAULT 'Remote',
      duration text DEFAULT '',
      stipend numeric DEFAULT 0,
      coins integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS quizzes (
      id text PRIMARY KEY,
      community_slug text,
      title text NOT NULL,
      description text DEFAULT '',
      questions_count integer DEFAULT 0,
      minutes integer DEFAULT 0,
      coins integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS coin_ledger (
      user_unique_id text NOT NULL,
      action_key text NOT NULL,
      amount integer NOT NULL CHECK (amount >= 0),
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY (user_unique_id, action_key)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS feature_flags (
      key text PRIMARY KEY,
      enabled boolean NOT NULL DEFAULT true,
      updated_at timestamptz DEFAULT now()
    )
  `;
  try {
    await sql`ALTER TABLE communities ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
  } catch {
    /* legacy */
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "")
    .slice(0, 24);
}

async function seedProfiles() {
  await sql`DELETE FROM profiles WHERE id LIKE 'seed_prof_%'`;
  let count = 0;
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const n = String(i + 1).padStart(2, "0");
    const id = `seed_prof_stu_${n}`;
    const unique_id = `SP-HYD${n}`;
    const device_key = `seed_stu_${n}`;
    const gmail = `${slugify(s.name)}.stu${n}@students.syncpedia.in`;
    const mobile = `+9198765${String(i + 1).padStart(5, "0")}`;
    await sql`
      INSERT INTO profiles (id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at)
      VALUES (${id}, ${device_key}, ${s.name}, ${mobile}, ${gmail}, ${s.year}, ${s.college}, 'student', ${unique_id},
        NULL, NULL, ${s.branch}, ${s.department}, ${NOW})
    `;
    await sql`
      INSERT INTO coin_ledger (user_unique_id, action_key, amount)
      VALUES (${unique_id}, 'signup', 50)
      ON CONFLICT (user_unique_id, action_key) DO NOTHING
    `;
    count++;
  }
  for (let i = 0; i < PROFESSIONALS.length; i++) {
    const p = PROFESSIONALS[i];
    const n = String(i + 1).padStart(2, "0");
    const id = `seed_prof_pro_${n}`;
    const unique_id = `SP-PRO${n}`;
    const device_key = `seed_pro_${n}`;
    const gmail = `${slugify(p.name)}.pro${n}@professionals.syncpedia.in`;
    const mobile = `+9198766${String(i + 1).padStart(5, "0")}`;
    await sql`
      INSERT INTO profiles (id, device_key, name, mobile, gmail, year, college, role, unique_id, company, experience, branch, department, created_at)
      VALUES (${id}, ${device_key}, ${p.name}, ${mobile}, ${gmail}, NULL, NULL, 'professional', ${unique_id},
        ${p.company}, ${p.experience}, NULL, ${p.department}, ${NOW})
    `;
    await sql`
      INSERT INTO coin_ledger (user_unique_id, action_key, amount)
      VALUES (${unique_id}, 'signup', 50)
      ON CONFLICT (user_unique_id, action_key) DO NOTHING
    `;
    count++;
  }
  return count;
}

async function seedCommunities() {
  for (const c of COMMUNITIES) {
    const existing = await sql`SELECT id FROM communities WHERE slug = ${c.slug} LIMIT 1`;
    if (existing.length) {
      await sql`
        UPDATE communities SET
          name = ${c.name},
          about = ${c.about},
          icon_key = ${c.icon_key},
          status = 'approved',
          creator_name = ${ADMIN},
          creator_role = 'admin',
          approved_at = COALESCE(approved_at, ${NOW}::timestamptz)
        WHERE slug = ${c.slug}
      `;
    } else {
      await sql`
        INSERT INTO communities (id, slug, name, about, icon_key, image_url, status, creator_name, creator_role, approved_at, created_at)
        VALUES (${c.id}, ${c.slug}, ${c.name}, ${c.about}, ${c.icon_key}, '', 'approved', ${ADMIN}, 'admin', ${NOW}, ${NOW})
      `;
    }
  }
  return COMMUNITIES.length;
}

async function seedEvents() {
  for (const e of HYDERABAD_EVENTS) {
    await sql`
      INSERT INTO events (id, community_slug, title, description, image_url, location, starts_at, price, coins, created_at)
      VALUES (${e.id}, ${e.community_slug}, ${e.title}, ${e.description}, ${e.image_url}, ${e.location}, ${e.starts_at}, ${e.price}, ${e.coins}, ${NOW})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        location = EXCLUDED.location,
        starts_at = EXCLUDED.starts_at,
        price = EXCLUDED.price,
        coins = EXCLUDED.coins
    `;
  }
  return HYDERABAD_EVENTS.length;
}

async function seedGigs() {
  for (const g of GIGS) {
    await sql`
      INSERT INTO gigs (id, community_slug, title, poster, description, image_url, location, duration, pay, coins, created_at)
      VALUES (${g.id}, ${g.community_slug}, ${g.title}, ${g.poster}, ${g.description}, ${g.image_url}, ${g.location}, ${g.duration}, ${g.pay}, ${g.coins}, ${NOW})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        pay = EXCLUDED.pay,
        coins = EXCLUDED.coins
    `;
  }
  return GIGS.length;
}

async function seedInternships() {
  for (const j of INTERNSHIPS) {
    await sql`
      INSERT INTO internship_postings (id, community_slug, role, company, description, image_url, location, mode, duration, stipend, coins, created_at)
      VALUES (${j.id}, ${j.community_slug}, ${j.role}, ${j.company}, ${j.description}, ${j.image_url}, ${j.location}, ${j.mode}, ${j.duration}, ${j.stipend}, ${j.coins}, ${NOW})
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        description = EXCLUDED.description,
        stipend = EXCLUDED.stipend,
        coins = EXCLUDED.coins
    `;
  }
  return INTERNSHIPS.length;
}

async function seedCourses() {
  for (const c of COURSES) {
    await sql`
      INSERT INTO courses (
        id, community_slug, title, description, url, price, coins, image_url,
        category, program_duration, subtitle, lectures_count, hours_label,
        language, level, projects_label, video_url, class_links, created_at
      )
      VALUES (
        ${c.id}, ${c.community_slug}, ${c.title}, ${c.description}, ${c.url},
        ${c.price ?? 0}, ${c.coins ?? 0}, ${c.image_url ?? ""},
        ${c.category ?? ""}, ${c.program_duration ?? ""}, ${c.subtitle ?? ""},
        ${c.lectures_count ?? 0}, ${c.hours_label ?? ""},
        ${c.language ?? "English"}, ${c.level ?? "Beginner"},
        ${c.projects_label ?? ""}, ${c.video_url ?? ""},
        ${c.class_links ?? ""}, ${NOW}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        coins = EXCLUDED.coins,
        image_url = EXCLUDED.image_url,
        category = EXCLUDED.category,
        program_duration = EXCLUDED.program_duration,
        subtitle = EXCLUDED.subtitle,
        lectures_count = EXCLUDED.lectures_count,
        hours_label = EXCLUDED.hours_label,
        language = EXCLUDED.language,
        level = EXCLUDED.level,
        projects_label = EXCLUDED.projects_label,
        video_url = EXCLUDED.video_url,
        class_links = EXCLUDED.class_links
    `;
  }
  return COURSES.length;
}

async function seedQuizzes() {
  // Quizzes are owned by src/lib/quiz-bank.ts and synced on app startup (seedQuizBank).
  return 0;
}

async function seedPosts() {
  let n = 0;
  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const p = SAMPLE_POSTS[i];
    const id = `seed_q_${String(i + 1).padStart(2, "0")}`;
    let unique_id;
    let author;
    if (p.pro != null) {
      const num = String(p.pro + 1).padStart(2, "0");
      unique_id = `SP-PRO${num}`;
      author = unique_id;
    } else {
      const num = String(p.student + 1).padStart(2, "0");
      unique_id = `SP-HYD${num}`;
      author = unique_id;
    }
    const initials = unique_id.replace("SP-", "").slice(0, 2);
    const tag = p.mentor ? "Mentor" : "Question";
    await sql`
      INSERT INTO questions (id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, hidden, created_at)
      VALUES (${id}, ${author}, ${initials}, ${unique_id}, ${p.slug}, ${p.title}, ${p.body}, ${tag}, ${Math.floor(Math.random() * 40) + 3}, 0, false, ${NOW})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        tag = EXCLUDED.tag
    `;
    n++;
  }
  return n;
}

async function seedFeatureFlags() {
  await sql`
    INSERT INTO feature_flags (key, enabled, updated_at)
    VALUES ('earnings', true, ${NOW})
    ON CONFLICT (key) DO UPDATE SET enabled = true, updated_at = ${NOW}
  `;
}

async function main() {
  const result = await runSeed();
  console.log("Done.");
  console.log(result);
}

export async function runSeed() {
  console.log("Syncpedia production seed — starting…");
  await ensureSchema();
  const profiles = await seedProfiles();
  const communities = await seedCommunities();
  const events = await seedEvents();
  const gigs = await seedGigs();
  const internships = await seedInternships();
  const courses = await seedCourses();
  const quizzes = await seedQuizzes();
  const posts = await seedPosts();
  await seedFeatureFlags();
  return {
    profiles,
    communities,
    events,
    gigs,
    internships,
    courses,
    quizzes,
    posts,
  };
}

const isDirectRun = process.argv[1]?.endsWith("seed-production-data.mjs");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
