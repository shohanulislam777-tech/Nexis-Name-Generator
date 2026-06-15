import { Router } from "express";
import { db } from "@workspace/db";
import { licensesTable, devicesTable, activityLogsTable, plansTable } from "@workspace/db";
import { eq, like, and, sql, desc, ilike, or, inArray } from "drizzle-orm";
import { requireAdmin, generateLicenseKey } from "../lib/auth";
import { logActivity } from "../lib/activity";
import { randomUUID } from "crypto";

const router = Router();
router.use(requireAdmin);

function fmtLicense(l: typeof licensesTable.$inferSelect, planName?: string | null, activeDevices?: number) {
  return {
    id: l.id,
    key: l.key,
    status: l.status,
    planId: l.planId ?? null,
    planName: planName ?? null,
    userName: l.userName ?? null,
    userEmail: l.userEmail ?? null,
    maxDevices: l.maxDevices,
    activatedDevices: activeDevices ?? 0,
    expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
    activatedAt: l.activatedAt ? l.activatedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
    notes: l.notes ?? null,
  };
}

router.get("/admin/licenses", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const planId = req.query.planId ? Number(req.query.planId) : undefined;

    const conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(licensesTable.status, status));
    if (planId) conditions.push(eq(licensesTable.planId, planId));

    const baseQuery = db
      .select({
        l: licensesTable,
        planName: plansTable.name,
        activeDevices: sql<number>`count(${devicesTable.id}) filter (where ${devicesTable.isActive} = true)::int`,
      })
      .from(licensesTable)
      .leftJoin(plansTable, eq(licensesTable.planId, plansTable.id))
      .leftJoin(devicesTable, eq(devicesTable.licenseId, licensesTable.id))
      .groupBy(licensesTable.id, plansTable.name)
      .orderBy(desc(licensesTable.createdAt));

    let rows;
    let totalRows;

    if (search) {
      const s = `%${search}%`;
      rows = await baseQuery
        .where(and(...conditions, or(ilike(licensesTable.key, s), ilike(licensesTable.userName, s), ilike(licensesTable.userEmail, s))))
        .limit(limit)
        .offset(offset);
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(licensesTable)
        .where(and(...conditions, or(ilike(licensesTable.key, s), ilike(licensesTable.userName, s), ilike(licensesTable.userEmail, s))));
      totalRows = total;
    } else {
      rows = await baseQuery.where(and(...conditions)).limit(limit).offset(offset);
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(licensesTable)
        .where(and(...conditions));
      totalRows = total;
    }

    res.json({
      data: rows.map((r) => fmtLicense(r.l, r.planName, r.activeDevices)),
      total: totalRows,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/licenses", async (req, res, next) => {
  try {
    const admin = (req as any).admin;
    const { planId, userName, userEmail, maxDevices, expiresAt, notes, isTrial } = req.body;
    const key = generateLicenseKey();
    const status = isTrial ? "trial" : "active";
    const [license] = await db
      .insert(licensesTable)
      .values({
        key,
        status,
        planId: planId ?? null,
        userName: userName ?? null,
        userEmail: userEmail ?? null,
        maxDevices: maxDevices ?? 1,
        isTrial: isTrial ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes ?? null,
      })
      .returning();
    await logActivity({ action: "license_created", licenseId: license.id, licenseKey: license.key, adminId: admin.id });
    res.status(201).json(fmtLicense(license));
  } catch (err) {
    next(err);
  }
});

router.post("/admin/licenses/bulk-generate", async (req, res, next) => {
  try {
    const admin = (req as any).admin;
    const { count, planId, maxDevices, expiresAt, isTrial } = req.body;
    const n = Math.min(500, Math.max(1, Number(count) || 1));
    const values = Array.from({ length: n }, () => ({
      key: generateLicenseKey(),
      status: isTrial ? "trial" : "active",
      planId: planId ?? null,
      maxDevices: maxDevices ?? 1,
      isTrial: isTrial ?? false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }));
    const licenses = await db.insert(licensesTable).values(values).returning();
    await logActivity({ action: "licenses_bulk_generated", adminId: admin.id, metadata: { count: n } });
    res.status(201).json(licenses.map((l) => fmtLicense(l)));
  } catch (err) {
    next(err);
  }
});

