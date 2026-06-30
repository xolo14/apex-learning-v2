import { Calendar, MapPin, ExternalLink } from "lucide-react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import type { ReactNode } from "react";

export type EventDetailData = {
  title: string;
  description?: string;
  image_url?: string;
  starts_at?: string;
  location?: string;
  hosted_by?: string;
  map_url?: string;
  price?: number;
  coins?: number;
};

export function eventSubtitle(startsAt?: string, location?: string): string {
  const date = startsAt?.split("·")[0]?.trim() || startsAt?.trim() || "";
  const place = location?.split(",")[0]?.trim() || location?.trim() || "";
  if (date && place) return `${date} | ${place}`;
  return date || place;
}

function mapsHref(location: string, mapUrl?: string): string {
  if (mapUrl?.trim()) return mapUrl.trim();
  if (!location.trim()) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

type EventDetailViewProps = EventDetailData & {
  footer?: ReactNode;
  className?: string;
  compact?: boolean;
  /** Hide title block when the page header already shows it */
  showTitle?: boolean;
  fixedFooter?: boolean;
};

export function EventDetailView({
  title,
  description,
  image_url,
  starts_at,
  location,
  hosted_by,
  map_url,
  price = 0,
  coins = 0,
  footer,
  className = "",
  compact = false,
  showTitle = true,
  fixedFooter = false,
}: EventDetailViewProps) {
  const isFree = price <= 0;
  const subtitle = eventSubtitle(starts_at, location);
  const host = hosted_by?.trim() || "Syncpedia";

  return (
    <div className={"flex flex-col bg-background " + className}>
      {showTitle ? (
        <div className={compact ? "px-3 pt-3" : "px-4 pt-4"}>
          <h1
            className={
              "font-semibold leading-snug tracking-tight text-foreground " +
              (compact ? "text-[15px]" : "text-[17px]")
            }
          >
            {title || "Event title"}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
      ) : null}

      <div className={compact ? "mt-3 px-3" : "mt-4 px-4"}>
        {image_url ? (
          <img
            src={image_url}
            alt=""
            className="w-full rounded-2xl object-cover shadow-sm"
            style={{ maxHeight: compact ? 140 : 200 }}
          />
        ) : (
          <div
            className="grid w-full place-items-center rounded-2xl bg-forest/15 text-[12px] text-ink-muted"
            style={{ height: compact ? 100 : 140 }}
          >
            Banner image
          </div>
        )}
      </div>

      <div className={compact ? "mt-3 space-y-2 px-3" : "mt-4 space-y-2.5 px-4"}>
        {starts_at ? (
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface/60 px-3.5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background">
              <Calendar strokeWidth={1.75} className="h-4 w-4 text-forest" />
            </span>
            <span className="text-[13px] text-foreground">{starts_at}</span>
          </div>
        ) : null}

        {location ? (
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface/60 px-3.5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background">
              <MapPin strokeWidth={1.75} className="h-4 w-4 text-forest" />
            </span>
            <span className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">{location}</span>
            <a
              href={mapsHref(location, map_url)}
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest"
              aria-label="Open map"
            >
              <ExternalLink strokeWidth={1.75} className="h-4 w-4" />
            </a>
          </div>
        ) : null}
      </div>

      <div className={compact ? "mt-4 px-3" : "mt-5 px-4"}>
        <p className="text-[12px] text-ink-muted">Hosted by</p>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-hairline bg-surface/40 px-3.5 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-[14px] font-semibold text-white">
            {host.charAt(0).toUpperCase()}
          </span>
          <span className="text-[14px] font-medium text-foreground">{host}</span>
        </div>
      </div>

      <div className={compact ? "mt-4 px-3 pb-3" : "mt-5 px-4 pb-4"}>
        <h2 className="text-[14px] font-semibold text-foreground">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
          {description?.trim() || "Add your event story, lineup, schedule, and what attendees get."}
        </p>
      </div>

      {footer !== undefined ? (
        <div
          className={
            (fixedFooter ? "fixed inset-x-0 bottom-0 z-20 max-w-lg mx-auto " : "") +
            "border-t border-hairline bg-background/95 backdrop-blur"
          }
        >
          {footer}
        </div>
      ) : (
        <div className="mt-auto border-t border-hairline bg-background px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-ink-muted">Ticket</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground">
                {isFree ? "Free" : `₹ ${price.toLocaleString("en-IN")}`}
                {!isFree ? <span className="text-[12px] font-normal text-ink-muted"> onwards</span> : null}
              </p>
              {coins > 0 ? (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-orange">
                  <img src={goldCoin} alt="" className="h-3 w-3 object-contain" />
                  +{coins} coins
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-forest px-5 py-2.5 text-[13px] font-semibold text-white">
              {isFree ? "RSVP free" : "Buy tickets"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
