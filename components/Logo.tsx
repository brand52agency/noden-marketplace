import Image from "next/image";

// Source asset is 1200x300 (4:1) — see public/agentix-logo.png.
const ASPECT_RATIO = 1200 / 300;

export default function Logo({ height = 32, className = "" }: { height?: number; className?: string }) {
  return (
    <Image
      src="/agentix-logo.png"
      alt="Agentix"
      width={Math.round(height * ASPECT_RATIO)}
      height={height}
      className={className}
      priority
    />
  );
}
