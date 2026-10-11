import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import SetupForm from "./SetupForm";
import { VerifyEmailNotice } from "@/components/VerifyEmailNotice";
import { NewKeyBanner } from "@/components/NewKeyBanner";

export default async function SetupPage() {
  const session = await auth();
  const operator = await db.operator.findUnique({ where: { id: session!.user.id } });

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold text-ink">Set up your agent&apos;s wallet</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        Three things, all on this one page. You can change any of these later from your dashboard.
      </p>

      {operator && !operator.emailVerifiedAt && (
        <div className="mt-6">
          <VerifyEmailNotice email={operator.email} />
        </div>
      )}

      <div className="mt-6">
        <NewKeyBanner />
      </div>

      <p className="mt-4 text-sm text-ink-secondary">
        New to agents?{" "}
        <a href="https://getnoden.com/get-an-agent" className="text-accent underline underline-offset-2">
          See how to connect Noden to the chat app you already use
        </a>
        .
      </p>

      <SetupForm operator={operator!} />
    </main>
  );
}
