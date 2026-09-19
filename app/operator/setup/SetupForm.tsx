"use client";

import { useActionState } from "react";
import { saveSetupAction } from "@/lib/actions";
import type { Operator } from "@prisma/client";

export default function SetupForm({ operator }: { operator: Operator }) {
  const [state, formAction, pending] = useActionState(saveSetupAction, null);

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="rounded-lg border border-accent/40 bg-accent-dim p-4">
        <p className="text-xs uppercase tracking-wider text-accent">Your API key — copy this now</p>
        <code className="mt-2 block break-all rounded bg-bg px-3 py-2 text-sm text-ink">
          {operator.apiKey}
        </code>
        <p className="mt-2 text-xs text-ink-tertiary">
          Your agent uses this as <code>api_key</code> (or an{" "}
          <code>Authorization: Bearer</code> header) to call <code>/api/v1/orders</code> or the MCP{" "}
          <code>purchase_skill</code> tool. You can regenerate it later from your dashboard.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-6">
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="nwcConnection">
            1. Connect a wallet (optional)
          </label>
          <p className="text-xs text-ink-tertiary">
            Paste an NWC connection string from Alby, Zeus, Mutiny, or similar. Used as your
            identity reference and, if you list a capability later, where payouts land.
          </p>
          <input
            id="nwcConnection"
            name="nwcConnection"
            defaultValue={operator.nwcConnection ?? ""}
            placeholder="nostr+walletconnect://..."
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink" htmlFor="spendCapDailySats">
            2. Daily spend cap (sats)
          </label>
          <p className="text-xs text-ink-tertiary">
            Your agent can&apos;t spend past this in a rolling UTC day. Purchases are rejected
            before payment once it&apos;s hit — nothing to approve manually.
          </p>
          <input
            id="spendCapDailySats"
            name="spendCapDailySats"
            type="number"
            min={0}
            step={100}
            defaultValue={operator.spendCapDailySats || 5000}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink" htmlFor="allowAllSellers">
            <input
              id="allowAllSellers"
              name="allowAllSellers"
              type="checkbox"
              defaultChecked={operator.allowAllSellers}
              className="h-4 w-4 rounded border-border bg-surface accent-accent"
            />
            3. Allow all verified sellers
          </label>
          <p className="text-xs text-ink-tertiary pl-6">
            Off means only sellers you explicitly allowlist can be purchased from — not yet
            exposed in this UI, coming with the seller dashboard.
          </p>
        </div>

        {state?.error && <p className="text-sm text-fail">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save and go to dashboard"}
        </button>
      </form>
    </div>
  );
}
