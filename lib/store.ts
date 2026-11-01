import "server-only";
import fs from "node:fs";
import path from "node:path";

/** Tiny JSON persistence. Only active when DATA_DIR is set; otherwise memory only. */
function dir(): string | null {
  const d = process.env.DATA_DIR?.trim();
  return d ? d : null;
}

export function readJson<T>(name: string, fallback: T): T {
  const d = dir();
  if (!d) return fallback;
  try {
    return JSON.parse(fs.readFileSync(path.join(d, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(name: string, value: unknown): void {
  const d = dir();
  if (!d) return;
  try {
    fs.mkdirSync(d, { recursive: true });
    const file = path.join(d, name);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(value));
    fs.renameSync(tmp, file);
  } catch (err) {
    console.error(`[store] could not write ${name}:`, err);
  }
}
