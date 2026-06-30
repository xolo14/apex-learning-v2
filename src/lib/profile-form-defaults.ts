import type { DbProfile } from "./profiles.functions";

export type InternshipApplyDefaults = {
  applicantName: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
};

const YEAR_TO_FORM: Record<string, string> = {
  "1st year": "1st Year",
  "2nd year": "2nd Year",
  "3rd year": "3rd Year",
  "4th year": "4th Year",
  "passed out": "Graduate",
};

/** Map signup profile → internship application fields (editable by user). */
export function internshipDefaultsFromProfile(profile: DbProfile | null): InternshipApplyDefaults {
  if (!profile) {
    return {
      applicantName: "",
      email: "",
      phone: "",
      college: "",
      year: "",
      branch: "",
    };
  }

  let year = "";
  if (profile.role === "professional") {
    year = "Professional";
  } else if (profile.year) {
    year = YEAR_TO_FORM[profile.year.toLowerCase().trim()] ?? profile.year;
  }

  const branch =
    profile.department?.trim() ||
    (profile.branch && profile.branch !== "B.Tech" && profile.branch !== "Other"
      ? profile.branch.trim()
      : "") ||
    "";

  return {
    applicantName: profile.name?.trim() ?? "",
    email: profile.gmail?.trim() ?? "",
    phone: profile.mobile?.trim() ?? "",
    college: profile.college?.trim() ?? "",
    year,
    branch,
  };
}
