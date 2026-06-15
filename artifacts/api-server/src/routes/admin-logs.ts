import { Router } from "express";
import { db } from "@workspace/db";
import { activityLogsTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

router.get("/admin/activity-logs", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const action = req.query.action as string | undefined;
    const licenseId = req.query.licenseId ? Number(req.query.licenseId) : undefined;

    const conditions = [];
    if (action) conditions.push(eq(activityLogsTable.action, action));
    if (licenseId) conditions.push(eq(activityLogsTable.licenseId, licenseId));

    const rows = await db
      .select()
      .from(activityLogsTable)
      .where(conditions.length ? and(...(conditions as [any, ...any[]])) : undefined)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(activityLogsTable)
      .where(conditions.length ? and(...(conditions as [any, ...any[]])) : undefined);

    res.json({
      data: rows.map((a) => ({
        id: a.id,
        action: a.action,
        licenseId: a.licenseId,
        licenseKey: a.licenseKey,
        deviceId: a.deviceId,
        adminId: a.adminId,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
