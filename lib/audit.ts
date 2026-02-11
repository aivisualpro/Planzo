import connectToDatabase from "@/lib/db";
import AuditTrail from "@/lib/models/AuditTrail";

export interface AuditLogParams {
  eventType: string;
  description: string;
  performedBy: string;
  performedByName?: string;
  workspaceId?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  milestoneId?: string;
  milestoneName?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

/**
 * Fire-and-forget audit trail logger.
 * Call this after any mutation (create/update/delete) to record the change.
 * Errors are caught and logged — never thrown — so it never blocks the API response.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await connectToDatabase();
    const eventId = `AE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await AuditTrail.create({ eventId, ...params });
  } catch (err) {
    // Non-critical — log to server console but never throw
    console.error("[AuditTrail] Failed to log event:", err);
  }
}

/**
 * Generates a human-readable diff-style description of changed fields.
 * Compares `before` and `after` objects and logs each changed field.
 */
export function diffFields(
  before: Record<string, any>,
  after: Record<string, any>,
  fieldsToTrack: string[]
): Array<{ field: string; oldValue: string; newValue: string }> {
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
  for (const field of fieldsToTrack) {
    const oldVal = String(before[field] ?? "");
    const newVal = String(after[field] ?? "");
    if (oldVal !== newVal) {
      changes.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}