router.get("/admin/licenses/export", async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const rows = await db
      .select({ l: licensesTable, planName: plansTable.name })
      .from(licensesTable)
      .leftJoin(plansTable, eq(licensesTable.planId, plansTable.id))
      .where(status ? eq(licensesTable.status, status) : undefined)
      .orderBy(desc(licensesTable.createdAt));

    const header = "ID,Key,Status,Plan,User Name,User Email,Max Devices,Expires At,Created At\n";
    const csvRows = rows.map((r) =>
      [
        r.l.id,
        r.l.key,
        r.l.status,
        r.planName ?? "",
        r.l.userName ?? "",
        r.l.userEmail ?? "",
        r.l.maxDevices,
        r.l.expiresAt ? r.l.expiresAt.toISOString() : "",
        r.l.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="nexis-licenses-${Date.now()}.csv"`);
    res.send(header + csvRows.join("\n"));
  } catch (err) {
    next(err);
  }
});

router.get("/admin/licenses/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({ l: licensesTable, planName: plansTable.name })
      .from(licensesTable)
      .leftJoin(plansTable, eq(licensesTable.planId, plansTable.id))
      .where(eq(licensesTable.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "License not found" });
      return;
    }

    const devices = await db.select().from(devicesTable).where(eq(devicesTable.licenseId, id)).orderBy(desc(devicesTable.lastSeen));
    const recentActivity = await db
      .select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.licenseId, id))
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(20);

    const activeDevices = devices.filter((d) => d.isActive).length;

    res.json({
      ...fmtLicense(row.l, row.planName, activeDevices),
      devices: devices.map((d) => ({
        id: d.id,
        licenseId: d.licenseId,
        deviceId: d.deviceId,
        deviceInfo: d.deviceInfo,
        firstSeen: d.firstSeen.toISOString(),
        lastSeen: d.lastSeen.toISOString(),
        isActive: d.isActive,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        licenseId: a.licenseId,
        licenseKey: a.licenseKey,
        deviceId: a.deviceId,
        adminId: a.adminId,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/admin/licenses/:id", async (req, res, next) => {
  try {
    const admin = (req as any).admin;
    const id = Number(req.params.id);
    const { status, planId, userName, userEmail, maxDevices, expiresAt, notes } = req.body;
    const update: Partial<typeof licensesTable.$inferInsert> = {};
    if (status !== undefined) update.status = status;
    if (planId !== undefined) update.planId = planId;
    if (userName !== undefined) update.userName = userName;
    if (userEmail !== undefined) update.userEmail = userEmail;
    if (maxDevices !== undefined) update.maxDevices = maxDevices;
    if (expiresAt !== undefined) update.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (notes !== undefined) update.notes = notes;
    update.updatedAt = new Date();

    const [updated] = await db.update(licensesTable).set(update).where(eq(licensesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "License not found" });
      return;
    }
    await logActivity({ action: "license_updated", licenseId: id, licenseKey: updated.key, adminId: admin.id });
    res.json(fmtLicense(updated));
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/licenses/:id", async (req, res, next) => {
  try {
    const admin = (req as any).admin;
    const id = Number(req.params.id);
    const [deleted] = await db.delete(licensesTable).where(eq(licensesTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "License not found" });
      return;
    }
    await logActivity({ action: "license_deleted", licenseId: id, licenseKey: deleted.key, adminId: admin.id });
    res.json({ success: true, message: "License deleted" });
  } catch (err) {
    next(err);
  }
});

async function setLicenseStatus(req: any, res: any, next: any, status: string, action: string) {
  try {
    const admin = req.admin;
    const id = Number(req.params.id);
    const [updated] = await db
      .update(licensesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(licensesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "License not found" });
      return;
    }
    await logActivity({ action, licenseId: id, licenseKey: updated.key, adminId: admin.id });
    res.json(fmtLicense(updated));
  } catch (err) {
    next(err);
  }
}

router.post("/admin/licenses/:id/suspend", (req, res, next) => setLicenseStatus(req, res, next, "suspended", "license_suspended"));
router.post("/admin/licenses/:id/activate", (req, res, next) => setLicenseStatus(req, res, next, "active", "license_activated_admin"));
router.post("/admin/licenses/:id/revoke", (req, res, next) => setLicenseStatus(req, res, next, "revoked", "license_revoked"));

router.post("/admin/licenses/:id/renew", async (req, res, next) => {
  try {
    const admin = (req as any).admin;
    const id = Number(req.params.id);
    const { expiresAt } = req.body;
    const [updated] = await db
      .update(licensesTable)
      .set({ status: "active", expiresAt: new Date(expiresAt), updatedAt: new Date() })
      .where(eq(licensesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "License not found" });
      return;
    }
    await logActivity({ action: "license_renewed", licenseId: id, licenseKey: updated.key, adminId: admin.id });
    res.json(fmtLicense(updated));
  } catch (err) {
    next(err);
  }
});

export default router;
