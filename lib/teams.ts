// Team mixing, done in code (no AI).
import { GENERIC_FUNCTIONS, generateAttendees } from "@/data/demo";
import type { Attendee } from "@/lib/types";

export interface Team {
  name: string;
  members: Attendee[];
  practices: Record<string, number>;
}

/** Stable small hash so the same brief always gets the same names. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Splits people into teams of about `size`, mixing practices:
 * sort by practice, then deal round-robin so each team gets a spread.
 */
export function mixTeams(people: Attendee[], size = 8): Team[] {
  const count = Math.max(1, Math.round(people.length / size));
  const sorted = [...people].sort((a, b) => a.practice.localeCompare(b.practice));
  const teams: Team[] = Array.from({ length: count }, (_, i) => ({ name: `Team ${i + 1}`, members: [], practices: {} }));
  sorted.forEach((p, i) => {
    const t = teams[i % count];
    t.members.push(p);
    t.practices[p.practice] = (t.practices[p.practice] ?? 0) + 1;
  });
  return teams;
}

export function teamsForGroup(groupSize: number, practices: string[], seed: number, size = 8) {
  const usedPractices = practices.length > 0 ? practices : GENERIC_FUNCTIONS;
  const people = generateAttendees(groupSize, usedPractices, seed);
  return { teams: mixTeams(people, size), practices: usedPractices, generic: practices.length === 0 };
}
