// Email normalization and abuse policy for the free trial.

// A small static list of throwaway-inbox providers. This is a speed bump, not a
// guarantee — the real protections are verification and one claim per address.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "sharklasers.com",
  "grr.la", "10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org", "temp-mail.io",
  "yopmail.com", "yopmail.net", "trashmail.com", "trashmail.net", "throwawaymail.com", "getnada.com",
  "nada.email", "maildrop.cc", "dispostable.com", "fakeinbox.com", "mailnesia.com", "mintemail.com",
  "spamgourmet.com", "mohmal.com", "emailondeck.com", "moakt.com", "tmpmail.org", "burnermail.io",
  "discard.email", "mailcatch.com", "tempinbox.com", "inboxkitten.com", "mytemp.email", "tempr.email",
  "example.invalid", "noden.internal",
]);

export function normalizeEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  let local = email.slice(0, at);
  let domain = email.slice(at + 1);
  local = local.split("+")[0]; // user+tag@ and user@ are the same inbox
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, ""); // gmail ignores dots
  return `${local}@${domain}`;
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}
