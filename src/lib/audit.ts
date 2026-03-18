/**
 * lib/audit.ts — Audit logging helper
 * Call this from any admin API route to record actions.
 */

import { prisma } from "@/lib/prisma";

export interface AuditEntry {
  action: string;       // e.g. "ban_user", "delete_job", "toggle_feature"
  actorId: string;      // Admin user ID
  actorEmail: string;   // Admin email
  targetType: string;   // "user" | "job" | "feature" | "blog"
  targetId?: string;    // ID of target record
  targetLabel?: string; // Human-readable label
  details?: Record<string, unknown>; // Extra data
}

/**
 * Log an admin action. Fire-and-forget — doesn't throw.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        targetLabel: entry.targetLabel ?? null,
        details: entry.details ? JSON.stringify(entry.details) : null,
      },
    });
  } catch (e) {
    console.error("[AuditLog] Failed to write:", e);
  }
}
