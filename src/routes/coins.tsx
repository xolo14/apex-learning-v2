import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Sparkles, Wallet, Banknote, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { CoinsCard } from "@/components/coins-card";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { useEarningsEnabled } from "@/lib/use-feature-flags";

export const Route = createFileRoute("/coins")({
  head: () => ({ meta: [{ title: "Coins — Syncpedia" }] }),
  component: CoinsPage,
});

const ACTION_LABELS: Record<string, string> = {
  signup: "Welcome bonus",
  gigCompleted: "Gig completed",
  quizCompleted: "Quiz completed",
  quizPerfectBonus: "Perfect score bonus",
  eventAttended: "Event attended",
  eventHosted: "Event hosted",
  coursePaidEnrolled: "Paid course enrolled",
  courseFreeEnrolled: "Free course enrolled",
  courseCompleted: "Course completed",
  internshipApplied: "Internship applied",
};

function timeAgoShort(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function CoinsPage() {
  const earningsEnabled = useEarningsEnabled();
  if (!earningsEnabled) return <Navigate to="/" />;
  const [name, setName] = useState("You");
  const { balance, entries } = useCoinBalance();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [submitted, setSubmitted] = useState<null | { coins: number; rupees: number; upi: string }>(null);

  const MIN_WITHDRAW_COINS = 500;
  const coinsToWithdraw = Math.max(0, Math.floor(Number(amount) || 0));
  const rupees = coinsToWithdraw / 10;
  const canSubmit =
    coinsToWithdraw >= MIN_WITHDRAW_COINS &&
    coinsToWithdraw <= balance &&
    /^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upi.trim());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.name) setName(p.name);
      }
    } catch {}
  }, []);

  function handleWithdraw() {
    if (!canSubmit) return;
    setSubmitted({ coins: coinsToWithdraw, rupees, upi: upi.trim() });
    setAmount("");
  }

  return (
    <MobileShell>
      <MobileHeader
        title="Coins"
        subtitle="Earn by learning, spend on boosts"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
      />

      <div className="px-5 pt-5">
        <CoinsCard name={name} balance={balance} />

        <button
          onClick={() => {
            setShowWithdraw(true);
            setSubmitted(null);
          }}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-hairline bg-background px-4 py-3.5 text-left active:bg-surface"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-forest/10 text-forest">
              <Banknote strokeWidth={1.75} className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[14px] font-semibold tracking-tight text-foreground">
                Withdraw to UPI
              </div>
              <div className="text-[11px] text-ink-muted">
                10 coins = ₹1 · min {MIN_WITHDRAW_COINS} coins
              </div>
            </div>
          </div>
          <span className="text-[12px] font-medium text-ink-muted">Cash out →</span>
        </button>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to="/quizzes"
            search={{ tab: "quizzes" }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-background py-3 text-[13px] font-medium text-foreground active:bg-surface"
          >
            <Sparkles strokeWidth={1.75} className="h-4 w-4" />
            Earn from quizzes
          </Link>
          <Link
            to="/quizzes"
            search={{ tab: "gigs" }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-[13px] font-medium text-background active:opacity-90"
          >
            <Wallet strokeWidth={1.75} className="h-4 w-4" />
            Browse earnings
          </Link>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Recent activity
          </span>
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <ul className="mt-2">
          {entries.length === 0 ? (
            <li className="py-6 text-center text-[12.5px] text-ink-muted">
              No coin activity yet. Your welcome bonus and any rewards will appear here.
            </li>
          ) : (
            entries.map((a) => (
              <li
                key={`${a.action_key}-${a.created_at}`}
                className="flex items-center justify-between gap-3 border-b border-hairline py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest/10 text-forest">
                    <ArrowDownLeft strokeWidth={1.75} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium tracking-tight text-foreground">
                      {ACTION_LABELS[a.action_key] ?? a.action_key}
                    </div>
                    <div className="text-[11px] text-ink-muted">{timeAgoShort(a.created_at)} ago</div>
                  </div>
                </div>
                <div className="shrink-0 text-[14px] font-semibold tabular-nums text-forest">
                  +{a.amount}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {showWithdraw && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setShowWithdraw(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-background p-5 pb-7 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[16px] font-semibold tracking-tight">Withdraw coins</div>
              <button
                onClick={() => setShowWithdraw(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-surface"
              >
                <X strokeWidth={1.75} className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-hairline bg-surface p-4">
                <div className="text-[14px] font-semibold text-forest">
                  Withdrawal requested ✓
                </div>
                <div className="mt-1 text-[12.5px] text-ink-muted">
                  ₹{submitted.rupees.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  ({submitted.coins} coins) to{" "}
                  <span className="font-medium text-foreground">{submitted.upi}</span>.
                  Funds arrive within 24 hours.
                </div>
                <button
                  onClick={() => setShowWithdraw(false)}
                  className="mt-4 w-full rounded-xl bg-foreground py-3 text-[13.5px] font-medium text-background"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-surface p-4">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                    <span>Balance</span>
                    <span>{balance.toLocaleString()} coins</span>
                  </div>

                  <label className="mt-3 block text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                    Coins to withdraw
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min ${MIN_WITHDRAW_COINS}`}
                    className="mt-1 w-full rounded-xl border border-hairline bg-background px-3 py-2.5 text-[15px] font-medium tabular-nums focus:outline-none"
                  />
                  <div className="mt-1.5 flex items-center justify-between text-[12px] text-ink-muted">
                    <span>You receive</span>
                    <span className="font-semibold text-foreground">
                      ₹{rupees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <label className="mt-4 block text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    placeholder="yourname@upi"
                    className="mt-1 w-full rounded-xl border border-hairline bg-background px-3 py-2.5 text-[14px] focus:outline-none"
                  />
                </div>

                {coinsToWithdraw > balance && (
                  <div className="mt-2 text-[12px] text-orange">
                    Amount exceeds your balance.
                  </div>
                )}

                <button
                  disabled={!canSubmit}
                  onClick={handleWithdraw}
                  className="mt-4 w-full rounded-xl bg-foreground py-3 text-[13.5px] font-medium text-background disabled:opacity-40"
                >
                  Withdraw ₹
                  {rupees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </button>
                <div className="mt-2 text-center text-[11px] text-ink-muted">
                  Conversion rate: 10 coins = ₹1
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </MobileShell>
  );
}
