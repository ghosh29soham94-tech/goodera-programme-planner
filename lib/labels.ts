import type { Format } from "@/lib/types";

export const SENIORITY_LABEL: Record<string, string> = {
  junior: "Early career",
  mid: "Mid-level",
  senior: "Senior",
  executive: "Executive / leadership",
  mixed: "Mixed levels",
};

export const CAUSE_LABEL: Record<string, string> = { health: "Health", education: "Education", hunger: "Hunger" };

export const FORMAT_LABEL: Record<Format, string> = {
  "leadership-day": "Leadership day",
  "build-donate": "Build and donate",
  wellbeing: "Wellbeing",
  close: "Close",
};

export function hoursLabel(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h % 1 === 0 ? h : h.toFixed(1)} hour${h === 1 ? "" : "s"}`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
