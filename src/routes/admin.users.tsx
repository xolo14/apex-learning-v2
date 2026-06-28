import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProfiles, type DbProfile } from "@/lib/profiles.functions";
import { useMemo, useState } from "react";
import { Download, Search, X, Filter } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Role = "all" | "student" | "professional";

const ALL = "__all__";

function uniqueValues(rows: DbProfile[], key: keyof DbProfile): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    const v = r[key];
    if (typeof v === "string" && v.trim()) s.add(v.trim());
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function AdminUsers() {
  const listP = useServerFn(listProfiles);
  const profilesQ = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: () => listP(),
    refetchInterval: 20_000,
  });
  const profiles = profilesQ.data ?? [];

  const [role, setRole] = useState<Role>("all");
  const [year, setYear] = useState<string>(ALL);
  const [college, setCollege] = useState<string>(ALL);
  const [branch, setBranch] = useState<string>(ALL);
  const [department, setDepartment] = useState<string>(ALL);
  const [company, setCompany] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  const studentRows = useMemo(() => profiles.filter((p) => p.role === "student"), [profiles]);
  const proRows = useMemo(() => profiles.filter((p) => p.role === "professional"), [profiles]);

  const years = useMemo(() => uniqueValues(studentRows, "year"), [studentRows]);
  const colleges = useMemo(() => uniqueValues(studentRows, "college"), [studentRows]);
  const branches = useMemo(() => uniqueValues(studentRows, "branch"), [studentRows]);
  const departments = useMemo(() => uniqueValues(studentRows, "department"), [studentRows]);
  const companies = useMemo(() => uniqueValues(proRows, "company"), [proRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (role !== "professional") {
        if (year !== ALL && (p.year ?? "") !== year) return false;
        if (college !== ALL && (p.college ?? "") !== college) return false;
        if (branch !== ALL && (p.branch ?? "") !== branch) return false;
        if (department !== ALL && (p.department ?? "") !== department) return false;
      }
      if (role !== "student" && company !== ALL && (p.company ?? "") !== company) return false;
      if (q) {
        const hay = `${p.name} ${p.unique_id} ${p.gmail} ${p.mobile} ${p.college ?? ""} ${p.company ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [profiles, role, year, college, branch, department, company, search]);

  function clearFilters() {
    setRole("all"); setYear(ALL); setCollege(ALL); setBranch(ALL);
    setDepartment(ALL); setCompany(ALL); setSearch("");
  }

  function rowsForExport() {
    return filtered.map((p) => ({
      "Unique ID": p.unique_id,
      Name: p.name,
      Role: p.role,
      Email: p.gmail,
      Mobile: p.mobile,
      Year: p.year ?? "",
      College: p.college ?? "",
      Branch: p.branch ?? "",
      Department: p.department ?? "",
      Company: p.company ?? "",
      Joined: new Date(p.created_at).toISOString(),
    }));
  }

  function downloadCSV() {
    const data = rowsForExport();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...data.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(","))].join("\n");
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `syncpedia-members-${stamp()}.csv`);
  }

  function downloadXLSX() {
    const data = rowsForExport();
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `syncpedia-members-${stamp()}.xlsx`);
  }

  const studentCount = filtered.filter((p) => p.role === "student").length;
  const proCount = filtered.filter((p) => p.role === "professional").length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Members directory</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
            All students &amp; professionals
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            {profiles.length} total · {filtered.length} shown · {studentCount} students · {proCount} professionals
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-[12.5px] font-medium hover:bg-surface disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={downloadXLSX}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[12.5px] font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Excel (.xlsx)
          </button>
        </div>
      </header>

      {/* Filters bar */}
      <section className="mt-6 rounded-2xl border border-hairline p-4">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-ink-muted">
          <Filter className="h-3.5 w-3.5" /> Filters
          <button
            onClick={clearFilters}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-foreground normal-case tracking-normal"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>

        {/* Role pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["all", "student", "professional"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={
                "rounded-full px-3 py-1.5 text-[12px] font-medium capitalize transition-colors " +
                (role === r
                  ? "bg-foreground text-background"
                  : "border border-hairline text-foreground hover:bg-surface")
              }
            >
              {r === "all" ? "All members" : r === "professional" ? "Professionals" : "Students"}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SelectFilter label="Graduation year" value={year} onChange={setYear} options={years} disabled={role === "professional"} />
          <SelectFilter label="Branch" value={branch} onChange={setBranch} options={branches} disabled={role === "professional"} />
          <SelectFilter label="Department" value={department} onChange={setDepartment} options={departments} disabled={role === "professional"} />
          <SelectFilter label="College" value={college} onChange={setCollege} options={colleges} disabled={role === "professional"} />
          <SelectFilter label="Company" value={company} onChange={setCompany} options={companies} disabled={role === "student"} />
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, ID, email…"
                className="w-full rounded-lg border border-hairline bg-background py-2 pl-8 pr-2 text-[13px] outline-none focus:border-foreground"
              />
            </div>
          </label>
        </div>
      </section>

      {/* Results table */}
      <section className="mt-6 rounded-2xl border border-hairline">
        <header className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Results · {filtered.length}
          </h2>
          <span className="text-[11px] text-ink-muted">
            {profilesQ.isLoading ? "Loading…" : "Updated live"}
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              <tr className="border-b border-hairline">
                <th className="px-5 py-2 font-medium">Unique ID</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Role</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Mobile</th>
                <th className="px-5 py-2 font-medium">Year</th>
                <th className="px-5 py-2 font-medium">Branch</th>
                <th className="px-5 py-2 font-medium">Department</th>
                <th className="px-5 py-2 font-medium">College / Company</th>
                <th className="px-5 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-ink-muted">
                    {profilesQ.isLoading ? "Loading…" : "No members match these filters."}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-hairline last:border-0 hover:bg-surface/50">
                  <td className="px-5 py-2 font-mono text-[12px]">{p.unique_id}</td>
                  <td className="px-5 py-2 font-medium">{p.name}</td>
                  <td className="px-5 py-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize " +
                        (p.role === "student"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800")
                      }
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-ink-muted">{p.gmail}</td>
                  <td className="px-5 py-2 tabular-nums">{p.mobile}</td>
                  <td className="px-5 py-2">{p.year ?? "—"}</td>
                  <td className="px-5 py-2">{p.branch ?? "—"}</td>
                  <td className="px-5 py-2">{p.department ?? "—"}</td>
                  <td className="px-5 py-2">{p.role === "professional" ? (p.company ?? "—") : (p.college ?? "—")}</td>
                  <td className="px-5 py-2 text-ink-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-hairline bg-background px-2 py-2 text-[13px] outline-none focus:border-foreground disabled:opacity-40"
      >
        <option value={ALL}>All ({options.length})</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}