import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type AuditAction = "search" | "purchase" | "verification" | "dispute" | "payout";

export function logAction(operatorId: string, action: AuditAction, detail: Record<string, unknown>) {
  return db.auditLogEntry.create({
    data: { operatorId, action, detail: detail as Prisma.InputJsonValue },
  });
}
