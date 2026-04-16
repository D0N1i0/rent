// src/app/(admin)/admin/reviews/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ReviewsAdminClient } from "@/components/admin/reviews-admin-client";

export default async function AdminReviewsPage() {
  const reviews = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return <ReviewsAdminClient reviews={reviews} />;
}
