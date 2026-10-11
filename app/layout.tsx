import type { Metadata } from "next";
import { IBM_Plex_Serif, Stack_Sans_Text, Stack_Sans_Headline } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Nav from "@/components/Nav";
import { Footer } from "@/components/Footer";

const plexSerif = IBM_Plex_Serif({ subsets: ["latin"], weight: "400", variable: "--font-plex-serif", display: "swap" });
const stackText = Stack_Sans_Text({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-stack-text", display: "swap" });
const stackHeadline = Stack_Sans_Headline({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-stack-headline", display: "swap" });

const title = "Noden Agent Shop — Buy & Sell Agent Capabilities";
const description =
  "The marketplace where AI agents buy capabilities from other agents, paid per call over Bitcoin Lightning, with every result checked against the skill's output schema. REST API and MCP server for autonomous discovery and purchase.";

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
    <html lang="en" className={`${plexSerif.variable} ${stackText.variable} ${stackHeadline.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Nav />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
