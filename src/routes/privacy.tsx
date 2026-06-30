import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { pageHead } from "@/lib/seo";
import { APP_SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy",
      description:
        "How Syncpedia collects, uses, stores, and protects your information across our website and mobile apps.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

const LAST_UPDATED = "30 June 2026";
const PRIVACY_EMAIL = "privacy@syncpedia.in";

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

function PrivacyPage() {
  return (
    <MobileShell>
      <MobileHeader title="Privacy Policy" subtitle={`Last updated ${LAST_UPDATED}`} />
      <article className="space-y-6 px-5 pb-12 text-[14px] leading-relaxed text-foreground">
        <p className="text-ink-muted">
          This Privacy Policy describes how <strong className="text-foreground">Syncpedia Technologies Pvt Ltd</strong>{" "}
          (“Syncpedia”, “we”, “us”, “our”) collects, uses, shares, and protects information when you use:
        </p>
        <BulletList
          items={[
            `Our website and web app at ${APP_SITE_URL}`,
            "Our Android and iOS mobile applications (when available)",
            "Related community features including events, internships, gigs, quizzes, certifications, and Syncpedia coins",
          ]}
        />
        <p className="text-ink-muted">
          By using Syncpedia, you agree to this policy. If you do not agree, please do not use our services.
        </p>

        <nav className="rounded-xl border border-hairline bg-surface/60 p-4 text-[13px]">
          <p className="font-medium text-foreground">Contents</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-forest">
            <li><a href="#controller" className="underline">Who we are</a></li>
            <li><a href="#collect" className="underline">Information we collect</a></li>
            <li><a href="#use" className="underline">How we use information</a></li>
            <li><a href="#device" className="underline">Data on your device</a></li>
            <li><a href="#sharing" className="underline">Sharing & service providers</a></li>
            <li><a href="#retention" className="underline">Retention</a></li>
            <li><a href="#security" className="underline">Security</a></li>
            <li><a href="#rights" className="underline">Your choices & rights</a></li>
            <li><a href="#children" className="underline">Children</a></li>
            <li><a href="#international" className="underline">International users</a></li>
            <li><a href="#changes" className="underline">Policy changes</a></li>
            <li><a href="#contact" className="underline">Contact us</a></li>
          </ol>
        </nav>

        <Section id="controller" title="1. Who we are">
          <p>
            <strong className="text-foreground">Data controller:</strong> Syncpedia Technologies Pvt Ltd
          </p>
          <p>
            <strong className="text-foreground">Product:</strong> Syncpedia — a community platform for students and
            professionals to learn, earn coins, discover opportunities, and connect.
          </p>
          <p>
            <strong className="text-foreground">Website:</strong>{" "}
            <a href={APP_SITE_URL} className="text-forest underline">
              {APP_SITE_URL}
            </a>
          </p>
        </Section>

        <Section id="collect" title="2. Information we collect">
          <p>We collect information in three ways: information you provide, information generated through your use of Syncpedia, and limited technical information from your device or browser.</p>

          <p className="font-medium text-foreground">2.1 Account and profile information</p>
          <BulletList
            items={[
              "Full name",
              "Email address (Gmail or other email you provide)",
              "Mobile phone number",
              "Role (student or professional)",
              "College, branch, year, or department (students)",
              "Company and department (professionals)",
              "Avatar preferences (icon and colour you choose)",
              "Unique public profile identifier",
            ]}
          />

          <p className="font-medium text-foreground">2.2 Community and activity information</p>
          <BulletList
            items={[
              "Posts, questions, comments, votes, and community participation",
              "Follows, follow requests, and blocked accounts you manage in settings",
              "Direct messages you send and receive within the app",
              "Event, gig, internship, and course enrollments or applications",
              "Quiz participation and results where applicable",
              "Syncpedia coin balance and reward history",
              "Saved items and in-app preferences (such as language choice)",
            ]}
          />

          <p className="font-medium text-foreground">2.3 Application and lead information</p>
          <p>When you apply for internships or similar opportunities, we may collect:</p>
          <BulletList
            items={[
              "Applicant name, email, phone, college, year, branch",
              "LinkedIn profile URL (if you provide it)",
              "Cover message or notes",
              "Resume or CV file you upload (PDF or Word, stored for review by administrators)",
            ]}
          />

          <p className="font-medium text-foreground">2.4 Payment and enrollment records</p>
          <p>
            For paid certifications or events, we store enrollment status, price at time of enrollment, and whether
            coins were credited. Payment processing may be handled through methods we specify in the app; we do not
            store full payment card numbers on our servers unless a specific payment integration explicitly requires it
            and is disclosed at checkout.
          </p>

          <p className="font-medium text-foreground">2.5 Device and technical information</p>
          <BulletList
            items={[
              "Device key stored locally to keep you signed in on your device",
              "IP address, browser or WebView type, operating system, and app version",
              "Server and error logs used for security, abuse prevention, and troubleshooting",
              "Push notification subscription endpoint and cryptographic keys (only if you enable notifications)",
            ]}
          />

          <p className="font-medium text-foreground">2.6 Information we do not intentionally collect</p>
          <BulletList
            items={[
              "Precise GPS location (we do not request location permission in the mobile app)",
              "Contacts from your phone",
              "Microphone or camera recordings through Syncpedia features",
              "Information from third-party social networks unless you choose to share a link (e.g. LinkedIn URL)",
            ]}
          />
        </Section>

        <Section id="use" title="3. How we use information">
          <p>We use your information to:</p>
          <BulletList
            items={[
              "Create and manage your account, authenticate you, and keep you signed in",
              "Operate communities, feeds, events, gigs, internships, quizzes, and certification classrooms",
              "Process enrollments, applications, coin rewards, and admin review workflows",
              "Send optional push notifications you subscribe to (e.g. updates and announcements)",
              "Moderate content, prevent fraud and abuse, enforce rate limits, and protect platform security",
              "Provide customer support and respond to your requests",
              "Improve Syncpedia through aggregated or de-identified usage insights",
              "Comply with legal obligations and enforce our terms",
            ]}
          />
          <p>
            <strong className="text-foreground">Legal bases (where applicable):</strong> We process personal data to
            perform our contract with you (providing the service), with your consent (e.g. push notifications), for our
            legitimate interests (security, product improvement), and to meet legal requirements.
          </p>
          <p>
            <strong className="text-foreground">Marketing:</strong> We do not sell your personal information. We do not
            use your data for third-party advertising profiles.
          </p>
        </Section>

        <Section id="device" title="4. Data stored on your device">
          <p>
            Syncpedia stores some information locally in your browser or mobile app using local storage, including your
            profile summary, device key, notification preference flag, blocked-user list, saved items, and language
            setting. This helps the app load faster and remain signed in. You can clear this data by signing out or
            clearing app or browser storage, though you may need to sign in again.
          </p>
          <p>
            Our Android and iOS apps primarily load content from{" "}
            <a href={APP_SITE_URL} className="text-forest underline">
              {APP_SITE_URL}
            </a>
            . Data handling described in this policy applies equally to use through the mobile apps and the website.
          </p>
        </Section>

        <Section id="sharing" title="5. Sharing and service providers">
          <p>
            <strong className="text-foreground">We do not sell your personal data.</strong> We share information only
            as described below:
          </p>

          <p className="font-medium text-foreground">5.1 Service providers</p>
          <p>We use trusted providers to run Syncpedia, including:</p>
          <BulletList
            items={[
              "Cloud hosting and server infrastructure (e.g. VPS / web servers)",
              "Managed database services (e.g. Neon PostgreSQL) for account and app data",
              "Web push infrastructure for optional notifications",
              "Font and content delivery networks (e.g. Google Fonts) that may receive basic technical data such as IP address",
            ]}
          />
          <p>
            These providers process data only on our instructions and for operating Syncpedia, subject to appropriate
            safeguards.
          </p>

          <p className="font-medium text-foreground">5.2 Other users and public content</p>
          <p>
            Information you post publicly in communities (posts, questions, profile name, unique ID, avatar) may be
            visible to other Syncpedia users. Direct messages are visible to participants in the conversation.
            Administrators may access application leads, enrollment records, and moderation data as needed to operate the
            platform.
          </p>

          <p className="font-medium text-foreground">5.3 External media and links</p>
          <p>
            Certification videos, images, maps, or external links may be hosted by third parties (for example video
            hosting providers). When you play a video or open an external link, that third party’s privacy policy
            applies to data they collect.
          </p>

          <p className="font-medium text-foreground">5.4 Legal requirements</p>
          <p>
            We may disclose information if required by law, court order, or government request, or when we believe
            disclosure is necessary to protect rights, safety, and security.
          </p>

          <p className="font-medium text-foreground">5.5 Business transfers</p>
          <p>
            If Syncpedia is involved in a merger, acquisition, or sale of assets, your information may be transferred
            as part of that transaction, subject to continued protection consistent with this policy.
          </p>
        </Section>

        <Section id="retention" title="6. How long we keep information">
          <BulletList
            items={[
              "Account and profile data: kept while your account is active and for a reasonable period after deletion for backup, dispute, or legal purposes",
              "Community posts and messages: retained according to community needs and moderation requirements unless you request deletion where applicable",
              "Internship applications and resumes: retained for recruitment and admin review, then deleted or archived per our internal retention schedule",
              "Coin ledger and enrollment records: retained for accounting, fraud prevention, and service history",
              "Server logs: typically retained for a limited period for security and diagnostics",
              "Push subscription data: deleted when you disable notifications or delete your account",
            ]}
          />
          <p>
            You may request account deletion by contacting us. We will delete or anonymise personal data unless we must
            retain it for legal, security, or legitimate business reasons.
          </p>
        </Section>

        <Section id="security" title="7. Security">
          <p>
            We use administrative, technical, and organisational measures to protect your information, including HTTPS
            encryption in transit, access controls on servers and databases, and rate limiting on authentication
            endpoints. No method of transmission or storage is 100% secure; we cannot guarantee absolute security.
          </p>
          <p>
            Please use a strong device passcode, keep your email and phone secure, and sign out on shared devices.
          </p>
        </Section>

        <Section id="rights" title="8. Your choices and rights">
          <p>Depending on your location, you may have the right to:</p>
          <BulletList
            items={[
              "Access the personal information we hold about you",
              "Correct inaccurate profile information through settings or by contacting us",
              "Request deletion of your account and associated personal data",
              "Withdraw consent for optional features such as push notifications",
              "Object to or restrict certain processing where applicable law provides these rights",
              "Lodge a complaint with a data protection authority in your country",
            ]}
          />
          <p>
            <strong className="text-foreground">In-app controls:</strong> You can update your avatar in Settings, manage
            blocked users, enable or disable push notifications, and sign out at any time.
          </p>
          <p>
            To exercise your rights, email{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-forest underline">
              {PRIVACY_EMAIL}
            </a>{" "}
            from the email address linked to your account. We may need to verify your identity before processing requests.
          </p>
        </Section>

        <Section id="children" title="9. Children’s privacy">
          <p>
            Syncpedia is intended for users aged <strong className="text-foreground">13 and older</strong> (students and
            professionals). We do not knowingly collect personal information from children under 13 without verifiable
            parental consent. If you believe a child under 13 has provided personal data, contact us at{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-forest underline">
              {PRIVACY_EMAIL}
            </a>{" "}
            and we will take steps to delete it.
          </p>
        </Section>

        <Section id="international" title="10. International users">
          <p>
            Syncpedia is operated from India. If you access Syncpedia from outside India, your information may be
            transferred to and processed in India and in countries where our service providers operate. We take steps
            to ensure appropriate safeguards for such transfers consistent with applicable law, including India’s Digital
            Personal Data Protection Act, 2023 where it applies.
          </p>
        </Section>

        <Section id="play-store" title="11. Google Play and app stores">
          <p>
            When you download Syncpedia from Google Play or another app store, the store operator may collect information
            about your device, purchases, and downloads under their own privacy policies. Syncpedia’s in-app data
            practices are described in this policy.
          </p>
          <p>
            For Google Play’s Data safety section, we declare collection of account information, user-generated content,
            app activity, device identifiers, and optional push notification tokens, used for app functionality,
            account management, and optional notifications — not for selling data or third-party advertising.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will post the revised policy at{" "}
            <a href={`${APP_SITE_URL}/privacy`} className="text-forest underline">
              {APP_SITE_URL}/privacy
            </a>{" "}
            and update the “Last updated” date. Material changes may be communicated through the app or by email where
            appropriate. Continued use after changes means you accept the updated policy.
          </p>
        </Section>

        <Section id="contact" title="13. Contact us">
          <p>For privacy questions, data requests, or complaints:</p>
          <BulletList
            items={[
              `Privacy: ${PRIVACY_EMAIL}`,
              `Support: ${SUPPORT_EMAIL}`,
              `Web: ${APP_SITE_URL}`,
            ]}
          />
          <p>
            Syncpedia Technologies Pvt Ltd · Hyderabad, Telangana, India
          </p>
        </Section>

        <div className="flex flex-wrap gap-4 border-t border-hairline pt-4 text-[13px]">
          <Link to="/" className="text-forest underline">
            ← Home
          </Link>
          <Link to="/terms" className="text-forest underline">
            Terms of Service
          </Link>
          <Link to="/profile" className="text-forest underline">
            Profile
          </Link>
          <Link to="/settings" className="text-forest underline">
            Settings
          </Link>
        </div>
      </article>
    </MobileShell>
  );
}
