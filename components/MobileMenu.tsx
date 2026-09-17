"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

export function MobileMenu({
  links,
  children,
}: {
  links: { label: string; href: string }[];
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Portal target (document.body) only exists client-side — this is the
    // standard SSR-safe mount gate, not state synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer = (
    <div
      className={`fixed inset-0 z-[60] lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute top-0 right-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-border bg-surface px-6 py-6 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="ml-auto flex items-center justify-center rounded-full border border-border p-2 text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        <nav className="mt-8 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-base text-ink transition-colors hover:bg-surface-raised"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">{children}</div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex items-center justify-center rounded-full border border-border p-2 text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
