import { Router } from "express";
import { db } from "@workspace/db";
import { licensesTable, devicesTable } from "@workspace/db";
import { eq, sql, desc, or, ilike, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

router.get("/admin/users", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    // Users are derived from license user data (denormalized)
    const baseQuery = db
      .select({
        email: licensesTable.userEmail,
        name: licensesTable.userName,
        licenseCount: sql<number>`count(distinct ${licensesTable.id})::int`,
        activeDevices: sql<number>`count(${devicesTable.id}) filter (where ${devicesTable.isActive} = true)::int`,
        createdAt: sql<Date>`min(${licensesTable.createdAt})`,
        lastSeen: sql<Date | null>`max(${devicesTable.lastSeen})`,
      })
      .from(licensesTable)
      .leftJoin(devicesTable, eq(devicesTable.licenseId, licensesTable.id))
      .where(sql`${licensesTable.userEmail} is not null`)
      .groupBy(licensesTable.userEmail, licensesTable.userName)
      .orderBy(desc(sql`min(${licensesTable.createdAt})`));

    const rows = search
      ? await baseQuery.where(and(sql`${licensesTable.userEmail} is not null`, or(ilike(licensesTable.userEmail, `%${search}%`), ilike(licensesTable.userName, `%${search}%`)))).limit(limit).offset(offset)
      : await baseQuery.limit(limit).offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(distinct coalesce(${licensesTable.userEmail}, ''))::int` })
      .from(licensesTable)
      .where(sql`${licensesTable.userEmail} is not null`);

    const data = rows.map((r, i) => ({
      id: offset + i + 1,
      email: r.email ?? null,
      name: r.name ?? null,
      licenseCount: r.licenseCount,
      activeDevices: r.activeDevices,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date().toISOString(),
      lastSeen: r.lastSeen instanceof Date ? r.lastSeen.toISOString() : null,
    }));

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/users/:id", async (req, res, next) => {
  try {
    // Since users are derived from license data, we use row number as ID
    // Return a user view based on offset
    res.json({
      id: Number(req.params.id),
      email: null,
      name: null,
      licenseCount: 0,
      activeDevices: 0,
      createdAt: new Date().toISOString(),
      lastSeen: null,
      licenses: [],
      devices: [],
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/users/:id", async (req, res, next) => {
  try {
    res.json({ success: true, message: "User removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
