import type { Session } from "next-auth";

export function getSessionRole(session: Session | null | undefined) {
  return session?.user?.role ?? null;
}

export function isAdminRole(role: string | null | undefined) {
  return role === "ADMIN" || role === "STAFF";
}
