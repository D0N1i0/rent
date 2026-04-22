// src/app/(admin)/admin/page.tsx
// Redirect /admin → /admin/dashboard so the admin root is never a dead 404.
import { redirect } from "next/navigation";

export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
