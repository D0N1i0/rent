// src/app/(customer)/dashboard/layout.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Car } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const settings = await getPublicSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="page-container h-14 flex items-center justify-between">
          {/* Logo — always links back to homepage */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-8 w-8 bg-crimson-500 rounded-lg flex items-center justify-center group-hover:bg-crimson-400 transition-colors">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white hidden sm:block">{settings.businessName}</span>
          </Link>
          <DashboardNav user={{ name: session.user.name, email: session.user.email, role: session.user.role }} />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
