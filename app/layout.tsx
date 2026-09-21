import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Nav from "@/components/Nav";

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Nav />
        {children}
      </body>
    </html>
  );
}
