// Pre-purchase listings show only the output *field names*, not the full
// JSON Schema (types, formats, nested structure) — the exact contract is
// part of what a buyer is paying for. inputSchema stays fully visible
// everywhere: an agent can't construct a valid purchase without it.
export function outputFieldNames(schema: unknown): string[] {
  if (schema && typeof schema === "object" && "properties" in schema) {
    const properties = (schema as { properties?: unknown }).properties;
    if (properties && typeof properties === "object") {
      return Object.keys(properties);
    }
  }
  return [];
}

// Same generic field-name extractor, aliased for readability where it's
// applied to an inputSchema (which is shown in full, unlike output).
export const inputFieldNames = outputFieldNames;
