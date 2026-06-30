import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminCoinLabel, AdminPriceLabel } from "@/components/price-coin-badges";
import {
  formatClassLinksForAdmin,
  parseClassLinksFromAdmin,
  serializeClassLinks,
} from "@/lib/certification-meta";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  listCommunities,
  type DbCourse,
} from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCertifications,
});

type FormState = {
  title: string;
  slug: string;
  desc: string;
  imageUrl: string;
  price: string;
  coins: string;
  category: string;
  programDuration: string;
  subtitle: string;
  lectures: string;
  hoursLabel: string;
  language: string;
  level: string;
  projectsLabel: string;
  videoUrl: string;
  classLinksText: string;
};

const emptyForm = (): FormState => ({
  title: "",
  slug: "",
  desc: "",
  imageUrl: "",
  price: "0",
  coins: "0",
  category: "",
  programDuration: "2 Months Program",
  subtitle: "Certification",
  lectures: "",
  hoursLabel: "",
  language: "English",
  level: "",
  projectsLabel: "",
  videoUrl: "",
  classLinksText: "",
});

function courseToForm(c: DbCourse): FormState {
  return {
    title: c.title,
    slug: c.community_slug,
    desc: c.description,
    imageUrl: c.image_url,
    price: String(c.price),
    coins: String(c.coins),
    category: c.category,
    programDuration: c.program_duration,
    subtitle: c.subtitle,
    lectures: c.lectures_count > 0 ? String(c.lectures_count) : "",
    hoursLabel: c.hours_label,
    language: c.language,
    level: c.level,
    projectsLabel: c.projects_label,
    videoUrl: c.video_url,
    classLinksText: formatClassLinksForAdmin(c),
  };
}

function payloadFromForm(form: FormState) {
  const links = serializeClassLinks(parseClassLinksFromAdmin(form.classLinksText));
  return {
    title: form.title,
    communitySlug: form.slug,
    description: form.desc,
    imageUrl: form.imageUrl,
    price: Number(form.price) || 0,
    coins: Number(form.coins) || 0,
    category: form.category,
    programDuration: form.programDuration,
    subtitle: form.subtitle,
    lecturesCount: Number(form.lectures) || 0,
    hoursLabel: form.hoursLabel,
    language: form.language,
    level: form.level,
    projectsLabel: form.projectsLabel,
    videoUrl: form.videoUrl,
    classLinks: links,
  };
}

function AdminCertifications() {
  const qc = useQueryClient();
  const list = useServerFn(listCourses);
  const listCom = useServerFn(listCommunities);
  const create = useServerFn(createCourse);
  const update = useServerFn(updateCourse);
  const del = useServerFn(deleteCourse);

  const q = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: () => list(),
    refetchInterval: 10_000,
  });
  const qCom = useQuery({ queryKey: ["admin", "communities"], queryFn: () => listCom() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "courses"] });

  const mCreate = useMutation({ mutationFn: create, onSuccess: invalidate });
  const mUpdate = useMutation({ mutationFn: update, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const approvedCom = (qCom.data ?? []).filter((c) => c.status === "approved");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function startEdit(c: DbCourse) {
    setEditingId(c.id);
    setForm(courseToForm(c));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Certifications</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
          Manage certification programs
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Set price to 0 for free programs. Add class links — students see them after enroll / payment.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {editingId ? "Edit certification" : "Add certification"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Cancel edit
            </button>
          ) : null}
        </div>

        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.slug) return;
            const data = payloadFromForm(form);
            if (editingId) {
              mUpdate.mutate({ data: { id: editingId, ...data } }, { onSuccess: resetForm });
            } else {
              mCreate.mutate({ data }, { onSuccess: resetForm });
            }
          }}
        >
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Program title (e.g. Digital Marketing)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <select
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          >
            <option value="">Select community…</option>
            {approvedCom.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={form.programDuration}
            onChange={(e) => set("programDuration", e.target.value)}
            placeholder="Program duration (e.g. 2 Months Program)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Subtitle (e.g. Certification)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />

          <input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Category tag (e.g. MARKETING)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="Cover image URL"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />

          <label className="flex flex-col gap-1">
            <AdminPriceLabel kind="course" />
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
            />
            <span className="text-[11px] text-ink-muted">0 = free · students get classes instantly</span>
          </label>
          <label className="flex flex-col gap-1">
            <AdminCoinLabel kind="course" />
            <input
              type="number"
              min={0}
              value={form.coins}
              onChange={(e) => set("coins", e.target.value)}
              className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
            />
          </label>

          <input
            value={form.lectures}
            onChange={(e) => set("lectures", e.target.value)}
            placeholder="Total lectures (optional)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.hoursLabel}
            onChange={(e) => set("hoursLabel", e.target.value)}
            placeholder="Hours label (e.g. 20+ Hours)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.language}
            onChange={(e) => set("language", e.target.value)}
            placeholder="Language"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.level}
            onChange={(e) => set("level", e.target.value)}
            placeholder="Level (e.g. Beginner)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.projectsLabel}
            onChange={(e) => set("projectsLabel", e.target.value)}
            placeholder="Projects (e.g. 2 Real Projects)"
            className="md:col-span-2 rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={form.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            placeholder="Preview video / thumbnail URL (optional)"
            className="md:col-span-2 rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />

          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
              Class links (shown after enroll / payment)
            </span>
            <textarea
              value={form.classLinksText}
              onChange={(e) => set("classLinksText", e.target.value)}
              placeholder={"Class 1 | https://lmsclasses.com/videos/...\nClass 2 : https://youtube.com/...\nOr paste video URLs only, one per line"}
              rows={5}
              className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] font-mono"
            />
          </label>

          <textarea
            value={form.desc}
            onChange={(e) => set("desc", e.target.value)}
            placeholder="Program description"
            rows={3}
            className="md:col-span-2 rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />

          <button
            type="submit"
            disabled={mCreate.isPending || mUpdate.isPending}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] text-background disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {editingId ? "Save changes" : "Add certification"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-hairline">
        <header className="border-b border-hairline px-5 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            All certifications ({q.data?.length ?? 0})
          </h2>
        </header>
        <ul className="divide-y divide-hairline">
          {(q.data ?? []).length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-muted">
              {q.isLoading ? "Loading…" : "No certifications yet."}
            </li>
          )}
          {(q.data ?? []).map((c: DbCourse) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              {c.image_url ? (
                <img src={c.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-surface" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{c.title}</p>
                <p className="truncate text-[11px] text-ink-muted">
                  c/{c.community_slug}
                  {c.program_duration ? ` · ${c.program_duration}` : ""}
                  {" · "}
                  {c.price > 0 ? `₹${c.price}` : "Free"}
                  {" · "}+{c.coins} coins
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(c)}
                className="rounded-md border border-hairline p-1.5 hover:bg-surface"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mDelete.mutate({ data: { id: c.id } })}
                className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
