import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Check, Download, Mail, Trash2, X } from "lucide-react";
import {
  deleteInternship,
  listAdminCourseEnrollments,
  listAdminEventRegistrations,
  listInternships,
  updateInternshipStatus,
  type AdminCourseEnrollmentLead,
  type AdminEventRegistrationLead,
  type DbInternship,
} from "@/lib/communities.functions";
import {
  downloadMultiSheetXlsx,
  downloadRowsAsCsv,
  downloadRowsAsXlsx,
  exportStamp,
} from "@/lib/admin-export";

export const Route = createFileRoute("/admin/leads")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab:
      s.tab === "internships" || s.tab === "courses" || s.tab === "events"
        ? (s.tab as "internships" | "courses" | "events")
        : ("all" as const),
  }),
  component: AdminLeads,
});

const TABS = [
  { id: "all" as const, label: "All leads" },
  { id: "internships" as const, label: "Internships" },
  { id: "courses" as const, label: "Courses" },
  { id: "events" as const, label: "Events" },
];

const INT_FILTERS = ["all", "pending", "accepted", "rejected"] as const;
type IntFilter = (typeof INT_FILTERS)[number];

function AdminLeads() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const listInt = useServerFn(listInternships);
  const listCourses = useServerFn(listAdminCourseEnrollments);
  const listEvents = useServerFn(listAdminEventRegistrations);
  const setStatus = useServerFn(updateInternshipStatus);
  const del = useServerFn(deleteInternship);

  const intQ = useQuery({
    queryKey: ["admin", "leads", "internships"],
    queryFn: () => listInt(),
    refetchInterval: 10_000,
  });
  const courseQ = useQuery({
    queryKey: ["admin", "leads", "courses"],
    queryFn: () => listCourses(),
    refetchInterval: 10_000,
  });
  const eventQ = useQuery({
    queryKey: ["admin", "leads", "events"],
    queryFn: () => listEvents(),
    refetchInterval: 10_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "leads"] });
    qc.invalidateQueries({ queryKey: ["admin", "internships"] });
  };
  const mStatus = useMutation({ mutationFn: setStatus, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const internships = intQ.data ?? [];
  const courses = courseQ.data ?? [];
  const events = eventQ.data ?? [];

  const [intFilter, setIntFilter] = useState<IntFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredInternships = useMemo(
    () => internships.filter((r) => intFilter === "all" || r.status === intFilter),
    [internships, intFilter],
  );

  const totalCount = internships.length + courses.length + events.length;
  const visibleCount =
    tab === "internships"
      ? filteredInternships.length
      : tab === "courses"
        ? courses.length
        : tab === "events"
          ? events.length
          : totalCount;

  const stamp = exportStamp();

  function internshipExportRows(rows: DbInternship[]) {
    return rows.map((r) => ({
      Type: "Internship",
      "Applied at": new Date(r.created_at).toISOString(),
      Status: r.status,
      Name: r.applicant_name,
      Email: r.email,
      Phone: r.phone,
      Role: r.role,
      College: r.college,
      Year: r.year,
      Branch: r.branch,
      LinkedIn: r.linkedin,
      Community: r.community_slug ? `c/${r.community_slug}` : "",
      "Posting ID": r.posting_id ?? "",
      "User ID": r.user_unique_id ?? "",
      "Cover letter": r.message,
      "Resume file": r.resume_name || (r.resume_data ? "attached" : ""),
    }));
  }

  function courseExportRows(rows: AdminCourseEnrollmentLead[]) {
    return rows.map((r) => ({
      Type: "Course",
      "Applied at": new Date(r.created_at).toISOString(),
      Status: r.status,
      Name: r.user_name,
      Email: r.email,
      Mobile: r.mobile,
      College: r.college,
      Year: r.year,
      Branch: r.branch,
      Course: r.course_title,
      "Course ID": r.course_id,
      Community: r.community_slug ? `c/${r.community_slug}` : "",
      "User ID": r.user_unique_id,
      "Price (₹)": r.price_snapshot,
      "Coins credited": r.coins_credited,
    }));
  }

  function eventExportRows(rows: AdminEventRegistrationLead[]) {
    return rows.map((r) => ({
      Type: "Event",
      "Applied at": new Date(r.created_at).toISOString(),
      Status: r.status,
      Name: r.user_name,
      Email: r.email,
      Mobile: r.mobile,
      College: r.college,
      Year: r.year,
      Branch: r.branch,
      Event: r.event_title,
      "Event ID": r.event_id,
      Community: r.community_slug ? `c/${r.community_slug}` : "",
      "User ID": r.user_unique_id,
      "Price (₹)": r.price_snapshot,
      "Coins credited": r.coins_credited,
    }));
  }

  function allExportRows() {
    return [
      ...internshipExportRows(internships),
      ...courseExportRows(courses),
      ...eventExportRows(events),
    ].sort((a, b) => String(b["Applied at"]).localeCompare(String(a["Applied at"])));
  }

  function currentExportRows(): Record<string, unknown>[] {
    if (tab === "internships") return internshipExportRows(filteredInternships);
    if (tab === "courses") return courseExportRows(courses);
    if (tab === "events") return eventExportRows(events);
    return allExportRows();
  }

  function downloadCurrentCsv() {
    const rows = currentExportRows();
    downloadRowsAsCsv(rows, `syncpedia-leads-${tab}-${stamp}.csv`);
  }

  function downloadCurrentXlsx() {
    const rows = currentExportRows();
    const sheet =
      tab === "internships" ? "Internships" : tab === "courses" ? "Courses" : tab === "events" ? "Events" : "All leads";
    downloadRowsAsXlsx(rows, `syncpedia-leads-${tab}-${stamp}.xlsx`, sheet);
  }

  function downloadAllSheetsXlsx() {
    downloadMultiSheetXlsx(
      [
        { name: "Internships", rows: internshipExportRows(internships) },
        { name: "Courses", rows: courseExportRows(courses) },
        { name: "Events", rows: eventExportRows(events) },
        { name: "All leads", rows: allExportRows() },
      ],
      `syncpedia-leads-all-${stamp}.xlsx`,
    );
  }

  const loading = intQ.isLoading || courseQ.isLoading || eventQ.isLoading;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Applied leads</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
            Detail page submissions
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            {totalCount} total · {internships.length} internships · {courses.length} course enrollments ·{" "}
            {events.length} event RSVPs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadCurrentCsv}
            disabled={visibleCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-[12.5px] font-medium hover:bg-surface disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={downloadCurrentXlsx}
            disabled={visibleCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-[12.5px] font-medium hover:bg-surface disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Excel (tab)
          </button>
          <button
            type="button"
            onClick={downloadAllSheetsXlsx}
            disabled={totalCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[12.5px] font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Excel (all sheets)
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate({ search: { tab: t.id === "all" ? undefined : t.id }, replace: true })}
            className={
              "rounded-full border px-3 py-1 text-[12px] " +
              (tab === t.id ? "border-foreground bg-foreground text-background" : "border-hairline")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "internships" || tab === "all" ? (
        <section className="mt-6 rounded-2xl border border-hairline">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Internship applications ({filteredInternships.length})
            </h2>
            {tab === "internships" ? (
              <div className="flex gap-2">
                {INT_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setIntFilter(f)}
                    className={
                      "rounded-full border px-2.5 py-0.5 text-[11px] capitalize " +
                      (intFilter === f ? "border-foreground bg-foreground text-background" : "border-hairline")
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            ) : null}
          </header>
          <ul className="divide-y divide-hairline">
            {filteredInternships.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">
                {loading ? "Loading…" : "No internship applications."}
              </li>
            )}
            {filteredInternships.map((r) => (
              <InternshipRow
                key={r.id}
                r={r}
                open={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                onAccept={() => mStatus.mutate({ data: { id: r.id, status: "accepted" } })}
                onReject={() => mStatus.mutate({ data: { id: r.id, status: "rejected" } })}
                onDelete={() => mDelete.mutate({ data: { id: r.id } })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "courses" || tab === "all" ? (
        <section className={"rounded-2xl border border-hairline " + (tab === "all" ? "mt-6" : "mt-6")}>
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Course enrollments ({courses.length})
            </h2>
          </header>
          <ul className="divide-y divide-hairline">
            {courses.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">
                {loading ? "Loading…" : "No course enrollments yet."}
              </li>
            )}
            {courses.map((r) => (
              <EnrollmentRow
                key={r.id}
                kind="Course"
                title={r.course_title}
                subtitle={r.community_slug ? `c/${r.community_slug}` : "Syncpedia"}
                name={r.user_name}
                email={r.email}
                phone={r.mobile}
                meta={`${r.college || "—"} · ${r.year || "—"} · ${r.branch || "—"}`}
                status={r.status}
                price={r.price_snapshot}
                createdAt={r.created_at}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "events" || tab === "all" ? (
        <section className="mt-6 rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Event RSVPs ({events.length})
            </h2>
          </header>
          <ul className="divide-y divide-hairline">
            {events.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">
                {loading ? "Loading…" : "No event registrations yet."}
              </li>
            )}
            {events.map((r) => (
              <EnrollmentRow
                key={r.id}
                kind="Event"
                title={r.event_title}
                subtitle={r.community_slug ? `c/${r.community_slug}` : "Syncpedia"}
                name={r.user_name}
                email={r.email}
                phone={r.mobile}
                meta={`${r.college || "—"} · ${r.year || "—"} · ${r.branch || "—"}`}
                status={r.status}
                price={r.price_snapshot}
                createdAt={r.created_at}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function statusBadge(status: string) {
  if (status === "accepted" || status === "confirmed") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "pending_payment") return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
}

function InternshipRow({
  r,
  open,
  onToggle,
  onAccept,
  onReject,
  onDelete,
}: {
  r: DbInternship;
  open: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-forest text-[12px] font-medium text-white">
          {r.applicant_name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium">
            {r.applicant_name} · <span className="text-ink-muted">{r.role}</span>
          </p>
          <p className="truncate text-[11px] text-ink-muted">
            {r.email}
            {r.phone ? ` · ${r.phone}` : ""}
            {r.college ? ` · ${r.college}` : ""}
            {r.community_slug ? ` · c/${r.community_slug}` : ""}
            {" · "}
            {new Date(r.created_at).toLocaleString()}
          </p>
        </div>
        <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " + statusBadge(r.status)}>
          {r.status}
        </span>
        <button type="button" onClick={onToggle} className="rounded-md border border-hairline px-2 py-1 text-[11px] hover:bg-surface">
          {open ? "Hide" : "View"}
        </button>
        <button type="button" onClick={onAccept} title="Accept" className="rounded-md border border-hairline p-1.5 hover:bg-surface">
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReject} title="Reject" className="rounded-md border border-hairline p-1.5 hover:bg-surface">
          <X className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} title="Delete" className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open ? (
        <div className="mt-3 space-y-2 rounded-lg bg-surface p-4 text-[13px]">
          <p>
            <span className="text-ink-muted">Year / Branch:</span> {r.year || "—"} · {r.branch || "—"}
          </p>
          {r.linkedin ? (
            <p>
              <span className="text-ink-muted">LinkedIn:</span>{" "}
              <a href={r.linkedin} target="_blank" rel="noreferrer" className="underline">
                {r.linkedin}
              </a>
            </p>
          ) : null}
          <p className="whitespace-pre-wrap">{r.message || "No cover letter."}</p>
          {r.resume_data ? (
            <a
              href={r.resume_data}
              download={r.resume_name || "resume.pdf"}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-medium text-background"
            >
              Download resume{r.resume_name ? `: ${r.resume_name}` : ""}
            </a>
          ) : null}
          <a href={`mailto:${r.email}`} className="mt-2 inline-flex items-center gap-1 text-[12px] underline">
            <Mail className="h-3 w-3" /> {r.email}
          </a>
        </div>
      ) : null}
    </li>
  );
}

function EnrollmentRow({
  kind,
  title,
  subtitle,
  name,
  email,
  phone,
  meta,
  status,
  price,
  createdAt,
}: {
  kind: string;
  title: string;
  subtitle: string;
  name: string;
  email: string;
  phone: string;
  meta: string;
  status: string;
  price: number;
  createdAt: string;
}) {
  const displayName = name || email || "Member";
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-forest text-[12px] font-medium text-white">
        {displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">
          {displayName} · <span className="text-ink-muted">{title}</span>
        </p>
        <p className="truncate text-[11px] text-ink-muted">
          {kind} · {subtitle}
          {email ? ` · ${email}` : ""}
          {phone ? ` · ${phone}` : ""}
          {meta ? ` · ${meta}` : ""}
          {" · "}
          {new Date(createdAt).toLocaleString()}
        </p>
      </div>
      {price > 0 ? (
        <span className="text-[11px] tabular-nums text-ink-muted">₹{price.toLocaleString("en-IN")}</span>
      ) : (
        <span className="text-[11px] text-ink-muted">Free</span>
      )}
      <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " + statusBadge(status)}>
        {status.replace("_", " ")}
      </span>
      {email ? (
        <a href={`mailto:${email}`} className="rounded-md border border-hairline p-1.5 hover:bg-surface" title="Email">
          <Mail className="h-4 w-4" />
        </a>
      ) : null}
    </li>
  );
}
