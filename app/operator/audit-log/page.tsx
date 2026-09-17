import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AuditLogPage() {
  const session = await auth();
  const entries = await db.auditLogEntry.findMany({
    where: { operatorId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Audit log</h1>
      <p className="mt-2 text-sm text-ink-secondary">Every search, purchase, verification, dispute, and payout tied to your account.</p>

      <div className="mt-8 flex flex-col gap-2">
        {entries.length === 0 && <p className="text-sm text-ink-tertiary">Nothing logged yet.</p>}
        {entries.map((e) => (
          <div key={e.id} className="rounded-lg bg-surface p-3 border border-border text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize text-ink">{e.action}</span>
              <span className="text-xs text-ink-tertiary">{e.createdAt.toLocaleString()}</span>
            </div>
            <pre className="mt-1 overflow-x-auto text-xs text-ink-tertiary">
              {JSON.stringify(e.detail)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
