import { Router } from "express";
import { db } from "@workspace/db";
import { devicesTable, licensesTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { logActivity } from "../lib/activity";

const router = Router();
router.use(requireAdmin);

router.get("/admin/devices", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const licenseId = req.query.licenseId ? Number(req.query.licenseId) : undefined;

    const rows = await db
      .select()
      .from(devicesTable)
      .where(licenseId ? eq(devicesTable.licenseId, licenseId) : undefined)
      .orderBy(desc(devicesTable.lastSeen))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(devicesTable)
      .where(licenseId ? eq(devicesTable.licenseId, licenseId) : undefined);

    res.json({
      data: rows.map((d) => ({
        id: d.id,
        licenseId: d.licenseId,
        deviceId: d.deviceId,
        deviceInfo: d.deviceInfo,
        firstSeen: d.firstSeen.toISOString(),
        lastSeen: d.lastSeen.toISOString(),
        isActive: d.isActive,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/devices/:id", async (req, res, next) => {
  try {
    const admin = (req as any).admin;
    const id = Number(req.params.id);
    const [deleted] = await db.delete(devicesTable).where(eq(devicesTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Device not found" });
      return;
    }
    await logActivity({ action: "device_removed", deviceId: deleted.deviceId, licenseId: deleted.licenseId, adminId: admin.id });
    res.json({ success: true, message: "Device removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
