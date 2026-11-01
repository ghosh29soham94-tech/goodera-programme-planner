// Pre-built plans. The 3 examples never call the API; all 4 are used as fallbacks.
import type { Pickers, PlanResult } from "@/lib/types";

export type SampleId = "leadership" | "team" | "onboarding" | "wellbeing";

export interface Example {
  id: Exclude<SampleId, "wellbeing">;
  label: string;
  brief: string;
  pickers: Pickers;
}

export const DEFAULT_BRIEF =
  "Half a day of our 2-day pre-sales offsite in Bangalore in March. 40 leaders from BFSI, life sciences and healthcare. I want them working across practices. No lectures. About $120 a head.";

export const EXAMPLES: Example[] = [
  {
    id: "leadership",
    label: "Leadership offsite",
    brief:
      "A morning at our leadership offsite in Pune for 24 senior directors from engineering and delivery. We want them to solve a real problem together, not sit through a talk. Around $130 a head.",
    pickers: {},
  },
  {
    id: "team",
    label: "Team quarterly",
    brief:
      "Quarterly get-together for our 60-person product team in Hyderabad. Something hands-on that gives back, about 3 hours in the afternoon. Around $60 a head.",
    pickers: {},
  },
  {
    id: "onboarding",
    label: "New-joiner week",
    brief:
      "Welcome-week activity for 120 new joiners in Bangalore from sales, engineering and support. Help them meet people outside their own team. Keep it under $75 a head.",
    pickers: {},
  },
];

export const SAMPLE_PLANS: Record<SampleId, PlanResult> = {
  leadership: {
    status: "ok",
    title: "Leadership offsite: Saathi design sprint",
    understood: {
      goal: "Senior directors solve a real problem together",
      groupSize: 24,
      seniority: "executive",
      location: "Pune",
      durationHours: 4.5,
      budgetPerHead: 130,
      cause: null,
      practices: ["Engineering", "Delivery"],
    },
    assumptions: [
      "durationHours: 'A morning' read as about 4.5 hours, 9:00 to 13:30.",
      "cause: No cause given, so we chose health; the Saathi case suits engineering and delivery skills.",
    ],
    blocks: [
      {
        catalogueId: "ld-design-sprint",
        start: "09:00",
        reason: "A live nonprofit case gives directors a real problem to solve in mixed teams, with no lecture.",
      },
      {
        catalogueId: "cl-reflection",
        start: "13:00",
        reason: "A short close turns the morning into commitments before lunch.",
      },
    ],
    notes: [],
  },

  team: {
    status: "ok",
    title: "Product team quarterly: build and give back",
    understood: {
      goal: "Hands-on team time that gives back",
      groupSize: 60,
      seniority: "mixed",
      location: "Hyderabad",
      durationHours: 3,
      budgetPerHead: 60,
      cause: null,
      practices: [],
    },
    assumptions: [
      "seniority: A product team usually spans levels, so we planned for a mixed group.",
      "cause: No cause given, so we chose education; bikes are a visible, shared result.",
    ],
    blocks: [
      {
        catalogueId: "bd-bikes",
        start: "14:00",
        reason: "Teams of 4 build something real together, and the result is easy to see and share.",
      },
      {
        catalogueId: "wb-letters-of-care",
        start: "16:00",
        reason: "A quieter hour after the build, so the afternoon ends calm, not rushed.",
      },
    ],
    notes: ["60 people in teams of 4 build 15 bikes."],
  },

  onboarding: {
    status: "ok",
    title: "New-joiner welcome: kits, calm and connections",
    understood: {
      goal: "New joiners meet people outside their own team",
      groupSize: 120,
      seniority: "junior",
      location: "Bangalore",
      durationHours: 3.5,
      budgetPerHead: 75,
      cause: null,
      practices: ["Sales", "Engineering", "Support"],
    },
    assumptions: [
      "seniority: New joiners treated as mostly early-career.",
      "durationHours: No length given, so we planned a 3.5-hour morning.",
    ],
    blocks: [
      {
        catalogueId: "bd-school-kits",
        start: "10:00",
        reason: "Rotating stations mix sales, engineering and support from the first minute.",
      },
      {
        catalogueId: "wb-mindful-reset",
        start: "12:00",
        reason: "A calm hour in a busy first week; it also funds counselling for health workers.",
      },
      {
        catalogueId: "cl-reflection",
        start: "13:00",
        reason: "Each joiner leaves with one pledge and the names of people they met.",
      },
    ],
    notes: [],
  },

  // Fallback only (no example button).
  wellbeing: {
    status: "ok",
    title: "Wellbeing afternoon: reset and give back",
    understood: {
      goal: "A calm, restorative session that gives back",
      groupSize: 50,
      seniority: "mixed",
      location: "Bangalore",
      durationHours: 2.5,
      budgetPerHead: 55,
      cause: "health",
      practices: [],
    },
    assumptions: [
      "groupSize: No size given, so we planned for 50 people.",
      "location: No location given, so we assumed Bangalore.",
    ],
    blocks: [
      { catalogueId: "wb-mindful-reset", start: "15:00", reason: "Opens with a guided reset on stress and focus." },
      { catalogueId: "wb-letters-of-care", start: "16:00", reason: "A reflective, low-energy way to give back." },
      { catalogueId: "cl-reflection", start: "17:00", reason: "Closes with one personal pledge each." },
    ],
    notes: [],
  },
};

// ------------------------------------------------------------------ helpers

export function normaliseBrief(brief: string): string {
  return brief.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Exact (normalised) match against an example brief: served without calling the API. */
export function findExample(brief: string): Example | undefined {
  const n = normaliseBrief(brief);
  return EXAMPLES.find((e) => normaliseBrief(e.brief) === n);
}

const KEYWORDS: Record<SampleId, string[]> = {
  leadership: ["leader", "leadership", "director", "executive", "vp", "cxo", "strategy", "offsite", "off-site"],
  team: ["team", "quarterly", "department", "squad", "offsite"],
  onboarding: ["onboard", "new joiner", "new-joiner", "joiners", "new hire", "induction", "welcome", "graduate", "intern"],
  wellbeing: ["wellbeing", "well-being", "wellness", "mental", "stress", "burnout", "mindful", "calm"],
};

/** Closest sample by keyword count. Ties go to the order above; no match falls back to "team". */
export function closestSampleId(brief: string): SampleId {
  const n = normaliseBrief(brief);
  let best: SampleId = "team";
  let bestScore = 0;
  for (const id of Object.keys(KEYWORDS) as SampleId[]) {
    const score = KEYWORDS[id].filter((k) => n.includes(k)).length;
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}
