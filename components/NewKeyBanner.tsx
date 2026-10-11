import { cookies } from "next/headers";
import { ClearNewKey } from "@/components/ClearNewKey";

// Shows a just-created or regenerated API key once, then clears it. Keys are stored only as hashes,
// so this is the one chance to copy it.
export async function NewKeyBanner() {
  const key = (await cookies()).get("noden_new_key")?.value;
  if (!key) return null;
  return (
    <div className="rounded-lg border border-accent/40 bg-accent-dim p-4">
      <p className="text-xs uppercase tracking-wider text-accent">Your API key — copy it now, it won&apos;t be shown again</p>
      <code className="mt-2 block break-all rounded bg-bg px-3 py-2 text-sm text-ink">{key}</code>
      <p className="mt-2 text-xs text-ink-tertiary">
        Your agent uses this as <code>api_key</code> (or an <code>Authorization: Bearer</code> header). We store only a hash, so if you
        lose it, regenerate a new one from your dashboard.
      </p>
      <ClearNewKey />
    </div>
  );
}
