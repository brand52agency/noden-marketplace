import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { promptCategories, SITE } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Free AI prompts for marketing, sales and support — Noden",
  description:
    "Copy-and-paste prompts with the fields to fill in and a real example of the output. Free to use with any AI assistant.",
  alternates: { canonical: `${SITE}/prompts` },
};

export default function PromptsIndex() {
  const categories = promptCategories();
  if (categories.length === 0) notFound();
  const total = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="eyebrow mb-5 w-fit">
        <span className="eyebrow-dot" />
        Free prompt library
      </p>
      <h1 className="text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">
        Prompts that work the first time.
      </h1>
      <p className="mt-6 max-w-2xl text-base text-ink-secondary sm:text-lg">
        {total} free prompts. Each one lists what to fill in and shows a real example of what comes back. Copy it into any
        AI assistant.
      </p>

      <div className="mt-12 flex flex-col gap-12">
        {categories.map((c) => (
          <section key={c.slug}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold text-ink">{c.name}</h2>
              <Link href={`/prompts/${c.slug}`} className="text-sm text-ink-secondary hover:text-ink">
                All {c.items.length}
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {c.items.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/prompts/${p.slug}`}
                    className="block h-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-ink-tertiary"
                  >
                    <p className="text-base font-medium text-ink">{p.title}</p>
                    <p className="mt-2 text-sm text-ink-secondary">{p.purpose}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
