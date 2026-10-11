// Builds a minimal input that satisfies a JSON schema (required fields only), for tests.
type S = { type?: string; enum?: unknown[]; minLength?: number; maxLength?: number; minimum?: number; minItems?: number; items?: S; properties?: Record<string, S>; required?: string[] };
export function sampleValue(s: S | undefined): unknown {
  if (!s) return "x";
  if (Array.isArray(s.enum)) return s.enum[0];
  switch (s.type) {
    case "number": case "integer": return Math.max(s.minimum ?? 1, 1);
    case "boolean": return true;
    case "array": return Array.from({ length: Math.max(s.minItems ?? 1, 1) }, () => sampleValue(s.items));
    case "object": return Object.fromEntries((s.required ?? []).map((k) => [k, sampleValue(s.properties?.[k])]));
    default: return "https://example.com/x".padEnd(Math.min(s.minLength ?? 1, s.maxLength ?? 1000), "x");
  }
}
export const sampleInput = (schema: unknown) => sampleValue(schema as S) as Record<string, unknown>;
