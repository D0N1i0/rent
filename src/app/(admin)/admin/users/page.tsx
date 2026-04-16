// src/app/(admin)/admin/users/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Users, Eye, Search } from "lucide-react";

interface Props {
  searchParams: Promise<{ page?: string; role?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;
  const role = sp.role;
  const search = sp.search?.trim() ?? "";
  const validRoles = Object.values(Role);

  const where = {
    ...(role && validRoles.includes(role as Role) ? { role: role as Role } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total} user{total !== 1 ? "s" : ""} {search ? `matching "${search}"` : "registered"}</p>
        </div>
      </div>

      {/* Search + Role filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <form method="GET" className="flex flex-wrap gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name, email or phone..."
              className="form-input pl-9 text-sm"
            />
          </div>
          <select name="role" defaultValue={role ?? ""} className="form-input text-sm w-auto">
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admins</option>
          </select>
          <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
          {(search || role) && (
            <Link href="/admin/users" className="btn-secondary text-sm px-4 py-2">Clear</Link>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Email", "Phone", "Role", "Bookings", "Joined", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm text-navy-900">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`status-badge text-xs ${user.role === "ADMIN" ? "bg-red-50 text-red-700 border-red-200" : user.role === "STAFF" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{user._count.bookings}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`status-badge text-xs ${user.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/users/${user.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors inline-flex" title="View">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
            {search && <p className="text-gray-400 text-sm mt-1">Try a different search term</p>}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/users?page=${page - 1}${role ? `&role=${role}` : ""}${search ? `&search=${search}` : ""}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Previous</Link>}
            {page < totalPages && <Link href={`/admin/users?page=${page + 1}${role ? `&role=${role}` : ""}${search ? `&search=${search}` : ""}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
