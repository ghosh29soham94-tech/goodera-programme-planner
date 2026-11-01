// Impact report, computed from the plan with FIXED SAMPLE RATES (no AI, no real data).
import type { Programme } from "@/lib/programme";

export const SAMPLE_RATES = {
  attendance: 0.92, // share of invited people who attend
  satisfaction: 4.6, // out of 5
  wouldRecommend: 0.88,
  feelMoreConnected: 0.81,
  enpsChange: 9, // points
  newConnectionsLeadership: 5, // new cross-practice contacts per attendee, team-based formats
  newConnectionsOther: 3,
  followUpsPerAttendee: 0.3, // cross-practice follow-up conversations within 30 days
  pledgeFollowThrough: 0.45, // pledges acted on within 90 days
};

export interface Metric {
  label: string;
  value: string;
  note?: string;
}

export interface ImpactReport {
  attendees: number;
  hasLeadership: boolean;
  business: Metric[];
  hr: Metric[];
  csr: Metric[];
  /** One line per block for the CSR tab and the card. */
  outputs: { name: string; units: number; label: string; nonprofit: string | null }[];
  volunteerHours: number;
  nonprofits: string[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const num = (n: number) => Math.round(n).toLocaleString("en-US");

export function computeImpact(prog: Programme): ImpactReport {
  const r = SAMPLE_RATES;
  const attendees = Math.round(prog.groupSize * r.attendance);
  const hasLeadership = prog.blocks.some((b) => b.item.format === "leadership-day");
  const leadershipTeams = hasLeadership ? Math.max(1, Math.round(attendees / 8)) : 0;
  const connections = attendees * (hasLeadership ? r.newConnectionsLeadership : r.newConnectionsOther);

  const outputs = prog.blocks.map((b) => ({
    name: b.item.name,
    units: Math.floor(b.item.impact.perPerson * attendees),
    label: b.item.impact.label,
    nonprofit: b.nonprofit?.name ?? null,
  }));
  const volunteerHours = Math.round(attendees * prog.hours);
  const nonprofits = [...new Set(prog.blocks.map((b) => b.nonprofit?.name).filter(Boolean))] as string[];
  const pledges = prog.blocks.some((b) => b.item.format === "close") ? attendees : 0;

  const business: Metric[] = [
    { label: "New cross-practice connections", value: num(connections), note: `${hasLeadership ? r.newConnectionsLeadership : r.newConnectionsOther} per attendee` },
    { label: "Follow-up conversations across practices", value: num(attendees * r.followUpsPerAttendee), note: "within 30 days" },
    ...(hasLeadership
      ? [
          { label: "Recommendations presented to the nonprofit", value: num(leadershipTeams), note: "one per team" },
          { label: "Ideas taken into a nonprofit pilot", value: "1", note: "chosen by the nonprofit" },
        ]
      : []),
    { label: "Cost per person who attended", value: `$${num(prog.total / Math.max(1, attendees))}` },
  ];

  const hr: Metric[] = [
    { label: "Attendance", value: pct(r.attendance), note: `${num(attendees)} of ${num(prog.groupSize)}` },
    { label: "Satisfaction", value: `${r.satisfaction} / 5` },
    { label: "Would recommend", value: pct(r.wouldRecommend) },
    { label: "Feel more connected to colleagues", value: pct(r.feelMoreConnected) },
    { label: "Team eNPS change", value: `+${r.enpsChange} pts`, note: "pulse survey, 2 weeks after" },
  ];

  const csr: Metric[] = [
    { label: "Volunteer hours", value: num(volunteerHours) },
    { label: "Nonprofits supported", value: num(nonprofits.length), note: nonprofits.join(", ") || undefined },
    { label: "CSR-countable spend", value: `$${num(prog.csrTotal)}` },
    ...(pledges ? [{ label: "Volunteering pledges acted on", value: num(pledges * r.pledgeFollowThrough), note: `${pct(r.pledgeFollowThrough)} within 90 days` }] : []),
  ];

  return { attendees, hasLeadership, business, hr, csr, outputs, volunteerHours, nonprofits };
}
