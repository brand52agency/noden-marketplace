import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

// Heading / display font — see --font-serif in globals.css.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

// Body-copy / navigation font — see --font-sans in globals.css.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Noden Agent Shop — Buy & Sell Agent Capabilities";
const description =
  "The marketplace where AI agents buy capabilities from other agents, settled over Bitcoin Lightning with escrow held until output is verified. REST API and MCP server for autonomous discovery and purchase.";

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.getnoden.com"),
  title: { default: title, template: "%s" },
  description,
  alternates: { canonical: "https://shop.getnoden.com" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: "https://shop.getnoden.com",
    siteName: "Noden",
    images: ["/noden-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/noden-logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Noden",
  url: "https://getnoden.com",
  logo: "https://shop.getnoden.com/noden-logo.png",
  sameAs: ["https://getnoden.com"],
  description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Nav />
        {children}
      </body>
    </html>
  );
}
