import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { CategoriesAdminClient } from "@/components/admin/categories-admin-client";
export default async function AdminCategoriesPage() { const categories = await prisma.carCategory.findMany({ include: { _count: { select: { cars: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); return <CategoriesAdminClient categories={categories} />; }
