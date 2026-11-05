import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import { MCP_URL, getKit, kitSkillViews } from "@/lib/kits";

export const metadata = { title: "My kit" };

export default async function MyKitPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ claimed?: string }> }) {
  const { id } = await params;
  const { claimed } = await searchParams;
  const kit = getKit(id);
  if (!kit) notFound();

  const session = await auth();
  const operatorId = session!.user.id;
  const claim = await db.kitClaim.findUnique({ where: { operatorId_kitId: { operatorId, kitId: kit.id } } });
  if (!claim) redirect(`/kits/${kit.id}`); // not theirs (yet): show the public page with the Get button

  const [skills, operator] = await Promise.all([
    kitSkillViews(kit),
    db.operator.findUnique({ where: { id: operatorId }, select: { apiKeyPrefix: true, apiKeyHash: true, creditBalance: true } }),
  ]);

  const box = "rounded-lg border border-border bg-surface p-5";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/operator/kits" className="text-sm text-accent hover:underline">← My kits</Link>
        <a href={`/api/kits/${kit.id}/download`} className="text-sm text-accent hover:underline">Download setup file (.md)</a>
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-ink">{kit.name}</h1>
      <p className="mt-2 text-ink-secondary">{kit.tagline}</p>

      {claimed === "1" && (
        <div className="mt-4 rounded-lg border border-success/40 bg-success-bg p-4 text-sm text-ink">
          Added to your account. Follow the three steps below to put it to work.
        </div>
      )}

      <section className={`mt-8 ${box}`}>
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">How this works</p>
        <p className="mt-3 text-sm text-ink-secondary">
          You use your own AI assistant, such as Claude or ChatGPT. This kit gives it Noden&apos;s tools and the instructions for the job. You chat with your assistant as
          you normally do; when it needs a tool, it calls Noden.
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          <strong className="font-medium text-ink">Credits pay for the tool calls only</strong> (about 5 to 15 credits each; the two free skills cost nothing). Your assistant&apos;s own usage is
          covered by your Claude or ChatGPT plan, not by Noden credits.
        </p>
      </section>

      <section className={`mt-6 ${box}`}>
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">Step 1 · Connect your assistant</p>
        <p className="mt-3 text-sm text-ink-secondary">Add Noden to your agent as an MCP server with this address, and send your API key as a Bearer token.</p>
        <code className="mt-3 block break-all rounded border border-border bg-bg px-3 py-2 text-sm text-ink">{MCP_URL}</code>
        <code className="mt-2 block break-all rounded border border-border bg-bg px-3 py-2 text-sm text-ink">Authorization: Bearer {operator?.apiKeyPrefix ? `${operator.apiKeyPrefix}…` : "<your API key>"}</code>
        <p className="mt-3 text-xs text-ink-tertiary">
          {operator?.apiKeyHash
            ? "We only store a hash of your key, so it can't be shown again. If you've lost it, "
            : "You don't have an active key. "}
          <Link href="/operator/dashboard" className="text-accent hover:underline">{operator?.apiKeyHash ? "regenerate one on your dashboard" : "create one on your dashboard"}</Link>.
          Step-by-step for Claude and ChatGPT: <a href="https://getnoden.com/get-an-agent" className="text-accent hover:underline">getnoden.com/get-an-agent</a>.
        </p>
      </section>

      <section className={`mt-6 ${box}`}>
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">Step 2 · Give your assistant its instructions</p>
        <p className="mt-3 text-sm text-ink-secondary">Paste this into your assistant&apos;s custom instructions (or a project&apos;s instructions). It tells the assistant which tools to use and how to behave.</p>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded border border-border bg-bg p-4 text-sm leading-relaxed text-ink">{kit.instructions}</pre>
        <div className="mt-3"><CopyPromptButton text={kit.instructions} label="Copy instructions" /></div>
      </section>

      <section className={`mt-6 ${box}`}>
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">Step 3 · Try a first task</p>
        <ul className="mt-3 flex flex-col gap-4">
          {kit.starterTasks.map((t) => (
            <li key={t.title} className="rounded border border-border bg-bg p-4">
              <p className="font-medium text-ink">{t.title}</p>
              <p className="mt-1 text-sm text-ink-secondary">{t.prompt}</p>
              <div className="mt-3"><CopyPromptButton text={t.prompt} /></div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-tertiary">Replace YOUR-SITE.com with your own website first.</p>
      </section>

      <section className="mt-8">
        <p className="mb-3 text-xs uppercase tracking-wider text-ink-tertiary">The skills in this kit</p>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <tbody>
              {skills.map((s) => (
                <tr key={s.handler} className="border-t border-border first:border-t-0">
                  <td className="px-4 py-3">
                    {s.listingId ? <Link href={`/marketplace/${s.listingId}`} className="font-medium text-ink hover:text-accent">{s.name}</Link> : <span className="font-medium text-ink">{s.name}</span>}
                    <p className="mt-0.5 text-ink-secondary">{s.why}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink-tertiary">{s.credits === 0 ? "Free" : `${s.credits} credits`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-secondary">
          You have <strong className="font-mono text-ink">{(operator?.creditBalance ?? 0).toLocaleString()}</strong> credits.{" "}
          <Link href="/operator/credits" className="text-accent hover:underline">Buy credits →</Link>
        </p>
      </section>
    </main>
  );
}
