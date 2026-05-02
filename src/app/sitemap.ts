export const dynamic = "force-dynamic";
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autokos.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, cancellationPage] = await Promise.all([
    prisma.car.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    // Only include /cancellation-policy when admin has created the legal page.
    // Until then the page redirects to /rental-policy, which search engines treat
    // as a redirect loop — omitting it avoids crawl waste and index confusion.
    prisma.legalPage.findUnique({
      where: { slug: "cancellation-policy" },
      select: { updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/fleet`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/airport-rental`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/long-term`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/insurance`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/rental-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    ...(cancellationPage
      ? [{ url: `${BASE_URL}/cancellation-policy`, lastModified: cancellationPage.updatedAt, changeFrequency: "yearly" as const, priority: 0.4 }]
      : []),
  ];

  const carPages: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${BASE_URL}/fleet/${car.slug}`,
    lastModified: car.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...carPages];
}
