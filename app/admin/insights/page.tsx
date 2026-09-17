import { getInsights, INSIGHTS_CONFIGURED } from "@/lib/insights";
import { regenerateInsightsAction } from "@/lib/actions";

export default async function AdminInsightsPage() {
  const insights = await getInsights();

  return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-ink">Insights</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          The last 30 days of orders, summarized and sent to Claude for concrete recommendations.
        </p>

        {!INSIGHTS_CONFIGURED && (
          <div className="mt-4 rounded-lg border border-accent/40 bg-accent-dim p-4 text-sm text-ink">
            Set <code>ANTHROPIC_API_KEY</code> in <code>.env</code> to enable real recommendations.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-ink-tertiary">
          <span>
            {insights.cached ? "Cached" : "Freshly generated"} · {insights.generatedAt.toLocaleString()}
          </span>
          <form action={regenerateInsightsAction}>
            <button type="submit" className="text-accent hover:underline">Regenerate now</button>
          </form>
        </div>

        <div className="mt-4 whitespace-pre-wrap rounded-lg bg-surface p-5 border border-border text-sm leading-relaxed text-ink">
          {insights.content}
        </div>
      </main>
  );
}
