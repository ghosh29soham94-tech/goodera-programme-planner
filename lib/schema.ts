// zod schemas shared by client and server.
import { z } from "zod";
import { CATALOGUE } from "@/data/demo";
import { CAUSES, SENIORITIES } from "@/lib/types";

export const BRIEF_MIN = 20;
export const BRIEF_MAX = 600;
export const GROUP_MIN = 5;
export const GROUP_MAX = 5000;

// ---------------------------------------------------------------- request

export const PickersSchema = z.object({
  groupSize: z.number().int().min(GROUP_MIN).max(GROUP_MAX).nullish(),
  seniority: z.enum(SENIORITIES).nullish(),
  location: z.string().trim().max(60).nullish(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  budgetPerHead: z.number().min(1).max(5000).nullish(),
  cause: z.enum(CAUSES).nullish(),
});

export const PlanRequestSchema = z.object({
  brief: z.string().trim().min(BRIEF_MIN).max(BRIEF_MAX),
  pickers: PickersSchema.default({}),
  regenerate: z.boolean().optional(),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;

// ------------------------------------------------------------- AI contract

const CATALOGUE_IDS = CATALOGUE.map((c) => c.id) as [string, ...string[]];

/**
 * The JSON the model must return. Also sent as the structured-output format.
 * `catalogueId` is an enum, so any id not in the catalogue fails validation.
 */
export const AiPlanSchema = z.object({
  status: z.enum(["ok", "out_of_scope"]),
  title: z.string(),
  understood: z.object({
    goal: z.string(),
    groupSize: z.number(),
    seniority: z.enum(SENIORITIES),
    location: z.string(),
    durationHours: z.number(),
    budgetPerHead: z.number().nullable(),
    cause: z.enum(CAUSES).nullable(),
    practices: z.array(z.string()),
  }),
  assumptions: z.array(z.string()),
  blocks: z.array(
    z.object({
      catalogueId: z.enum(CATALOGUE_IDS),
      start: z.string(),
      reason: z.string(),
    }),
  ),
  notes: z.array(z.string()),
});

export type AiPlan = z.infer<typeof AiPlanSchema>;
