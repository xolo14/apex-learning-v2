import { FileText, Loader2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { internshipDefaultsFromProfile } from "@/lib/profile-form-defaults";
import { readCachedProfile } from "@/lib/session";

export type InternshipApplyValues = {
  applicantName: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
  linkedin: string;
  message: string;
  resumeName: string;
  resumeData: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  roleTitle: string;
  company: string;
  submitting?: boolean;
  onSubmit: (values: InternshipApplyValues) => void;
};

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Professional"];

export function InternshipApplyForm({
  open,
  onClose,
  roleTitle,
  company,
  submitting = false,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [message, setMessage] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeData, setResumeData] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [profileFilled, setProfileFilled] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fromProfile = internshipDefaultsFromProfile(readCachedProfile());
    setName(fromProfile.applicantName);
    setEmail(fromProfile.email);
    setPhone(fromProfile.phone);
    setCollege(fromProfile.college);
    setYear(fromProfile.year);
    setBranch(fromProfile.branch);
    setLinkedin("");
    setMessage("");
    setResumeName("");
    setResumeData("");
    setResumeError(null);
    setProfileFilled(
      Boolean(
        fromProfile.applicantName ||
          fromProfile.email ||
          fromProfile.phone ||
          fromProfile.college,
      ),
    );
  }, [open]);

  if (!open) return null;

  function onResumePick(file: File | null) {
    setResumeError(null);
    if (!file) {
      setResumeName("");
      setResumeData("");
      return;
    }
    const ok =
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!ok) {
      setResumeError("Upload PDF or Word document only.");
      return;
    }
    if (file.size > 400_000) {
      setResumeError("Max file size is 400KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setResumeName(file.name);
      setResumeData(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => setResumeError("Could not read file.");
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeData) {
      setResumeError("Resume is required.");
      return;
    }
    onSubmit({
      applicantName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      college: college.trim(),
      year,
      branch: branch.trim(),
      linkedin: linkedin.trim(),
      message: message.trim(),
      resumeName,
      resumeData,
    });
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-hairline bg-background px-3 py-2.5 text-[14px] outline-none focus:border-forest";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-[24px] bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Apply</p>
            <h2 className="mt-0.5 text-[18px] font-semibold leading-tight">{roleTitle}</h2>
            <p className="text-[13px] text-ink-muted">{company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface"
            aria-label="Close form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {profileFilled ? (
          <p className="mb-4 rounded-xl border border-forest/20 bg-forest/5 px-3 py-2 text-[12px] leading-relaxed text-forest">
            Filled from your Syncpedia profile — check details below, then add your pitch and resume.
          </p>
        ) : null}

        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Your details</p>

        <label className="block text-[12px] font-medium text-ink-muted">
          Full name *
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>

        <label className="mt-3 block text-[12px] font-medium text-ink-muted">
          Email *
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>

        <label className="mt-3 block text-[12px] font-medium text-ink-muted">
          Mobile *
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>

        <label className="mt-3 block text-[12px] font-medium text-ink-muted">
          College / University *
          <input required value={college} onChange={(e) => setCollege(e.target.value)} className={inputClass} />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-[12px] font-medium text-ink-muted">
            Year *
            <select required value={year} onChange={(e) => setYear(e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-ink-muted">
            Branch *
            <input required value={branch} onChange={(e) => setBranch(e.target.value)} className={inputClass} placeholder="CSE" />
          </label>
        </div>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Application</p>

        <label className="mt-3 block text-[12px] font-medium text-ink-muted">
          LinkedIn (optional)
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/..." />
        </label>

        <label className="mt-3 block text-[12px] font-medium text-ink-muted">
          Why you&apos;re a fit *
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass + " resize-none"}
            placeholder="Brief pitch — skills, projects, availability…"
          />
        </label>

        <div className="mt-4">
          <p className="text-[12px] font-medium text-ink-muted">Resume * (PDF or Word, max 400KB)</p>
          <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface/50 px-4 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-forest/10 text-forest">
              {resumeName ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1 text-[13px]">
              {resumeName ? (
                <span className="font-medium text-foreground">{resumeName}</span>
              ) : (
                <span className="text-ink-muted">Tap to upload resume</span>
              )}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => onResumePick(e.target.files?.[0] ?? null)}
            />
          </label>
          {resumeError ? <p className="mt-1 text-[11px] text-red-600">{resumeError}</p> : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit application
        </button>
      </form>
    </div>
  );
}
