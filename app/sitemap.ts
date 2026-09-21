import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await db.listing.findMany({
    where: { active: true },
    select: { id: true, createdAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://shop.getnoden.com/", changeFrequency: "hourly", priority: 1 },
    { url: "https://shop.getnoden.com/signup", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://shop.getnoden.com/login", changeFrequency: "yearly", priority: 0.2 },
  ];

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `https://shop.getnoden.com/marketplace/${listing.id}`,
    lastModified: listing.createdAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...listingRoutes];
}
