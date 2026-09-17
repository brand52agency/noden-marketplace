import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export type VerifyResult = { valid: boolean; errors?: string };

// Structural verification only (v1, per build spec §6): does the
// output conform to the listing's declared outputSchema — types,
// required fields present? No subjective quality judgment. An
// LLM-as-judge or human-review escalation path is a deliberate v2.
export function verifyAgainstSchema(value: unknown, schema: object): VerifyResult {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(value) as boolean;
    return {
      valid,
      errors: valid ? undefined : ajv.errorsText(validate.errors, { separator: "; " }),
    };
  } catch (err) {
    return { valid: false, errors: err instanceof Error ? err.message : "invalid schema" };
  }
}
