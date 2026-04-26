// Admin: delete a single maintenance log entry
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole, getSessionRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { id: carId, logId } = await params;

  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const log = await prisma.carMaintenanceLog.findFirst({ where: { id: logId, carId } });
  if (!log) return NextResponse.json({ error: "Log entry not found" }, { status: 404 });

  await prisma.carMaintenanceLog.delete({ where: { id: logId } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "MAINTENANCE_LOG_DELETED",
      entity: "Car",
      entityId: carId,
      details: { logId, maintenanceType: log.maintenanceType, serviceDate: log.serviceDate },
    },
  });

  return NextResponse.json({ success: true });
}
