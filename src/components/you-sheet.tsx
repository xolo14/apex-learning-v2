import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Check, X, ArrowUpRight } from "lucide-react";
import {
  BookmarkIcon,
  TrophyIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  WalletIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { IdentityAvatar, useIdentity } from "@/lib/identity";
import { listMyQuestions } from "@/lib/questions.functions";
import { useSavedIds } from "@/lib/saved";

export function YouTrigger({ className = "" }: { className?: string }) {
  const identity = useIdentity();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open your profile"
          className={"rounded-full ring-1 ring-hairline active:scale-95 transition " + className}
        >
          <IdentityAvatar color={identity.color} icon={identity.icon} className="h-10 w-10" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88%] max-w-[400px] overflow-y-auto border-r border-hairline p-0"
      >
        <YouPanel onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function YouPanel({ onClose }: { onClose: () => void }) {
  const identity = useIdentity();
  const [profileName, setProfileName] = useState("You");
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.name) setProfileName(p.name);
        if (typeof p?.bio === "string") setBio(p.bio);
      }
    } catch {}
  }, []);

  function startEdit() {
    setNameDraft(profileName);
    setBioDraft(bio);
    setEditing(true);
  }
  function save() {
    const nextName = nameDraft.trim().slice(0, 40) || "You";
    const nextBio = bioDraft.trim().slice(0, 160);
    setProfileName(nextName);
    setBio(nextBio);
    setEditing(false);
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      const p = raw ? JSON.parse(raw) : {};
      localStorage.setItem("syncpedia_profile", JSON.stringify({ ...p, name: nextName, bio: nextBio }));
    } catch {}
  }

  const listMine = useServerFn(listMyQuestions);
  const uniqueId = identity.uniqueId ?? "";
  const myPosts = useQuery({
    queryKey: ["my-posts", uniqueId],
    queryFn: () => listMine({ data: { uniqueId } }),
    enabled: !!uniqueId,
  });
  const savedIds = useSavedIds();

  const stats = [
    { label: "Posts Uploaded", value: myPosts.data?.length ?? 0, icon: DocumentTextIcon, tint: "text-forest" },
    { label: "Events Attended", value: 0, icon: CalendarDaysIcon, tint: "text-orange" },
    { label: "Internships Applied", value: 0, icon: BriefcaseIcon, tint: "text-foreground" },
    { label: "Earnings", value: 0, icon: WalletIcon, tint: "text-forest" },
    { label: "Coins Earned", value: 1240, icon: null as never, tint: "text-orange", coin: true },
    { label: "Saved", value: savedIds.length, icon: BookmarkIcon, tint: "text-foreground" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="flex items-start gap-3">
          <IdentityAvatar color={identity.color} icon={identity.icon} className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value.slice(0, 40))}
                autoFocus
                className="w-full rounded-lg border border-hairline bg-surface px-2 py-1 text-[16px] font-semibold text-foreground outline-none"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[17px] font-semibold tracking-tight text-foreground">
                  {profileName}
                </span>
                <TrophyIcon className="h-4 w-4 shrink-0 text-forest" />
              </div>
            )}
            <div className="mt-0.5 font-mono text-[11px] tracking-[0.14em] text-ink-muted">
              {identity.uniqueId ?? "SP-XXXXXX"}
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditing(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-surface text-ink-muted active:scale-95"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                onClick={save}
                className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background active:scale-95"
                aria-label="Save"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface text-foreground active:scale-95"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>

        <div className="mt-3">
          {editing ? (
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value.slice(0, 160))}
              placeholder="Write a short bio (max 160)"
              rows={3}
              className="w-full resize-none rounded-xl border border-hairline bg-surface p-2 text-[13px] leading-snug text-foreground outline-none placeholder:text-ink-muted"
            />
          ) : (
            <p className={"text-[13px] leading-snug " + (bio ? "text-foreground" : "text-ink-muted")}>
              {bio || "Add a short bio…"}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-hairline px-5 py-4">
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map(({ label, value, icon: Icon, tint }) => (
            <div
              key={label}
              className="rounded-2xl border border-hairline bg-surface/60 p-3"
            >
              <div className="flex items-center gap-1.5">
                <Icon className={"h-3.5 w-3.5 " + tint} />
                <span className="truncate text-[10.5px] uppercase tracking-[0.12em] text-ink-muted">
                  {label}
                </span>
              </div>
              <div className="mt-1.5 font-serif text-[22px] leading-none tracking-tight text-foreground">
                {value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-hairline px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center justify-between rounded-2xl bg-surface px-3 py-3 text-[14px] font-medium text-foreground active:scale-[0.99]"
          >
            <span>Open full profile</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link
            to="/coins"
            onClick={onClose}
            className="flex items-center justify-between rounded-2xl bg-surface px-3 py-3 text-[14px] font-medium text-foreground active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-2">
              <TrophyIcon className="h-4 w-4 text-orange" />
              View coins
            </span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center justify-between rounded-2xl bg-surface px-3 py-3 text-[14px] font-medium text-foreground active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Settings
            </span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  );
}
