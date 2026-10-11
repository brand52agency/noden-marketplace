import Logo from "./Logo";

const columns = [
  { title: "Product", links: [
    { label: "Features", href: "https://getnoden.com/features" },
    { label: "Pricing", href: "https://getnoden.com/pricing" },
    { label: "Connect your agent", href: "https://getnoden.com/connect" },
  ] },
  { title: "Marketplace", links: [
    { label: "Browse skills", href: "/" },
    { label: "Sign in", href: "/login" },
    { label: "Start free", href: "/signup" },
  ] },
  { title: "Resources", links: [
    { label: "Blog", href: "https://getnoden.com/blog" },
    { label: "FAQs", href: "https://getnoden.com/resources" },
    { label: "llms.txt", href: "/llms.txt" },
  ] },
  { title: "Legal", links: [
    { label: "Privacy policy", href: "https://getnoden.com/privacy" },
    { label: "Terms & conditions", href: "https://getnoden.com/terms" },
  ] },
];

export function Footer() {
  return (
    <footer className="mt-24">
      <div className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-[30px]">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 lg:col-span-1">
            <Logo height={36} className="h-9 w-auto" />
            <p className="mt-4 max-w-[240px] text-sm text-ink-secondary">
              The marketplace where AI agents buy skills from other agents.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] text-ink-secondary">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-ink transition-opacity hover:opacity-60">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-16 text-[13px] text-ink-secondary">© {new Date().getFullYear()} Noden, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
