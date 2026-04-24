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
  const [featuredCars, testimonials, offers, faqItems, locations, homepageSettings, settings, activeCarCount] = await Promise.all([
    prisma.car.findMany({
      where: { isFeatured: true, isActive: true },
      select: {
        id: true, slug: true, name: true, brand: true, model: true, year: true,
        seats: true, transmission: true, fuelType: true, hasAC: true,
        isFeatured: true, pricePerDay: true, pricePerWeek: true, pricePerMonth: true,
        mileageLimit: true,
        images: { where: { isPrimary: true }, select: { id: true, url: true, alt: true, isPrimary: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    prisma.testimonial.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.offer.findMany({ where: { isActive: true, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.faqItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.location.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.siteSetting.findMany({ where: { group: "homepage" } }),
    getPublicSettings(),
    prisma.car.count({ where: { isActive: true } }),
  ]);

  const homepageContent = Object.fromEntries(homepageSettings.map((item) => [item.key, item.value]));
  return { featuredCars, testimonials, offers, faqItems, locations, homepageContent, settings, activeCarCount };
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
  const { featuredCars, testimonials, offers, faqItems, locations, homepageContent, settings, activeCarCount } = await getHomeData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CarRental",
        "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? "https://autokos.com"}/#organization`,
        name: settings.businessName,
        description: settings.businessDescription,
        url: process.env.NEXT_PUBLIC_APP_URL ?? "https://autokos.com",
        telephone: settings.phone,
        email: settings.supportEmail,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Rr. Nënë Tereza, Nr. 45",
          addressLocality: "Prishtinë",
          postalCode: "10000",
          addressCountry: "XK",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 42.6629,
          longitude: 21.1655,
        },
        openingHours: "Mo-Su 08:00-20:00",
        priceRange: "€€",
        currenciesAccepted: "EUR",
        paymentAccepted: "Cash, Credit Card",
        areaServed: {
          "@type": "Country",
          name: "Kosovo",
        },
        sameAs: [
          settings.facebookUrl,
          settings.instagramUrl,
        ].filter(Boolean),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection locations={locations} content={homepageContent} settings={settings} activeCarCount={activeCarCount} />
      <FeaturedCars cars={featuredCars as unknown as import("@/components/cars/car-card").CarCardData[]} content={homepageContent} />
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
