// src/components/cars/fleet-client.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";
import { CarCard } from "./car-card";
import { calculateRentalDays } from "@/lib/utils";
import type { Car, CarImage, CarCategory, Location } from "@prisma/client";
import { cn } from "@/lib/utils";

type CarWithDetails = Car & { images: CarImage[]; category: CarCategory };

interface FleetClientProps {
  cars: CarWithDetails[];
  categories: CarCategory[];
  locations: Location[];
}

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "seats_asc", label: "Seats: Low to High" },
];

export function FleetClient({ cars, categories, locations }: FleetClientProps) {
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [search, setSearch] = useState("");

  // Booking params from URL
  const pickupLocationId = searchParams.get("pickupLocationId") ?? "";
  const dropoffLocationId = searchParams.get("dropoffLocationId") ?? pickupLocationId;
  const pickupDate = searchParams.get("pickupDate") ?? "";
  const pickupTime = searchParams.get("pickupTime") ?? "";
  const returnDate = searchParams.get("returnDate") ?? "";
  const returnTime = searchParams.get("returnTime") ?? "";

  const durationDays = useMemo(() => {
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) return 0;
    const pickup = new Date(`${pickupDate}T${pickupTime}:00`);
    const ret = new Date(`${returnDate}T${returnTime}:00`);
    return calculateRentalDays(pickup, ret);
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  // Filters
  const [filters, setFilters] = useState({
    categorySlug: "",
    transmission: "",
    fuelType: "",
    hasAC: false,
    maxPrice: 300,
    minSeats: 0,
  });

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ categorySlug: "", transmission: "", fuelType: "", hasAC: false, maxPrice: 300, minSeats: 0 });
    setSearch("");
    setSort("recommended");
  };

  const activeFilterCount = [
    filters.categorySlug,
    filters.transmission,
    filters.fuelType,
    filters.hasAC,
    filters.maxPrice < 300,
    filters.minSeats > 0,
  ].filter(Boolean).length;

  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.brand.toLowerCase().includes(s) ||
          c.model.toLowerCase().includes(s) ||
          c.category.name.toLowerCase().includes(s)
      );
    }

    // Category
    if (filters.categorySlug) {
      result = result.filter((c) => c.category.slug === filters.categorySlug);
    }

    // Transmission
    if (filters.transmission) {
      result = result.filter((c) => c.transmission === filters.transmission);
    }

    // Fuel
    if (filters.fuelType) {
      result = result.filter((c) => c.fuelType === filters.fuelType);
    }

    // AC
    if (filters.hasAC) {
      result = result.filter((c) => c.hasAC);
    }

    // Price
    if (filters.maxPrice < 300) {
      result = result.filter((c) => c.pricePerDay <= filters.maxPrice);
    }

    // Seats
    if (filters.minSeats > 0) {
      result = result.filter((c) => c.seats >= filters.minSeats);
    }

    // Sort
    switch (sort) {
      case "price_asc":
        result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "price_desc":
        result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case "newest":
        result.sort((a, b) => b.year - a.year);
        break;
      case "seats_asc":
        result.sort((a, b) => a.seats - b.seats);
        break;
      default:
        result.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.sortOrder - b.sortOrder;
        });
    }

    return result;
  }, [cars, search, filters, sort]);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Category</label>
        <div className="space-y-1.5">
          <button
            onClick={() => setFilter("categorySlug", "")}
            className={cn("w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors", !filters.categorySlug ? "bg-navy-900 text-white" : "hover:bg-gray-100")}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setFilter("categorySlug", cat.slug)}
              className={cn("w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors", filters.categorySlug === cat.slug ? "bg-navy-900 text-white" : "hover:bg-gray-100")}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Transmission</label>
        <div className="space-y-1.5">
          {["", "AUTOMATIC", "MANUAL"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter("transmission", t)}
              className={cn("w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors", filters.transmission === t ? "bg-navy-900 text-white" : "hover:bg-gray-100")}
            >
              {t === "" ? "Any" : t === "AUTOMATIC" ? "Automatic" : "Manual"}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Fuel Type</label>
        <div className="space-y-1.5">
          {["", "PETROL", "DIESEL", "ELECTRIC", "HYBRID"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter("fuelType", f)}
              className={cn("w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors", filters.fuelType === f ? "bg-navy-900 text-white" : "hover:bg-gray-100")}
            >
              {f === "" ? "Any" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Max Daily Price: €{filters.maxPrice}
          {filters.maxPrice >= 300 ? "+" : ""}
        </label>
        <input
          type="range"
          min={20}
          max={300}
          step={5}
          value={filters.maxPrice}
          onChange={(e) => setFilter("maxPrice", Number(e.target.value))}
          className="w-full accent-navy-900"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>€20</span><span>€300+</span>
        </div>
      </div>

      {/* Min seats */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Minimum Seats</label>
        <div className="flex gap-2 flex-wrap">
          {[0, 2, 4, 5, 7, 9].map((n) => (
            <button
              key={n}
              onClick={() => setFilter("minSeats", n)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors", filters.minSeats === n ? "bg-navy-900 text-white border-navy-900" : "border-gray-200 hover:border-navy-300")}
            >
              {n === 0 ? "Any" : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Air con */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasAC"
          checked={filters.hasAC}
          onChange={(e) => setFilter("hasAC", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-navy-900"
        />
        <label htmlFor="hasAC" className="text-sm text-gray-700 font-medium">Air Conditioning Only</label>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={resetFilters} className="w-full py-2 text-sm text-crimson-600 hover:bg-crimson-50 rounded-lg transition-colors font-medium border border-crimson-200">
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-navy-900 py-12">
        <div className="page-container">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Our Fleet</h1>
          <p className="text-gray-400">
            {durationDays > 0
              ? `${filteredCars.length} cars available for ${durationDays} day${durationDays !== 1 ? "s" : ""}`
              : `${cars.length} vehicles available across Kosovo`}
          </p>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cars by brand, model, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors lg:hidden", filtersOpen ? "bg-navy-900 text-white border-navy-900" : "bg-white border-gray-200 hover:border-navy-300")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="form-input appearance-none pr-8 text-sm"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-navy-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-crimson-500 hover:underline">
                    Clear ({activeFilterCount})
                  </button>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile filters */}
          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-navy-900">Filters</h3>
                  <button onClick={() => setFiltersOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Cars grid */}
          <div className="flex-1">
            {filteredCars.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="font-bold text-navy-900 mb-2">No cars match your filters</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters.</p>
                <button onClick={resetFilters} className="btn-primary text-sm px-6 py-2.5">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    pickupLocationId={pickupLocationId}
                    dropoffLocationId={dropoffLocationId}
                    pickupDate={pickupDate}
                    pickupTime={pickupTime}
                    returnDate={returnDate}
                    returnTime={returnTime}
                    durationDays={durationDays}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
