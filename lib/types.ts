// Shared types. Safe to import from client and server.

export type Role = "owner" | "evaluator";

export type Seniority = "junior" | "mid" | "senior" | "executive" | "mixed";
export const SENIORITIES: Seniority[] = ["junior", "mid", "senior", "executive", "mixed"];

export type Cause = "health" | "education" | "hunger";
export const CAUSES: Cause[] = ["health", "education", "hunger"];

export type Format = "leadership-day" | "build-donate" | "wellbeing" | "close";

export interface Nonprofit {
  id: string;
  name: string;
  cause: Cause;
  location: string;
  /** One-paragraph problem statement used as the leadership case. */
  problem: string;
  /** The question leadership teams are asked to answer. */
  ask: string;
  /** Facts teams get in the case pack. */
  facts: string[];
}

export interface ImpactUnit {
  /** e.g. "bikes" */
  unit: string;
  /** Units produced per participant. */
  perPerson: number;
  /** Human sentence fragment, e.g. "bikes donated to girls who travel 6+ km to school" */
  label: string;
}

export interface BuildDetails {
  built: string;
  recipient: string;
  materials: string[];
  teamSize: number;
  stations: string[];
}

export interface CatalogueItem {
  id: string;
  name: string;
  format: Format;
  durationHours: number;
  pricePerHead: number; // USD
  hosts: number;
  hostLabel: string; // "1 facilitator"
  hostNames: string;
  seniority: Seniority[];
  minGroup: number;
  maxGroup: number;
  nonprofitId: string | null;
  summary: string;
  outcome: string; // used on the proposal
  impact: ImpactUnit;
  /** Share of the price that goes to / is spent on the nonprofit (CSR-countable). Sample rule. */
  csrShare: number;
  build?: BuildDetails;
}

export interface Pickers {
  groupSize?: number | null;
  seniority?: Seniority | null;
  location?: string | null;
  date?: string | null; // yyyy-mm-dd
  budgetPerHead?: number | null;
  cause?: Cause | null;
}

export interface Understood {
  goal: string;
  groupSize: number;
  seniority: Seniority;
  location: string;
  durationHours: number;
  budgetPerHead: number | null;
  cause: Cause | null;
  practices: string[];
}

export interface PlanBlock {
  catalogueId: string;
  start: string; // "HH:MM"
  reason: string;
}

/** The AI contract (also the shape of pre-built samples). */
export interface PlanResult {
  status: "ok" | "out_of_scope";
  /** Short programme name, max 60 characters. Used as the heading on the proposal, report and card. */
  title: string;
  understood: Understood;
  /** Each assumption starts with the field it is about, e.g. "budgetPerHead: ..." */
  assumptions: string[];
  blocks: PlanBlock[];
  notes: string[];
}

export type PlanSource = "ai" | "cache" | "example" | "fallback";

export interface PlanResponse {
  plan: PlanResult;
  source: PlanSource;
  /** Present when we fell back to a sample (error, timeout, limit). */
  fallbackReason: string | null;
  /** Remaining AI plans for this role, null = not limited per role. */
  remaining: number | null;
}

export interface Attendee {
  name: string;
  practice: string;
}
