"use client";

import { useEffect, useRef } from "react";

// Same effect as getnoden.com's hero: a dot grid that reveals denser
// money/Bitcoin glyphs in a radius around the cursor.
const SYMBOLS = ["₿", "₿", "₿", "$", "¢", "€"];
const CELL = 26; // matches .dot-grid's background-size elsewhere on the site
const REVEAL_RADIUS = 170;

export function MoneyGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener("mousemove", onMove);
    // Canvas itself is pointer-events-none (clicks must pass through to the
    // content above it), so track the cursor leaving the window instead.
    document.addEventListener("mouseleave", onLeave);

    let raf = 0;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / CELL);
      const rows = Math.ceil(height / CELL);

      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = col * CELL;
          const y = row * CELL;
          const dist = Math.hypot(x - mouse.x, y - mouse.y);

          if (dist < REVEAL_RADIUS) {
            const t = 1 - dist / REVEAL_RADIUS;
            const symbol = SYMBOLS[(row * 7 + col * 13) % SYMBOLS.length];
            ctx!.font = `${10 + t * 13}px var(--font-geist-mono), ui-monospace, monospace`;
            ctx!.fillStyle = `rgba(238, 104, 51, ${0.2 + t * 0.7})`;
            ctx!.textAlign = "center";
            ctx!.textBaseline = "middle";
            ctx!.fillText(symbol, x, y);
          } else {
            ctx!.fillStyle = "rgba(255, 255, 255, 0.14)";
            ctx!.beginPath();
            ctx!.arc(x, y, 1, 0, Math.PI * 2);
            ctx!.fill();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 85%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 85%)",
      }}
    />
  );
}
