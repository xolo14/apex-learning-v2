import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { pageHead } from "@/lib/seo";
import { APP_SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      title: "Terms of Service",
      description:
        "Terms and conditions for using Syncpedia — accounts, community rules, coins, and legal rights.",
      path: "/terms",
    }),
  component: TermsPage,
});

const LAST_UPDATED = "30 June 2026";
const LEGAL_EMAIL = "legal@syncpedia.in";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-medium text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-ink-muted">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TermsPage() {
  return (
    <MobileShell>
      <MobileHeader title="Terms of Service" subtitle={`Last updated ${LAST_UPDATED}`} />
      <article className="space-y-6 px-5 pb-12 text-[14px] leading-relaxed text-foreground">
        <p className="text-ink-muted">
          These Terms of Service (“Terms”) govern your access to and use of services provided by{" "}
          <strong className="text-foreground">Syncpedia Technologies Pvt Ltd</strong> (“Syncpedia”, “we”, “us”, “our”),
          including our website, web app at {APP_SITE_URL}, and mobile applications (collectively, the “Service”).
        </p>
        <p className="text-ink-muted">
          By creating an account, signing in, or otherwise using the Service, you agree to these Terms and our{" "}
          <Link to="/privacy" className="text-forest underline">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>

        <nav className="rounded-xl border border-hairline bg-surface/60 p-4 text-[13px]">
          <p className="font-medium text-foreground">Contents</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-forest">
            <li><a href="#eligibility" className="underline">Eligibility</a></li>
            <li><a href="#account" className="underline">Your account</a></li>
            <li><a href="#conduct" className="underline">Community rules & acceptable use</a></li>
            <li><a href="#content" className="underline">User content & intellectual property</a></li>
            <li><a href="#coins" className="underline">Syncpedia coins & rewards</a></li>
            <li><a href="#third-party" className="underline">Third-party services & links</a></li>
            <li><a href="#disclaimers" className="underline">Disclaimers</a></li>
            <li><a href="#liability" className="underline">Limitation of liability</a></li>
            <li><a href="#indemnity" className="underline">Indemnification</a></li>
            <li><a href="#termination" className="underline">Suspension & termination</a></li>
            <li><a href="#law" className="underline">Governing law & disputes</a></li>
            <li><a href="#changes" className="underline">Changes to these Terms</a></li>
            <li><a href="#contact" className="underline">Contact</a></li>
          </ol>
        </nav>

        <Section id="eligibility" title="1. Eligibility">
          <p>
            You must be at least <strong className="text-foreground">13 years old</strong> to use Syncpedia. If you are
            under 18, you represent that you have permission from a parent or legal guardian. You must provide accurate
            registration information and may not impersonate another person or entity.
          </p>
          <p>
            The Service is intended for students, professionals, and community members in India and elsewhere. You are
            responsible for ensuring your use complies with local laws applicable to you.
          </p>
        </Section>

        <Section id="account" title="2. Your account">
          <BulletList
            items={[
              "You are responsible for activity under your account and for keeping your device and sign-in methods secure.",
              "Syncpedia may use a device identifier and profile information to restore your session on the same device.",
              "You may sign out at any time from Settings. We may suspend or terminate accounts that violate these Terms.",
              "One person should not maintain multiple accounts to manipulate coins, votes, or community features.",
            ]}
          />
          <p>
            When you sign in with Google or email, you authorize us to receive basic profile information (such as name and
            email) as described in our Privacy Policy.
          </p>
        </Section>

        <Section id="conduct" title="3. Community rules & acceptable use">
          <p>You agree not to:</p>
          <BulletList
            items={[
              "Post unlawful, harassing, hateful, sexually explicit, violent, or defamatory content",
              "Share others’ private information without consent (doxxing)",
              "Spam, scam, phish, or promote malware or fraudulent schemes",
              "Infringe copyrights, trademarks, or other intellectual property rights",
              "Attempt to hack, scrape, reverse engineer, or overload our systems",
              "Use bots or automation to manipulate feeds, coins, quizzes, or leaderboards",
              "Misrepresent your affiliation with Syncpedia, colleges, employers, or events",
            ]}
          />
          <p>
            We may remove content, restrict features, or ban accounts at our discretion to protect the community. Serious
            violations may be reported to law enforcement where required.
          </p>
        </Section>

        <Section id="content" title="4. User content & intellectual property">
          <p>
            You retain ownership of content you post (questions, answers, comments, profile details, event registrations,
            etc.). By posting, you grant Syncpedia a{" "}
            <strong className="text-foreground">non-exclusive, worldwide, royalty-free license</strong> to host, display,
            reproduce, and distribute your content solely to operate and improve the Service (including moderation, search,
            and community features).
          </p>
          <p>
            Syncpedia’s name, logo, app design, software, and curated materials are owned by Syncpedia or its licensors.
            You may not copy or use our branding without written permission.
          </p>
        </Section>

        <Section id="coins" title="5. Syncpedia coins & rewards">
          <p>
            Syncpedia coins are <strong className="text-foreground">virtual rewards</strong> within the platform. They
            have no cash value, are not legal tender, and cannot be exchanged for money unless we explicitly offer a
            redeemable promotion with separate written terms.
          </p>
          <BulletList
            items={[
              "We may change coin earning rates, balances, or redemption rules at any time",
              "Coins obtained through fraud or abuse may be revoked",
              "Coins are non-transferable between users unless a feature explicitly allows it",
            ]}
          />
        </Section>

        <Section id="third-party" title="6. Third-party services & links">
          <p>
            The Service may link to external websites, employer listings, event hosts, certification partners, or Google
            Sign-In. We are not responsible for third-party content, privacy practices, or transactions. Your use of
            third-party services is subject to their own terms.
          </p>
        </Section>

        <Section id="disclaimers" title="7. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED <strong className="text-foreground">“AS IS” AND “AS AVAILABLE”</strong> WITHOUT
            WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            Syncpedia does not guarantee job placements, internship offers, quiz outcomes, event attendance, or accuracy
            of user-generated posts. Educational and career content is for general information only and is not
            professional advice.
          </p>
        </Section>

        <Section id="liability" title="8. Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SYNCPEDIA AND ITS DIRECTORS, EMPLOYEES, AND AFFILIATES
            WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
            PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
          </p>
          <p>
            Our total liability for any claim relating to the Service shall not exceed the greater of (a) the amount you
            paid us in the twelve months before the claim, or (b) <strong className="text-foreground">INR 5,000</strong>.
          </p>
        </Section>

        <Section id="indemnity" title="9. Indemnification">
          <p>
            You agree to indemnify and hold harmless Syncpedia from claims, damages, and expenses (including reasonable
            legal fees) arising from your content, your violation of these Terms, or your violation of any law or
            third-party rights.
          </p>
        </Section>

        <Section id="termination" title="10. Suspension & termination">
          <p>
            You may stop using the Service at any time. We may suspend or terminate your access if you breach these
            Terms, if required by law, or if we discontinue the Service. Sections that by nature should survive
            (disclaimers, liability limits, indemnity, governing law) will survive termination.
          </p>
        </Section>

        <Section id="law" title="11. Governing law & disputes">
          <p>
            These Terms are governed by the laws of <strong className="text-foreground">India</strong>, without regard to
            conflict-of-law principles. Courts in <strong className="text-foreground">Hyderabad, Telangana</strong> shall
            have exclusive jurisdiction, subject to any mandatory consumer protection rights you may have under applicable
            law.
          </p>
          <p>
            Before filing a claim, you agree to contact us at {LEGAL_EMAIL} and attempt to resolve the dispute informally
            within 30 days.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to these Terms">
          <p>
            We may update these Terms from time to time. We will post the revised version at{" "}
            <a href={`${APP_SITE_URL}/terms`} className="text-forest underline">
              {APP_SITE_URL}/terms
            </a>{" "}
            and update the “Last updated” date. Material changes may be communicated in-app or by email. Continued use
            after changes means you accept the updated Terms.
          </p>
        </Section>

        <Section id="contact" title="13. Contact">
          <p>For questions about these Terms:</p>
          <BulletList
            items={[
              `Legal: ${LEGAL_EMAIL}`,
              `Support: ${SUPPORT_EMAIL}`,
              `Web: ${APP_SITE_URL}`,
            ]}
          />
          <p>Syncpedia Technologies Pvt Ltd · Hyderabad, Telangana, India</p>
        </Section>

        <div className="flex flex-wrap gap-4 border-t border-hairline pt-4 text-[13px]">
          <Link to="/" className="text-forest underline">
            ← Home
          </Link>
          <Link to="/privacy" className="text-forest underline">
            Privacy Policy
          </Link>
          <Link to="/settings" className="text-forest underline">
            Settings
          </Link>
        </div>
      </article>
    </MobileShell>
  );
}
