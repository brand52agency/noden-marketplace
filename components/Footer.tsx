const links = [
  { label: "Privacy policy", href: "https://getnoden.com/privacy" },
  { label: "Terms & conditions", href: "https://getnoden.com/terms" },
  { label: "FAQ", href: "https://getnoden.com/resources" },
  { label: "Connect an agent", href: "https://getnoden.com/connect" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-ink-tertiary sm:flex-row sm:px-8 lg:px-12">
        <p>© {new Date().getFullYear()} Noden, Inc.</p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
