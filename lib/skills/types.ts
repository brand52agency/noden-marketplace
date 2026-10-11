// Code-backed skills: listings whose result comes from a real lookup (a fetch, a registry, a
// published feed) instead of the model. A listing opts in through its `handler` key.
export type SkillInput = Record<string, unknown>;
export type SkillOutput = Record<string, unknown>;

export type SkillHandler = {
  // Runs before any order exists or any outside call is made. Throw SkillInputError to reject with a 422.
  validate?: (input: SkillInput) => void;
  run: (input: SkillInput) => Promise<SkillOutput>;
};

export class SkillInputError extends Error {}

export const isoDate = (d = new Date()) => d.toISOString();

// Fetch from a fixed, trusted API host (never a caller-supplied URL: those go through safeFetch).
export async function trustedJson(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), headers: { accept: "application/json", "user-agent": "NodenBot/1.0 (+https://getnoden.com)", ...(init.headers ?? {}) } });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* not JSON */
  }
  return { status: res.status, json };
}

export const str = (v: unknown, max = 500): string => (typeof v === "string" ? v.slice(0, max) : "");
