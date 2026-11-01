// Fictional demo data. Every company, person and nonprofit here is made up.
import type { Attendee, CatalogueItem, Nonprofit } from "@/lib/types";

export const COMPANY = {
  name: "Northwind Tech",
  industry: "Technology services",
  hq: "Bangalore",
};

export const PEOPLE = {
  businessHead: { name: "Priya Raman", title: "Business Head, Pre-sales" },
  hrPartner: { name: "Rahul Mehta", title: "HR Business Partner" },
  csrLead: { name: "Meera Das", title: "CSR Lead" },
  partner: { name: "Goodera", title: "Experience partner" },
};

/** Used to mix teams when the brief names no practices. */
export const GENERIC_FUNCTIONS = ["Sales", "Engineering", "Delivery", "Product", "Operations", "Finance"];

// ---------------------------------------------------------------- nonprofits

export const NONPROFITS: Nonprofit[] = [
  {
    id: "saathi",
    name: "Saathi Health Collective",
    cause: "health",
    location: "Kolar district, Karnataka",
    problem:
      "Saathi's community health workers support expectant mothers in 120 villages. Between the first and third check-up, 4 in 10 mothers drop out of care. Records are on paper, follow-ups depend on memory, and a clinic visit can cost a family a day's wage.",
    ask: "Design a follow-up routine a health worker with a basic phone can run in 15 minutes a day, and that brings drop-off below 2 in 10.",
    facts: [
      "38 health workers, each covering about 3 villages",
      "Workers have basic phones; 60% of mothers have a family phone",
      "A missed check-up is usually noticed only at the next village visit, 4 weeks later",
      "Budget for any new tool: under $3,000 a year",
    ],
  },
  {
    id: "akshara",
    name: "Akshara Learning Trust",
    cause: "education",
    location: "Hosur and surrounding villages",
    problem:
      "In Akshara's 60 partner government schools, 1 in 3 girls leaves school after Class 8. Parents name two reasons: the nearest secondary school is 6+ km away, and families cannot afford supplies for older children.",
    ask: "Find the three changes that would keep the most girls in school, at under $25 per girl per year.",
    facts: [
      "About 1,400 girls finish Class 8 each year across the 60 schools",
      "Bus routes cover only 40% of villages",
      "A bicycle costs about $60; a year of supplies about $12",
      "Akshara has 9 field staff and strong ties with head teachers",
    ],
  },
  {
    id: "annapurna",
    name: "Annapurna Food Network",
    cause: "hunger",
    location: "Bangalore",
    problem:
      "Annapurna collects surplus food from 40 corporate canteens and delivers it to 25 shelters. Almost 30% spoils before it arrives, because pick-ups are booked by phone each afternoon and the three vans often run half-empty.",
    ask: "Redesign pick-up scheduling and routing so twice as many meals arrive fresh, with the same three vans.",
    facts: [
      "About 6,000 surplus meals are offered per weekday",
      "Vans are free from 2pm to 9pm",
      "Shelters can store food for 4 hours without refrigeration",
      "Canteens confirm surplus between 1pm and 3pm",
    ],
  },
];

// ----------------------------------------------------------------- catalogue

