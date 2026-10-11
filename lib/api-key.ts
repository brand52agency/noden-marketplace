import { createHash, randomBytes } from "crypto";

// A new key. Show it to the owner once; only its hash is ever stored.
export function generateApiKey(): string {
  return `agx_${randomBytes(24).toString("hex")}`;
}

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

// The columns to store for a key: the hash and a short prefix, never the key itself.
export function apiKeyFields(key: string) {
  return { apiKeyHash: hashApiKey(key), apiKeyPrefix: key.slice(0, 8), apiKeyCreatedAt: new Date() };
}

// What to put in the database when a key is revoked.
export const REVOKED_KEY_FIELDS = { apiKey: null, apiKeyHash: null, apiKeyPrefix: null, apiKeyCreatedAt: null };
