import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCars } from "@/components/home/featured-cars";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { HowItWorks } from "@/components/home/how-it-works";
import { AirportSection } from "@/components/home/airport-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { OffersSection } from "@/components/home/offers-section";
import { FaqPreview } from "@/components/home/faq-preview";
import { ContactCta } from "@/components/home/contact-cta";
import { getPublicSettings } from "@/lib/settings";

async function getHomeData() {
  const [featuredCars, testimonials, offers, faqItems, locations, homepageSettings, settings] = await Promise.all([
    prisma.car.findMany({ where: { isFeatured: true, isActive: true }, include: { images: { where: { isPrimary: true } }, category: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.testimonial.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.offer.findMany({ where: { isActive: true, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.faqItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.location.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.siteSetting.findMany({ where: { group: "homepage" } }),
    getPublicSettings(),
  ]);

  const homepageContent = Object.fromEntries(homepageSettings.map((item) => [item.key, item.value]));
  return { featuredCars, testimonials, offers, faqItems, locations, homepageContent, settings };
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "home" } });
  return {
    title: seo?.title ?? "AutoKos — Car Rental in Kosovo",
    description: seo?.description ?? "Rent a car in Kosovo with AutoKos. Best rates, modern fleet, airport pickup, no hidden fees.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "AutoKos — Car Rental in Kosovo",
      description: seo?.ogDescription ?? seo?.description ?? "Rent a car in Kosovo with AutoKos. Best rates, modern fleet, airport pickup.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function HomePage() {
  const { featuredCars, testimonials, offers, faqItems, locations, homepageContent, settings } = await getHomeData();

  return (
    <>
      <HeroSection locations={locations} content={homepageContent} settings={settings} />
      <FeaturedCars cars={featuredCars} content={homepageContent} />
      <WhyChooseUs content={homepageContent} />
      <HowItWorks content={homepageContent} />
      {offers.length > 0 && <OffersSection offers={offers} content={homepageContent} />}
      <AirportSection content={homepageContent} settings={settings} />
      <TestimonialsSection testimonials={testimonials} content={homepageContent} />
      <FaqPreview items={faqItems} />
      <ContactCta content={homepageContent} settings={settings} />
    </>
  );
}