export const CATALOGUE: CatalogueItem[] = [
  // Leadership days: $120/head, 1 facilitator, 4 hours
  {
    id: "ld-design-sprint",
    name: "Nonprofit Design Sprint",
    format: "leadership-day",
    durationHours: 4,
    pricePerHead: 120,
    hosts: 1,
    hostLabel: "1 facilitator",
    hostNames: "Kavya Rao (Goodera)",
    seniority: ["senior", "executive"],
    minGroup: 12,
    maxGroup: 80,
    nonprofitId: "saathi",
    summary: "Mixed teams design and pitch a follow-up system for Saathi's health workers.",
    outcome: "Leaders practise solving an unfamiliar problem with colleagues from other practices.",
    impact: { unit: "pro-bono hours", perPerson: 4, label: "pro-bono strategy hours for Saathi Health Collective" },
    csrShare: 0.3,
  },
  {
    id: "ld-ops-lab",
    name: "Operations Turnaround Lab",
    format: "leadership-day",
    durationHours: 4,
    pricePerHead: 120,
    hosts: 1,
    hostLabel: "1 facilitator",
    hostNames: "Vikram Shetty (Goodera)",
    seniority: ["senior", "executive"],
    minGroup: 12,
    maxGroup: 80,
    nonprofitId: "annapurna",
    summary: "Teams rebuild Annapurna's pick-up schedule and routing against real constraints.",
    outcome: "Leaders align on trade-offs fast and test ideas against hard data.",
    impact: { unit: "pro-bono hours", perPerson: 4, label: "pro-bono operations hours for Annapurna Food Network" },
    csrShare: 0.3,
  },
  {
    id: "ld-strategy-room",
    name: "Scale-up Strategy Room",
    format: "leadership-day",
    durationHours: 4,
    pricePerHead: 120,
    hosts: 1,
    hostLabel: "1 facilitator",
    hostNames: "Kavya Rao (Goodera)",
    seniority: ["mid", "senior", "executive"],
    minGroup: 12,
    maxGroup: 80,
    nonprofitId: "akshara",
    summary: "Teams build a costed plan to keep more girls in school with Akshara.",
    outcome: "Leaders build a shared, costed recommendation and present it to a real client.",
    impact: { unit: "pro-bono hours", perPerson: 4, label: "pro-bono strategy hours for Akshara Learning Trust" },
    csrShare: 0.3,
  },

  // Build-and-donate: $40/head, 2 hosts, 2 hours
  {
    id: "bd-bikes",
    name: "Build-a-Bike",
    format: "build-donate",
    durationHours: 2,
    pricePerHead: 40,
    hosts: 2,
    hostLabel: "2 hosts",
    hostNames: "Arjun Nair & Neha Kulkarni (Goodera)",
    seniority: ["junior", "mid", "senior", "executive", "mixed"],
    minGroup: 10,
    maxGroup: 400,
    nonprofitId: "akshara",
    summary: "Teams of 4 assemble and safety-check bicycles for girls starting secondary school.",
    outcome: "A hands-on win the whole group can see, with a clear story to share.",
    impact: { unit: "bikes", perPerson: 0.25, label: "bikes for girls who travel 6+ km to school" },
    csrShare: 0.65,
    build: {
      built: "Single-speed bicycles, assembled from kits and safety-checked",
      recipient: "Girls entering Class 9 in Akshara Learning Trust partner schools near Hosur",
      materials: ["Bicycle kit (1 per team of 4)", "Tool set per team", "Safety-check card", "Handover letter and pen"],
      teamSize: 4,
      stations: ["Frame and wheels", "Brakes and chain", "Safety check", "Letter to the rider"],
    },
  },
  {
    id: "bd-school-kits",
    name: "School Kit Assembly",
    format: "build-donate",
    durationHours: 2,
    pricePerHead: 40,
    hosts: 2,
    hostLabel: "2 hosts",
    hostNames: "Arjun Nair & Neha Kulkarni (Goodera)",
    seniority: ["junior", "mid", "senior", "executive", "mixed"],
    minGroup: 10,
    maxGroup: 2000,
    nonprofitId: "akshara",
    summary: "Stations pack a year of school supplies for older girls, with a note in every kit.",
    outcome: "People meet colleagues across teams while working a simple production line.",
    impact: { unit: "school kits", perPerson: 3, label: "year-long school kits for girls in Classes 9 and 10" },
    csrShare: 0.65,
    build: {
      built: "School kits: bag, notebooks, geometry set, calculator, torch",
      recipient: "Girls in Classes 9 and 10 at Akshara Learning Trust partner schools",
      materials: ["Kit components (3 kits per person)", "Bags", "Checklists", "Note cards"],
      teamSize: 6,
      stations: ["Sort", "Pack", "Quality check", "Write the note"],
    },
  },
  {
    id: "bd-meal-packs",
    name: "Meal Pack Drive",
    format: "build-donate",
    durationHours: 2,
    pricePerHead: 40,
    hosts: 2,
    hostLabel: "2 hosts",
    hostNames: "Sana Qureshi & Rohan Pillai (Goodera)",
    seniority: ["junior", "mid", "senior", "executive", "mixed"],
    minGroup: 20,
    maxGroup: 5000,
    nonprofitId: "annapurna",
    summary: "Teams pack dry-ration meal packs for Annapurna's shelters, with a live count.",
    outcome: "Scales to very large groups; energy comes from a shared target.",
    impact: { unit: "meals", perPerson: 25, label: "meals delivered to shelters across Bangalore" },
    csrShare: 0.65,
    build: {
      built: "Dry-ration meal packs (rice, dal, oil, spices), 5 meals per pack",
      recipient: "Families at Annapurna Food Network's 25 partner shelters",
      materials: ["Bulk rations", "Pack bags and sealers", "Scales", "Tally board"],
      teamSize: 8,
      stations: ["Measure", "Fill", "Seal", "Count and box"],
    },
  },

  // Wellbeing
  {
    id: "wb-mindful-reset",
    name: "Mindful Reset",
    format: "wellbeing",
    durationHours: 1,
    pricePerHead: 25,
    hosts: 1,
    hostLabel: "1 coach",
    hostNames: "Dr. Leela Menon (Goodera)",
    seniority: ["junior", "mid", "senior", "executive", "mixed"],
    minGroup: 5,
    maxGroup: 300,
    nonprofitId: "saathi",
    summary: "A guided hour on stress and focus; each seat funds counselling for health workers.",
    outcome: "People leave calmer, with two techniques they can use at work.",
    impact: { unit: "counselling minutes", perPerson: 20, label: "counselling minutes for Saathi's health workers" },
    csrShare: 0.4,
  },
  {
    id: "wb-letters-of-care",
    name: "Letters of Care",
    format: "wellbeing",
    durationHours: 1,
    pricePerHead: 20,
    hosts: 1,
    hostLabel: "1 host",
    hostNames: "Neha Kulkarni (Goodera)",
    seniority: ["junior", "mid", "senior", "executive", "mixed"],
    minGroup: 5,
    maxGroup: 2000,
    nonprofitId: "saathi",
    summary: "A quiet, reflective hour writing letters to new mothers in Saathi's clinics.",
    outcome: "A low-key, inclusive activity that works for any energy level.",
    impact: { unit: "letters", perPerson: 3, label: "letters for new mothers in Saathi's clinics" },
    csrShare: 0.4,
  },

  // Short close
  {
    id: "cl-reflection",
    name: "Reflection Circle & Pledge",
    format: "close",
    durationHours: 0.5,
    pricePerHead: 10,
    hosts: 1,
    hostLabel: "1 facilitator",
    hostNames: "Goodera facilitator",
    seniority: ["junior", "mid", "senior", "executive", "mixed"],
    minGroup: 5,
    maxGroup: 5000,
    nonprofitId: null,
    summary: "A 30-minute close: what we learned, and one volunteering pledge each.",
    outcome: "Turns the day into commitments people can act on.",
    impact: { unit: "pledges", perPerson: 1, label: "volunteering pledges" },
    csrShare: 0,
  },
];

