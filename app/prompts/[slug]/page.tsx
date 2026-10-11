import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import { getCategory, getPrompt, promptCategories, publishedPrompts, SITE } from "@/lib/catalog";

// One route serves both /prompts/<category> and /prompts/<prompt>. scripts/catalog-check fails the
// build if a prompt slug ever collides with a category slug.
export function generateStaticParams() {
  return [...promptCategories().map((c) => ({ slug: c.slug })), ...publishedPrompts().map((p) => ({ slug: p.slug }))];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prompt = getPrompt(slug);
  if (prompt) {
    const title = `${prompt.title} — free prompt | Noden`;
    return {
      title,
      description: prompt.purpose,
      alternates: { canonical: `${SITE}/prompts/${slug}` },
      openGraph: { title, description: prompt.purpose, url: `${SITE}/prompts/${slug}`, siteName: "Noden" },
    };
  }
  const category = getCategory(slug);
  if (category) {
    const title = `Free ${category.name.toLowerCase()} prompts | Noden`;
    const description = `${category.items.length} free ${category.name.toLowerCase()} prompts, each with fields to fill in and a real example.`;
    return { title, description, alternates: { canonical: `${SITE}/prompts/${slug}` } };
  }
  return { title: "Not found — Noden" };
}

export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = getPrompt(slug);
  const category = prompt ? null : getCategory(slug);

  if (category) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/prompts" className="text-sm text-ink-secondary hover:text-ink">
          ← All prompts
        </Link>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">
          {category.name} prompts
        </h1>
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {category.items.map((p) => (
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
      </main>
    );
  }

  if (!prompt) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: prompt.title,
    description: prompt.purpose,
    url: `${SITE}/prompts/${prompt.slug}`,
    isAccessibleForFree: true,
    audience: { "@type": "Audience", audienceType: prompt.audience },
    genre: prompt.category,
    author: { "@type": "Organization", name: "Noden", url: "https://getnoden.com" },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href={`/prompts/${prompt.category ? getCategorySlug(prompt.category) : ""}`} className="text-sm text-ink-secondary hover:text-ink">
        ← {prompt.category}
      </Link>
      <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">
        {prompt.title}
      </h1>
      <p className="mt-5 text-base text-ink-secondary sm:text-lg">{prompt.purpose}</p>
      <p className="mt-2 text-sm text-ink-tertiary">For {prompt.audience.toLowerCase()}</p>

      <h2 className="mt-12 text-lg font-semibold text-ink">Fill in</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {prompt.fields.map((f) => (
          <li key={f.name} className="text-sm text-ink">
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[13px]">{`{{${f.name}}}`}</code>{" "}
            <span className="text-ink-secondary">{f.help}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink">The prompt</h2>
        <CopyPromptButton text={prompt.prompt} />
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-border bg-surface p-5 font-mono text-[13px] leading-relaxed text-ink">
        {prompt.prompt}
      </pre>

      {prompt.exampleOutput && (
        <>
          <h2 className="mt-12 text-lg font-semibold text-ink">Example</h2>
          <p className="mt-1 text-sm text-ink-secondary">A real run of this prompt with made-up inputs.</p>
          {prompt.exampleInputs.map((i) => (
            <div key={i.name} className="mt-4">
              <p className="font-mono text-[13px] text-ink-secondary">{`{{${i.name}}}`}</p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl border border-border bg-bg p-4 text-sm text-ink">{i.value}</p>
            </div>
          ))}
          <p className="mt-6 text-sm font-medium text-ink">Output</p>
          <div className="mt-1 whitespace-pre-wrap rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-ink">
            {prompt.exampleOutput}
          </div>
        </>
      )}

      <div className="mt-14 rounded-2xl border border-border bg-surface p-6">
        <p className="text-base font-medium text-ink">Want an agent to do this for you?</p>
        <p className="mt-1 text-sm text-ink-secondary">
          Noden is a marketplace where AI agents buy ready-made skills per call. Your first call is free once you confirm your
          email.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-ink underline underline-offset-4">
          Browse the marketplace
        </Link>
      </div>
    </main>
  );
}

function getCategorySlug(name: string) {
  return promptCategories().find((c) => c.name === name)?.slug ?? "";
}
