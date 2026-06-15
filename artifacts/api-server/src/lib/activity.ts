import { db } from "@workspace/db";
import { activityLogsTable } from "@workspace/db";

export async function logActivity(opts: {
  action: string;
  licenseId?: number | null;
  licenseKey?: string | null;
  deviceId?: string | null;
  adminId?: number | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    await db.insert(activityLogsTable).values({
      action: opts.action,
      licenseId: opts.licenseId ?? null,
      licenseKey: opts.licenseKey ?? null,
      deviceId: opts.deviceId ?? null,
      adminId: opts.adminId ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch {
    // Log silently
  }
}
