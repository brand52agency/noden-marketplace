import Image from "next/image";
import type { ReactNode } from "react";

export const BACKGROUNDS = {
  sky: "/backgrounds/sky.jpg",
  coral: "/backgrounds/coral.jpg",
  warm: "/backgrounds/warm.jpg",
  sunrise: "/backgrounds/sunrise.jpg",
  dusk: "/backgrounds/dusk.jpg",
} as const;

// A rounded panel with a soft gradient photo behind it and content layered on top.
export function GradientPanel({
  bg,
  className = "",
  children,
  priority = false,
  sizes = "100vw",
}: {
  bg: keyof typeof BACKGROUNDS;
  className?: string;
  children?: ReactNode;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className={`panel relative isolate ${className}`}>
      <Image src={BACKGROUNDS[bg]} alt="" fill sizes={sizes} priority={priority} className="-z-10 object-cover" />
      {children}
    </div>
  );
}
