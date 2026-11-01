import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AiPlanSchema } from "@/lib/schema";
import { SYSTEM_PROMPT, userPrompt } from "@/lib/prompt";
import type { Pickers } from "@/lib/types";

export const MODEL = "claude-sonnet-5-5";
export const TIMEOUT_MS = 8000;

let client: Anthropic | null = null;

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function getClient(): Anthropic {
  // No retries: a retry would blow the 8-second budget and double the cost.
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: TIMEOUT_MS });
  return client;
}

/**
 * One Messages API call. Returns the raw parsed JSON (validated by the caller).
 * Throws on timeout, API error, refusal, truncation or non-JSON output.
 */
export async function askClaude(brief: string, pickers: Pickers): Promise<unknown> {
  const res = await getClient().messages.create(
    {
      model: MODEL,
      max_tokens: 2000,
      // Thinking off and low effort: this is a small, well-specified choice, and we have 8 seconds.
      thinking: { type: "between_tools" },
      output_config: { effort: "low", format: zodOutputFormat(AiPlanSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(brief, pickers) }],
    },
    { timeout: TIMEOUT_MS, signal: AbortSignal.timeout(TIMEOUT_MS) },
  );

  if (res.stop_reason === "refusal") throw new Error("model refused");
  if (res.stop_reason === "max_tokens") throw new Error("model output truncated");
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("no text in response");
  return JSON.parse(text.text);
}
