import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { ContactSubmissionsAdminClient } from "@/components/admin/contact-submissions-admin-client";
export default async function AdminContactSubmissionsPage() { const submissions = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } }); return <ContactSubmissionsAdminClient submissions={submissions} />; }
