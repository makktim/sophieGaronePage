// app/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const hasDb = Boolean(process.env.DATABASE_URL);

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!hasDb) {
    throw new Error("Database disabled (DATABASE_URL missing).");
  }
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}
