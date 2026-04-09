import { db } from "@/lib/db";
import { auditLog } from "./schema";

interface AuditEntry {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Write an entry to the audit log. Fire-and-forget — errors are logged
 * to the console but never surface to the caller.
 */
export function writeAuditLog(entry: AuditEntry): void {
  db.insert(auditLog)
    .values({
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      metadata: entry.metadata ?? {},
      ipAddress: entry.ipAddress ?? null,
    })
    .catch((err) => {
      console.error("Audit log write failed:", err);
    });
}
