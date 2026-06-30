import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy",
      description: "How Syncpedia collects, uses, and protects your information.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MobileShell>
      <MobileHeader title="Privacy Policy" subtitle="Last updated June 2026" />
      <article className="space-y-5 px-5 pb-10 text-[14px] leading-relaxed text-foreground">
        <p className="text-ink-muted">
          Syncpedia (“we”, “us”) operates the community app at{" "}
          <a href="https://app.syncpedia.in" className="text-forest underline">
            app.syncpedia.in
          </a>
          . This policy explains what we collect and how we use it.
        </p>

        <section>
          <h2 className="font-medium text-foreground">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
            <li>Account details you provide: name, email, mobile number, college or company.</li>
            <li>Profile and community activity: posts, votes, follows, and messages.</li>
            <li>Device identifiers stored locally to keep you signed in on this device.</li>
            <li>Technical logs: IP address, browser type, and error diagnostics.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-foreground">How we use information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
            <li>Provide signup, login, communities, events, gigs, courses, and coin rewards.</li>
            <li>Prevent abuse, enforce rate limits, and secure admin operations.</li>
            <li>Send optional push notifications you subscribe to.</li>
            <li>Improve the product with aggregated, non-identifying analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-foreground">Sharing</h2>
          <p className="mt-2 text-ink-muted">
            We do not sell your personal data. We use service providers (hosting, database,
            push delivery) under contracts that limit use to operating Syncpedia. We may disclose
            information if required by law.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">Retention &amp; security</h2>
          <p className="mt-2 text-ink-muted">
            Data is stored on secured servers. You may request deletion of your account by
            contacting us. We retain logs only as long as needed for security and legal compliance.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">Children</h2>
          <p className="mt-2 text-ink-muted">
            Syncpedia is intended for students and professionals aged 13 and older. If you believe
            a child has provided personal data without consent, contact us to remove it.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">Contact</h2>
          <p className="mt-2 text-ink-muted">
            Questions about this policy:{" "}
            <a href="mailto:privacy@syncpedia.in" className="text-forest underline">
              privacy@syncpedia.in
            </a>
          </p>
        </section>

        <p className="pt-2">
          <Link to="/profile" className="text-[13px] text-forest underline">
            ← Back to profile
          </Link>
        </p>
      </article>
    </MobileShell>
  );
}
