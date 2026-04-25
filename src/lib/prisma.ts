// src/lib/prisma.ts
// Prisma singleton with a Decimal → number middleware.
// Prisma returns Decimal objects for NUMERIC schema fields. The middleware
// converts them to plain JS numbers so API responses and RSC props contain
// serialisable numbers, not Decimal instances (which JSON.stringify as strings).
import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function decimalToNumber(data: unknown): unknown {
  if (data == null) return data;
  if (data instanceof Prisma.Decimal) return data.toNumber();
  if (data instanceof Date) return data;
  if (Array.isArray(data)) return data.map(decimalToNumber);
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      out[k] = decimalToNumber(v);
    }
    return out;
  }
  return data;
}

function makePrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  // Convert every Decimal result to number so the rest of the app treats money
  // fields as plain numbers — consistent with how Float was handled before the
  // schema migration and safe to pass across RSC / JSON boundaries.
  client.$use(async (params, next) => {
    const result = await next(params);
    return decimalToNumber(result);
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