export function getItem(id: string): CatalogueItem | undefined {
  return CATALOGUE.find((c) => c.id === id);
}

export function getNonprofit(id: string | null | undefined): Nonprofit | undefined {
  return id ? NONPROFITS.find((n) => n.id === id) : undefined;
}

// ------------------------------------------------------- attendee generator

const FIRST = [
  "Aarav", "Diya", "Kabir", "Ishita", "Rohan", "Meera", "Arjun", "Sneha", "Vikram", "Ananya",
  "Karthik", "Pooja", "Nikhil", "Riya", "Siddharth", "Lakshmi", "Farhan", "Tara", "Aditya", "Nisha",
  "Sameer", "Kavya", "Rahul", "Zara", "Varun", "Divya", "Imran", "Shreya", "Manoj", "Asha",
];
const LAST = [
  "Sharma", "Iyer", "Khan", "Reddy", "Menon", "Gupta", "Nair", "Das", "Patel", "Rao",
  "Bose", "Kulkarni", "Fernandes", "Shetty", "Joshi", "Pillai", "Banerjee", "Singh", "Thomas", "Hegde",
];

/** Small deterministic PRNG so the same plan always shows the same names. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates `count` fictional attendees spread evenly across practices.
 * Practices fall back to generic functions when none are given.
 */
export function generateAttendees(count: number, practices: string[], seed = 42): Attendee[] {
  const pool = practices.length > 0 ? practices : GENERIC_FUNCTIONS;
  const rand = mulberry32(seed);
  const used = new Set<string>();
  const out: Attendee[] = [];
  for (let i = 0; i < count; i++) {
    let name = "";
    for (let tries = 0; tries < 20; tries++) {
      name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
      if (!used.has(name)) break;
    }
    if (used.has(name)) name = `${name} ${i}`;
    used.add(name);
    out.push({ name, practice: pool[i % pool.length] });
  }
  return out;
}
