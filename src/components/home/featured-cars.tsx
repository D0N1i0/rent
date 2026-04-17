// src/components/home/featured-cars.tsx
"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CarCard } from "@/components/cars/car-card";
import type { CarCardData } from "@/components/cars/car-card";

export function FeaturedCars({ cars, content }: { cars: CarCardData[]; content?: Record<string, string> }) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="section-heading">{content?.featured_cars_title ?? "Featured Vehicles"}</h2>
            <p className="section-subheading mt-2">{content?.featured_cars_subtitle ?? "Our most popular rental cars, chosen by thousands of customers"}</p>
          </div>
          <Link href="/fleet" className="btn-outline whitespace-nowrap text-sm">
            View All Cars <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
        {cars.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No featured cars at the moment. <Link href="/fleet" className="text-navy-900 underline">Browse all cars.</Link></p>
          </div>
        )}
      </div>
    </section>
  );
}
